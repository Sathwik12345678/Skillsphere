const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Gig = require("../models/Gig");
const Proposal = require("../models/Proposal");
const Review = require("../models/Review");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DEMO_EMAIL_DOMAIN = "skillsphere.demo";
const DEMO_PASSWORD = "Demo@12345";

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const users = [
  {
    key: "admin",
    name: "Aarav Mehta",
    email: "aarav.admin@skillsphere.demo",
    role: "admin",
    skills: ["Operations", "Quality Review", "Talent Matching"],
    bio: "Marketplace operations lead focused on healthy client and freelancer workflows.",
  },
  {
    key: "clientHealth",
    name: "Priya Nair",
    email: "priya.healthbridge@skillsphere.demo",
    role: "client",
    skills: ["Product Strategy", "Healthcare", "SaaS"],
    bio: "Founder at HealthBridge Labs building patient onboarding tools for clinics.",
  },
  {
    key: "clientRetail",
    name: "Rohan Kapoor",
    email: "rohan.novaretail@skillsphere.demo",
    role: "client",
    skills: ["Retail", "Analytics", "Customer Experience"],
    bio: "Growth manager at NovaRetail, scaling a regional omnichannel commerce platform.",
  },
  {
    key: "clientClimate",
    name: "Meera Iyer",
    email: "meera.greengrid@skillsphere.demo",
    role: "client",
    skills: ["Climate Tech", "Data Products", "Partnerships"],
    bio: "Program director at GreenGrid Insights, turning energy data into field-ready dashboards.",
  },
  {
    key: "freelancerReact",
    name: "Neha Sharma",
    email: "neha.react@skillsphere.demo",
    role: "freelancer",
    skills: ["React", "TypeScript", "Tailwind CSS", "Accessibility"],
    bio: "Frontend engineer who builds polished dashboards, onboarding flows, and design systems.",
  },
  {
    key: "freelancerNode",
    name: "Kabir Khan",
    email: "kabir.backend@skillsphere.demo",
    role: "freelancer",
    skills: ["Node.js", "Express", "MongoDB", "API Design"],
    bio: "Backend developer specializing in marketplace APIs, auth, and reliable data models.",
  },
  {
    key: "freelancerDesign",
    name: "Ananya Rao",
    email: "ananya.design@skillsphere.demo",
    role: "freelancer",
    skills: ["UI/UX Design", "Figma", "Design Systems", "User Research"],
    bio: "Product designer helping startups clarify flows, visual systems, and conversion paths.",
  },
  {
    key: "freelancerData",
    name: "Vikram Singh",
    email: "vikram.data@skillsphere.demo",
    role: "freelancer",
    skills: ["Python", "Power BI", "SQL", "Data Visualization"],
    bio: "Data analyst building executive dashboards and automated reporting pipelines.",
  },
  {
    key: "freelancerContent",
    name: "Sara Fernandes",
    email: "sara.content@skillsphere.demo",
    role: "freelancer",
    skills: ["Content Writing", "SEO", "B2B SaaS", "Case Studies"],
    bio: "Content strategist writing landing pages, knowledge base articles, and launch campaigns.",
  },
];

