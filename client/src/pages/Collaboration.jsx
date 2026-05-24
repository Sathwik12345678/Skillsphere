import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ButtonLoader from "../components/ButtonLoader";

const emptyReview = {
  reviewee: "",
  rating: "5",
  comment: "",
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const getInitials = (name = "S") =>
  name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function Collaboration() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [user, setUser] = useState(getStoredUser);
  const [directory, setDirectory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedUser, setSelectedUser] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [reviewForm, setReviewForm] = useState(emptyReview);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const activePeer = useMemo(() => {
    if (!activeConversation || !user) return null;
    return activeConversation.participants.find((participant) => participant._id !== user._id);
  }, [activeConversation, user]);

  const loadMessages = async (conversation) => {
    if (!conversation) return;

    try {
      const res = await api.get(`/conversations/${conversation._id}/messages`);
      setMessages(res.data.messages || []);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not load messages");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const bootstrap = async () => {
      try {
        const [profileRes, directoryRes, conversationRes, notificationRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/auth/directory"),
          api.get("/conversations"),
          api.get("/notifications"),
        ]);

        const nextUser = profileRes.data.user;
        setUser(nextUser);
        setDirectory(directoryRes.data.users || []);
        setConversations(conversationRes.data.conversations || []);
        setNotifications(notificationRes.data.notifications || []);
        localStorage.setItem("user", JSON.stringify(nextUser));

        const reviewRes = await api.get("/reviews", { params: { userId: nextUser._id } });
        setReviews(reviewRes.data.reviews || []);
        setAverageRating(reviewRes.data.averageRating || 0);
      } catch (error) {
        toast.error(error.response?.data?.msg || "Could not load collaboration workspace");
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    const socket = io("http://localhost:5000", {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("message:new", (message) => {
      setMessages((current) =>
        current.some((item) => item._id === message._id) ? current : [...current, message]
      );
      setConversations((current) =>
        current.map((conversation) =>
          conversation._id === message.conversation
            ? {
                ...conversation,
                lastMessage: message.body,
                lastMessageAt: message.createdAt,
              }
            : conversation
        )
      );
    });

    socket.on("notification:new", (notification) => {
      setNotifications((current) => [notification, ...current]);
      toast(notification.title);
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    if (!activeConversation || !socketRef.current) return;

    socketRef.current.emit("conversation:join", activeConversation._id);
    loadMessages(activeConversation);

    return () => {
      socketRef.current?.emit("conversation:leave", activeConversation._id);
    };
  }, [activeConversation]);

  const startConversation = async (event) => {
    event.preventDefault();

    if (!selectedUser) return;

    try {
      const res = await api.post("/conversations", { participantId: selectedUser });
      const nextConversation = res.data.conversation;
      setConversations((current) => {
        const exists = current.some((conversation) => conversation._id === nextConversation._id);
        return exists
          ? current.map((conversation) =>
              conversation._id === nextConversation._id ? nextConversation : conversation
            )
          : [nextConversation, ...current];
      });
      setActiveConversation(nextConversation);
      setSelectedUser("");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not start chat");
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!activeConversation || !messageBody.trim()) return;

    setSending(true);

    try {
      const res = await api.post(`/conversations/${activeConversation._id}/messages`, {
        body: messageBody,
      });
      setMessages((current) =>
        current.some((message) => message._id === res.data.message._id)
          ? current
          : [...current, res.data.message]
      );
      setMessageBody("");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setSavingReview(true);

    try {
      const res = await api.post("/reviews", reviewForm);
      toast.success("Review submitted");
      setReviewForm(emptyReview);

      if (res.data.review.reviewee?._id === user?._id) {
        setReviews((current) => [res.data.review, ...current]);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not submit review");
    } finally {
      setSavingReview(false);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await api.patch("/notifications/read-all");
      setNotifications(res.data.notifications || []);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Could not update notifications");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-24 text-white">
        <ButtonLoader label="Loading collaboration" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-16 pt-32 lg:px-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="grid gap-6 xl:grid-cols-[0.95fr_1.4fr]"
      >
        <aside className="grid content-start gap-6">
          <section className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Messaging</p>
                <h1 className="mt-3 font-display text-4xl font-bold text-white">
                  Collaboration hub
                </h1>
              </div>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                Live
              </span>
            </div>

            <form onSubmit={startConversation} className="mt-6 grid gap-3">
              <select
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                value={selectedUser}
                onChange={(event) => setSelectedUser(event.target.value)}
              >
                <option value="">Choose a user</option>
                {directory.map((person) => (
                  <option key={person._id} value={person._id}>
                    {person.name} - {person.role}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1"
              >
                Start Chat
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              {conversations.length ? (
                conversations.map((conversation) => {
                  const peer = conversation.participants.find(
                    (participant) => participant._id !== user?._id
                  );
                  const isActive = activeConversation?._id === conversation._id;

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() => setActiveConversation(conversation)}
                      className={`grid gap-1 rounded-2xl border p-4 text-left ${
                        isActive
                          ? "border-cyan-300/50 bg-cyan-300/15"
                          : "border-white/10 bg-white/10 hover:bg-white/15"
                      }`}
                    >
                      <span className="font-semibold text-white">{peer?.name || "Conversation"}</span>
                      <span className="line-clamp-1 text-sm text-slate-300">
                        {conversation.lastMessage || "No messages yet"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
                  No conversations yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Notifications</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-white">{unreadCount} unread</h2>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Mark read
              </button>
            </div>

            <div className="mt-5 grid max-h-96 gap-3 overflow-y-auto pr-1">
              {notifications.length ? (
                notifications.map((notification) => (
                  <article
                    key={notification._id}
                    className={`rounded-2xl border p-4 ${
                      notification.read
                        ? "border-white/10 bg-white/5"
                        : "border-cyan-300/25 bg-cyan-300/10"
                    }`}
                  >
                    <p className="font-semibold text-white">{notification.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{notification.message}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
                  You are all caught up.
                </p>
              )}
            </div>
          </section>
        </aside>

        <section className="grid content-start gap-6">
          <section className="rounded-[28px] border border-white/15 bg-white/10 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
            <div className="flex items-center gap-4 border-b border-white/10 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-white to-cyan-300 font-extrabold text-slate-950">
                {getInitials(activePeer?.name || user?.name)}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Chat</p>
                <h2 className="font-display text-2xl font-bold text-white">
                  {activePeer?.name || "Select a conversation"}
                </h2>
              </div>
            </div>

            <div className="grid h-[430px] content-end gap-3 overflow-y-auto p-5">
              {activeConversation ? (
                messages.length ? (
                  messages.map((message) => {
                    const mine = (message.sender?._id || message.sender) === user?._id;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                            mine
                              ? "bg-cyan-300 text-slate-950"
                              : "border border-white/10 bg-white/10 text-white"
                          }`}
                        >
                          <p className="text-sm font-semibold">
                            {mine ? "You" : message.sender?.name || "Teammate"}
                          </p>
                          <p className="mt-1 leading-6">{message.body}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="self-center text-center text-slate-300">
                    Send the first message to begin.
                  </p>
                )
              ) : (
                <p className="self-center text-center text-slate-300">
                  Pick a conversation or start a new one.
                </p>
              )}
            </div>

            <form onSubmit={sendMessage} className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-[1fr_auto]">
              <input
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Write a message"
                disabled={!activeConversation}
              />
              <button
                type="submit"
                disabled={!activeConversation || sending}
                className="rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 px-6 py-3 font-bold text-slate-950 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? <ButtonLoader label="Sending" /> : "Send"}
              </button>
            </form>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form
              onSubmit={submitReview}
              className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl"
            >
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Review UI</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-white">Leave feedback</h2>

              <div className="mt-6 grid gap-3">
                <select
                  className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  value={reviewForm.reviewee}
                  onChange={(event) =>
                    setReviewForm((current) => ({ ...current, reviewee: event.target.value }))
                  }
                  required
                >
                  <option value="">Choose a teammate</option>
                  {directory.map((person) => (
                    <option key={person._id} value={person._id}>
                      {person.name}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  type="number"
                  min="1"
                  max="5"
                  value={reviewForm.rating}
                  onChange={(event) =>
                    setReviewForm((current) => ({ ...current, rating: event.target.value }))
                  }
                  required
                />
                <textarea
                  className="min-h-28 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-300/50 placeholder:text-slate-400"
                  value={reviewForm.comment}
                  onChange={(event) =>
                    setReviewForm((current) => ({ ...current, comment: event.target.value }))
                  }
                  placeholder="What went well?"
                  required
                />
                <button
                  type="submit"
                  disabled={savingReview}
                  className="rounded-2xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 font-bold text-slate-950 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingReview ? <ButtonLoader label="Saving review" /> : "Submit Review"}
                </button>
              </div>
            </form>

            <div className="rounded-[28px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_120px_rgba(8,15,31,0.35)] backdrop-blur-2xl">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Your reviews</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-white">
                    {averageRating || "0.0"} average
                  </h2>
                </div>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100">
                  {reviews.length} total
                </span>
              </div>

              <div className="mt-5 grid max-h-80 gap-3 overflow-y-auto pr-1">
                {reviews.length ? (
                  reviews.map((review) => (
                    <article key={review._id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{review.reviewer?.name}</p>
                        <p className="font-bold text-amber-200">{review.rating}/5</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{review.comment}</p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
                    Reviews will appear here as teammates rate you.
                  </p>
                )}
              </div>
            </div>
          </section>
        </section>
      </motion.section>
    </main>
  );
}
