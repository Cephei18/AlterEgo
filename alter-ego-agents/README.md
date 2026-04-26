# 🧬 Alter Ego Agents

Turn your Farcaster activity into an AI persona — and simulate how two people would collaborate before they ever meet.

---

## 🚀 What is this?

Alter Ego Agents builds a personality model from your Farcaster casts and lets you:

- Generate your **AI alter ego**
- Compare with any Farcaster user
- Simulate real conversations
- Predict collaboration compatibility

Think: **"What happens if we work together?" — answered before you start.**

---

## ✨ Features

- 🔐 Sign in with Farcaster (via Neynar)
- 🤖 AI personality extraction from real user data
- 🔍 Search any Farcaster username
- ⚡ Real-time compatibility simulation
- 💬 Generated conversation between agents
- 📤 Share results back to Farcaster
- ⚡ Redis caching for fast responses

---

## 🧠 How it works

1. User connects Farcaster
2. Fetch recent casts via Neynar
3. Gemini extracts structured personality
4. Store agent in Redis
5. Simulate interaction between two agents
6. Return:
   - Compatibility score
   - Collaboration style
   - Talking points
   - Risk flags
   - Conversation excerpt

---

## 🏗️ Tech Stack

- **Frontend:** Next.js (App Router) + Tailwind
- **Auth/Data:** Neynar (Farcaster API)
- **AI:** Gemini API
- **Caching:** Upstash Redis
- **Deployment:** Vercel

---

## ⚙️ Setup

```bash
git clone https://github.com/your-username/alter-ego-agents
cd alter-ego-agents
npm install