const gigs = [
  {
    key: "clinicPortal",
    clientKey: "clientHealth",
    title: "Build a patient onboarding portal for a clinic network",
    description:
      "HealthBridge Labs needs a responsive onboarding portal where clinic staff can invite patients, collect intake details, upload documents, and track completion status. The first release should include role-aware dashboards, form validation, and a clean handoff to our internal API team.",
    category: "Web Development",
    skills: ["React", "Node.js", "MongoDB", "Tailwind CSS"],
    budget: 4800,
    deadline: addDays(28),
    status: "open",
  },
  {
    key: "retailDashboard",
    clientKey: "clientRetail",
    title: "Create an executive sales dashboard for retail leadership",
    description:
      "NovaRetail wants a dashboard that combines weekly store revenue, online conversion, inventory alerts, and campaign performance. The deliverable should include clear KPI cards, charts for trend comparison, and export-ready reporting views for leadership meetings.",
    category: "Data",
    skills: ["Power BI", "SQL", "Data Visualization", "Analytics"],
    budget: 3200,
    deadline: addDays(21),
    status: "open",
  },
  {
    key: "climateLanding",
    clientKey: "clientClimate",
    title: "Redesign a landing page for a climate analytics product",
    description:
      "GreenGrid Insights is launching a product page for city energy teams. We need a designer to refine the narrative, visual hierarchy, proof points, and responsive Figma mockups before our engineering sprint begins.",
    category: "UI/UX Design",
    skills: ["UI/UX Design", "Figma", "User Research", "Design Systems"],
    budget: 2500,
    deadline: addDays(18),
    status: "open",
  },
  {
    key: "saasContent",
    clientKey: "clientHealth",
    title: "Write a healthcare SaaS launch content package",
    description:
      "We need a launch package for a new patient engagement feature: landing page copy, three support articles, email announcement copy, and one customer story outline. The tone should be clear, compliant, and useful for clinic operations teams.",
    category: "Content Writing",
    skills: ["Content Writing", "SEO", "B2B SaaS", "Case Studies"],
    budget: 1400,
    deadline: addDays(14),
    status: "open",
  },
  {
    key: "inventoryMobile",
    clientKey: "clientRetail",
    title: "Prototype a mobile inventory audit app",
    description:
      "Our store teams need a lightweight mobile prototype for shelf audits, barcode checks, and discrepancy notes. We want clickable screens, interaction specs, and an implementation-ready flow for Android-first usage.",
    category: "Mobile App",
    skills: ["Mobile App", "UI/UX Design", "Figma", "Product Design"],
    budget: 3600,
    deadline: addDays(35),
    status: "in_review",
  },
  {
    key: "apiHardening",
    clientKey: "clientClimate",
    title: "Harden a Node.js API for partner data ingestion",
    description:
      "Our ingestion API receives hourly meter readings from pilot partners. We need validation improvements, better error responses, request logging, and a short reliability checklist before expanding the pilot.",
    category: "Web Development",
    skills: ["Node.js", "Express", "MongoDB", "API Design"],
    budget: 4200,
    deadline: addDays(24),
    status: "open",
  },
  {
    key: "campaignAudit",
    clientKey: "clientRetail",
    title: "Audit paid search campaigns and prepare a growth plan",
    description:
      "Review current Google Ads campaigns, identify wasted spend, improve keyword grouping, and prepare a 30-day testing plan with landing page recommendations. We need practical fixes, not a generic strategy deck.",
    category: "Marketing",
    skills: ["Marketing", "Google Ads", "Analytics", "Conversion Optimization"],
    budget: 1800,
    deadline: addDays(12),
    status: "open",
  },
  {
    key: "careTeamReview",
    clientKey: "clientHealth",
    title: "Improve care team collaboration screens",
    description:
      "A previous sprint shipped the first version of our care team collaboration area. We need UX review, component cleanup, and implementation support for message states, unread indicators, and handoff notes.",
    category: "UI/UX Design",
    skills: ["React", "UI/UX Design", "Accessibility", "Design Systems"],
    budget: 3000,
    deadline: addDays(16),
    status: "closed",
  },
];

