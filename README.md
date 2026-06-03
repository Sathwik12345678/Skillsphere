# SkillSphere

SkillSphere is a freelance marketplace starter built with a React frontend and a Node/Express backend.

## Structure

- `client/` React + Vite + Tailwind frontend
- `server/` Node + Express + MongoDB backend
- `docs/` project documentation

## Run

### Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

## Internship Requirement Coverage

SkillSphere now includes the requested MERN modules:

- Multi-role JWT auth with RBAC, demo Google login, email verification tokens, password reset tokens, and 2FA code flow.
- AI-style matching APIs with skill similarity scoring, location/rating weighting, freelancer recommendations, and trending skills.
- Freelancer profiles with skills/proficiency, portfolio, resume URL, certifications, experience, availability, pricing, verification badges, profile views, and reputation score.
- Gig marketplace with budget ranges, milestones, attachments, invitations, progress logs, and advanced search filters.
- Proposal and bidding flow with bid amount, timeline, negotiation status, and client notes.
- Socket.IO collaboration with instant messaging, file metadata, read receipts, and real-time notifications.
- Secure payment flow with mock Stripe/Razorpay-style checkout, escrow, milestone records, release, refund, and transaction history.
- Smart reviews with verified-review weighting, fake-review flagging, and reputation scoring.
- Admin dashboard APIs for users, account suspension, freelancer verification, gig approval, payments, disputes, logs, categories, revenue, and job success rate.
- Dispute resolution with evidence metadata, admin mediation notes, and resolution status.

### Frontend

```bash
cd client
npm install
npm run dev
```
