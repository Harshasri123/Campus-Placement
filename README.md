# 🚀 CareerPath - End-to-End Career Readiness & Campus Placement Platform

**CareerPath** is a comprehensive, human-centric career readiness platform dedicated to college students and fresh graduates. The platform bridges the gap between academic education and industry hiring through authentic company blueprints (TCS NQT, Infosys DSE, Cognizant GenC, Wipro Elite, Accenture) and rigorous competitive exam preparation (GATE, CAT, Banking, SSC, and Civil Services).

---

## 🌟 Core Pillars & Training Tracks

### 1. Track A: Campus Placement Training
- **Quantitative Aptitude & Logical Reasoning**: 100+ recurring previous-year questions (PYQs) per topic folder with step-by-step mathematical breakdowns.
- **In-Browser Multi-Language Compiler**: Real-time code execution sandbox (Python, Java, C, C++) with public and hidden test case verification.
- **Core Computer Science Fundamentals**: Deep modules on Operating Systems, Database Management Systems (SQL, Normalization, ACID), OOPs, and Computer Networks.
- **AI-Powered Resume ATS Matcher**: In-browser PDF parser comparing student CVs against job descriptions with keyword gap diagnostics.
- **AI Placement Interview Assistant**: Split-screen oral interview simulator using Web Speech API (STT + TTS) with dynamic follow-up probing and STAR-method scoring.
- **Adaptive Company Mock Arena**: Timed simulation test arena mirroring sectional time-limits, marking schemes, and cut-off diagnostics.

### 2. Track B: Competitive Exam Mastery
- **GATE CS/IT**: Algorithms, Data Structures, Theory of Computation, Compiler Design, and Discrete Math.
- **CAT & Management Entrance**: Quantitative Ability, Data Interpretation & Logical Reasoning (DILR), Verbal Ability & Reading Comprehension (VARC).
- **Banking & Government Exams**: IBPS PO/Clerk, SBI PO, SSC CGL, and State PSC quantitative drills.
- **Formula Drawers & Active-Recall Flashcards**: Slide-out formula cheat sheets and spaced-repetition flashcards.
- **Campus Leaderboard**: Real-time percentile rankings and badges.

---

## 🎨 Brand Identity

- **Name**: CareerPath
- **Concept**: Sleek geometric upward trajectory and pathway emblem symbolizing structured milestone advancement from college to career.
- **Color Palette**: Deep Trust Navy (`#0f172a`, `#1e1b4b`), Electric Indigo/Cobalt (`#4f46e5`, `#6366f1`), with Crisp White and Slate Neutrals.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher; Node 22 native SQLite recommended)
- Modern web browser (Chrome or Edge recommended for native Web Speech API support)

### Installation & Launch
```bash
# 1. Install root dependencies
npm install

# 2. Start the CareerPath Server
npm start
```

Open **`http://localhost:3000`** in your browser to access the landing page and student portal.

---

## 📂 Project Structure

```plaintext
├── data/                      # Question datasets & 50+ authentic company interview PYQs
│   ├── interviewQuestionsBank.js
│   └── ...
├── db/                        # SQLite persistence & database operations (quiz.db)
│   └── database.js
├── routes/                    # REST API route handlers
│   ├── compilerRoutes.js      # In-browser multi-language compiler
│   ├── resumeRoutes.js        # AI Resume vs JD matcher
│   ├── interviewRoutes.js     # AI Placement Interview Assistant (STT/TTS/Turn-taking)
│   ├── studyAidRoutes.js      # Formula sheets & flashcards
│   └── leaderboardRoutes.js   # Campus rankings
├── services/                  # Business logic & prompt templates
│   └── systemPrompt.js
├── backend/                   # Optional modular PostgreSQL schema & configurations
├── index.html                 # Single-page web application (React, Tailwind CSS, Babel)
├── server.js                  # Main Express application server (Port 3000)
└── package.json               # Root configuration (careerPath)
```

---

## 🛡️ License
ISC License © 2026 CareerPath Technologies Inc.