const proposals = [
  {
    gigKey: "clinicPortal",
    freelancerKey: "freelancerReact",
    bidAmount: 4600,
    timeline: "4 weeks",
    status: "shortlisted",
    coverLetter:
      "I can build the portal in milestones: intake forms, staff dashboard, document upload states, and accessibility review. I have shipped healthcare onboarding flows with React and Tailwind and can coordinate cleanly with your API team.",
  },
  {
    gigKey: "clinicPortal",
    freelancerKey: "freelancerNode",
    bidAmount: 5100,
    timeline: "5 weeks",
    status: "submitted",
    coverLetter:
      "I would focus on reliable form persistence, audit-friendly API contracts, and secure document metadata handling. I can also prepare the backend handoff documentation your internal team will need.",
  },
  {
    gigKey: "retailDashboard",
    freelancerKey: "freelancerData",
    bidAmount: 3000,
    timeline: "3 weeks",
    status: "accepted",
    coverLetter:
      "I can consolidate sales, inventory, and campaign metrics into a dashboard designed for weekly leadership reviews. I will include KPI definitions, refresh notes, and export-friendly report pages.",
  },
  {
    gigKey: "climateLanding",
    freelancerKey: "freelancerDesign",
    bidAmount: 2400,
    timeline: "2 weeks",
    status: "shortlisted",
    coverLetter:
      "I will restructure the page around the energy team use case, build a concise visual system in Figma, and provide responsive mockups with components your engineering team can reuse.",
  },
  {
    gigKey: "saasContent",
    freelancerKey: "freelancerContent",
    bidAmount: 1350,
    timeline: "10 days",
    status: "submitted",
    coverLetter:
      "I can create a launch package that balances clarity and trust for clinic operators. I will start with messaging pillars, then deliver landing copy, help content, email copy, and a customer story outline.",
  },
  {
    gigKey: "apiHardening",
    freelancerKey: "freelancerNode",
    bidAmount: 3900,
    timeline: "3 weeks",
    status: "submitted",
    coverLetter:
      "I can audit the ingestion flow, add validation boundaries, improve API error semantics, and document operational checks so the next pilot rollout has fewer surprises.",
  },
  {
    gigKey: "campaignAudit",
    freelancerKey: "freelancerContent",
    bidAmount: 1650,
    timeline: "9 days",
    status: "submitted",
    coverLetter:
      "I can pair campaign review with landing page messaging recommendations, so your ad spend and destination pages work together around the same buyer intent.",
  },
  {
    gigKey: "careTeamReview",
    freelancerKey: "freelancerReact",
    bidAmount: 2900,
    timeline: "2 weeks",
    status: "accepted",
    coverLetter:
      "I can tighten the collaboration UI and implementation together, including unread states, message affordances, and keyboard-accessible interaction patterns.",
  },
];

const reviews = [
  {
    gigKey: "careTeamReview",
    reviewerKey: "clientHealth",
    revieweeKey: "freelancerReact",
    rating: 5,
    comment:
      "Neha improved the collaboration flow quickly and left the frontend cleaner than she found it. The unread states and accessibility pass were especially strong.",
  },
  {
    gigKey: "retailDashboard",
    reviewerKey: "clientRetail",
    revieweeKey: "freelancerData",
    rating: 5,
    comment:
      "Vikram translated messy retail data into a dashboard our leadership team could use immediately. Clear definitions, useful charts, and thoughtful follow-up notes.",
  },
  {
    reviewerKey: "freelancerDesign",
    revieweeKey: "clientClimate",
    rating: 4,
    comment:
      "Meera gave focused feedback and had a clear product story. The project scope was practical, and review cycles were fast.",
  },
];

const notifications = [
  {
    userKey: "clientHealth",
    type: "proposal",
    title: "New proposal received",
    message: "Neha Sharma submitted a proposal for the patient onboarding portal.",
    link: "/gigs",
    read: false,
  },
  {
    userKey: "freelancerReact",
    type: "proposal",
    title: "Proposal shortlisted",
    message: "Your proposal for the patient onboarding portal was shortlisted.",
    link: "/gigs",
    read: false,
  },
  {
    userKey: "freelancerData",
    type: "review",
    title: "New review received",
    message: "Rohan Kapoor rated you 5/5 for the executive dashboard project.",
    link: "/collaboration",
    read: true,
  },
  {
    userKey: "admin",
    type: "system",
    title: "Demo marketplace seeded",
    message: "Realistic demo users, gigs, proposals, reviews, and conversations are available.",
    link: "/dashboard",
    read: false,
  },
];

const conversations = [
  {
    key: "clinicChat",
    participantKeys: ["clientHealth", "freelancerReact"],
    gigKey: "clinicPortal",
    messages: [
      {
        senderKey: "clientHealth",
        body: "Thanks for the proposal. Can you include document upload states in the first milestone?",
        createdAt: daysAgo(3),
      },
      {
        senderKey: "freelancerReact",
        body: "Yes. I would include upload progress, validation messages, and a staff review state in milestone one.",
        createdAt: daysAgo(2),
      },
      {
        senderKey: "clientHealth",
        body: "Great. Please also account for clinic staff using tablets during intake.",
        createdAt: daysAgo(1),
      },
    ],
  },
  {
    key: "dashboardChat",
    participantKeys: ["clientRetail", "freelancerData"],
    gigKey: "retailDashboard",
    messages: [
      {
        senderKey: "freelancerData",
        body: "I mapped the dashboard into sales, inventory, and campaign tabs so leadership can scan it quickly.",
        createdAt: daysAgo(4),
      },
      {
        senderKey: "clientRetail",
        body: "That structure works. Please keep weekly store comparison visible on the first screen.",
        createdAt: daysAgo(3),
      },
    ],
  },
];

