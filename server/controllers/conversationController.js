const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { createNotification } = require("../utils/notifications");

const conversationRoom = (conversationId) => `conversation:${conversationId}`;

const isParticipant = (conversation, userId) =>
  conversation.participants.some((participant) => String(participant._id || participant) === userId);

const serializeConversation = (conversation) => ({
  _id: conversation._id,
  participants: conversation.participants,
  gig: conversation.gig,
  lastMessage: conversation.lastMessage,
  lastMessageAt: conversation.lastMessageAt,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
});

const serializeMessage = (message) => ({
  _id: message._id,
  conversation: message.conversation,
  sender: message.sender,
  body: message.body,
  readBy: message.readBy,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate("participants", "name email role")
      .populate("gig", "title")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    return res.json({ conversations: conversations.map(serializeConversation) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load conversations", error: error.message });
  }
};

exports.startConversation = async (req, res) => {
  try {
    const { participantId, gigId } = req.body;

    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ msg: "A valid participant is required" });
    }

    if (participantId === req.user.id) {
      return res.status(400).json({ msg: "Choose another user to start a chat" });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ msg: "Participant not found" });
    }

    const participants = [req.user.id, participantId].sort();
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: participants.length },
      gig: gigId || null,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        gig: gigId || null,
      });
    }

    await conversation.populate("participants", "name email role");
    await conversation.populate("gig", "title");

    return res.status(201).json({ conversation: serializeConversation(conversation) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not start conversation", error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !isParticipant(conversation, req.user.id)) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 })
      .limit(120);

    return res.json({ messages: messages.map(serializeMessage) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not load messages", error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { body } = req.body;

    if (!body || !String(body).trim()) {
      return res.status(400).json({ msg: "Message cannot be empty" });
    }

    const conversation = await Conversation.findById(req.params.id).populate(
      "participants",
      "name email role"
    );

    if (!conversation || !isParticipant(conversation, req.user.id)) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      body: String(body).trim(),
      readBy: [req.user.id],
    });

    await message.populate("sender", "name email role");

    conversation.lastMessage = message.body;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      io.to(conversationRoom(conversation._id)).emit("message:new", serializeMessage(message));
    }

    await Promise.all(
      conversation.participants
        .filter((participant) => String(participant._id) !== req.user.id)
        .map((participant) =>
          createNotification(req.app, {
            user: participant._id,
            type: "message",
            title: "New message",
            message: `${message.sender.name}: ${message.body.slice(0, 80)}`,
            link: "/collaboration",
          })
        )
    );

    return res.status(201).json({ message: serializeMessage(message) });
  } catch (error) {
    return res.status(500).json({ msg: "Could not send message", error: error.message });
  }
};