const clearDemoData = async () => {
  const demoUsers = await User.find({ email: new RegExp(`@${DEMO_EMAIL_DOMAIN}$`) }).select("_id");
  const demoUserIds = demoUsers.map((user) => user._id);
  const demoGigs = await Gig.find({ client: { $in: demoUserIds } }).select("_id");
  const demoGigIds = demoGigs.map((gig) => gig._id);
  const demoConversations = await Conversation.find({ participants: { $in: demoUserIds } }).select("_id");
  const demoConversationIds = demoConversations.map((conversation) => conversation._id);

  await Promise.all([
    Message.deleteMany({ conversation: { $in: demoConversationIds } }),
    Notification.deleteMany({ user: { $in: demoUserIds } }),
    Review.deleteMany({
      $or: [
        { reviewer: { $in: demoUserIds } },
        { reviewee: { $in: demoUserIds } },
        { gig: { $in: demoGigIds } },
      ],
    }),
    Proposal.deleteMany({
      $or: [{ freelancer: { $in: demoUserIds } }, { gig: { $in: demoGigIds } }],
    }),
    Conversation.deleteMany({ _id: { $in: demoConversationIds } }),
    Gig.deleteMany({ _id: { $in: demoGigIds } }),
  ]);

  await User.deleteMany({ _id: { $in: demoUserIds } });
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

  await clearDemoData();

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const insertedUsers = await User.insertMany(
    users.map(({ key, ...user }) => ({ ...user, password })),
    { ordered: true }
  );
  const createdUsers = users.reduce((map, user, index) => {
    map[user.key] = insertedUsers[index];
    return map;
  }, {});

  const createdGigs = {};
  for (const gig of gigs) {
    createdGigs[gig.key] = await Gig.create({
      ...gig,
      client: createdUsers[gig.clientKey]._id,
    });
  }

  await Proposal.insertMany(
    proposals.map((proposal) => ({
      gig: createdGigs[proposal.gigKey]._id,
      freelancer: createdUsers[proposal.freelancerKey]._id,
      coverLetter: proposal.coverLetter,
      bidAmount: proposal.bidAmount,
      timeline: proposal.timeline,
      status: proposal.status,
    }))
  );

  await Review.insertMany(
    reviews.map((review) => ({
      gig: review.gigKey ? createdGigs[review.gigKey]._id : null,
      reviewer: createdUsers[review.reviewerKey]._id,
      reviewee: createdUsers[review.revieweeKey]._id,
      rating: review.rating,
      comment: review.comment,
    }))
  );

  await Notification.insertMany(
    notifications.map((notification) => ({
      user: createdUsers[notification.userKey]._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
    }))
  );

  for (const conversation of conversations) {
    const createdConversation = await Conversation.create({
      participants: conversation.participantKeys.map((key) => createdUsers[key]._id),
      gig: createdGigs[conversation.gigKey]._id,
    });

    const createdMessages = await Message.insertMany(
      conversation.messages.map((message) => ({
        conversation: createdConversation._id,
        sender: createdUsers[message.senderKey]._id,
        body: message.body,
        readBy: [createdUsers[message.senderKey]._id],
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
      }))
    );
    const lastMessage = createdMessages[createdMessages.length - 1];

    createdConversation.lastMessage = lastMessage.body;
    createdConversation.lastMessageAt = lastMessage.createdAt;
    await createdConversation.save();
  }

  console.log("Seeded SkillSphere demo data");
  console.log(`Demo password for all seeded users: ${DEMO_PASSWORD}`);
  console.log("Try logging in as:");
  console.log("  client:     priya.healthbridge@skillsphere.demo");
  console.log("  freelancer: neha.react@skillsphere.demo");
  console.log("  admin:      aarav.admin@skillsphere.demo");
};

seed()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
