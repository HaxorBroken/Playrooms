# 🎮 GamePortal — Multiplayer Gaming Hub

Full-stack multiplayer gaming app with UNO and Call Bridge.
Built with React + Vite + Firebase + WebRTC. Deploy to Vercel in minutes.

---

## ⚡ Deploy to Vercel (Step-by-Step)

### STEP 1 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it (e.g. "gameportal") → Continue → Create Project

### STEP 2 — Enable Firebase Services

**Authentication**
- Sidebar → Build → Authentication → Get started
- Sign-in method tab → Google → Enable → add your email as support email → Save

**Firestore Database**
- Sidebar → Build → Firestore Database → Create database
- Select **Start in production mode** → choose nearest region → Enable

**Realtime Database**
- Sidebar → Build → Realtime Database → Create database
- Choose nearest region → **Start in test mode** → Enable

### STEP 3 — Get Your Firebase Config

- Click gear icon (top left) → Project settings
- Scroll to "Your apps" → click **</>** (Web) icon
- Register app name (e.g. "gameportal-web") → Register app
- Copy the config values shown — you need all 7 values

### STEP 4 — Apply Security Rules

**Firestore Rules:**
- Firestore Database → Rules tab → Replace all text with contents of `firestore.rules` → Publish

**Realtime Database Rules:**
- Realtime Database → Rules tab → Replace all text with:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
→ Publish

### STEP 5 — Deploy to Vercel

1. Go to https://vercel.com → Sign up/login with GitHub
2. Click **Add New Project**
3. Upload this zip (or push to a GitHub repo first)
   - If uploading zip: drag the zip into Vercel's import screen
   - If using GitHub: push the folder contents to a repo, then import repo
4. Vercel auto-detects Vite framework
5. **IMPORTANT — Add Environment Variables:**
   In the Vercel project settings before deploying, add these variables:

```
VITE_FIREBASE_API_KEY            = (your value)
VITE_FIREBASE_AUTH_DOMAIN        = your-project-id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL       = https://your-project-id-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID         = your-project-id
VITE_FIREBASE_STORAGE_BUCKET     = your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID= (your value)
VITE_FIREBASE_APP_ID             = (your value)
```

6. Click **Deploy** → Done!

### STEP 6 — Add Vercel Domain to Firebase Auth

After deploy, Vercel gives you a URL like `https://gameportal-xyz.vercel.app`

- Firebase Console → Authentication → Settings → Authorized domains
- Click **Add domain** → paste your Vercel URL → Add

---

## 🏃 Running Locally

```bash
# 1. Copy env file
cp .env.example .env
# Fill in your Firebase values in .env

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
# Opens at http://localhost:5173
```

---

## 🎮 Games

### UNO
- Standard 108-card deck
- Skip, Reverse, Draw 2, Wild, Wild Draw 4
- +2 and +4 card stacking
- UNO button — must press when 1 card left (5 second window or penalty!)
- Challenge other players who forget to say UNO

### Call Bridge
- 4 players, 13 cards each (full 52-card deck)
- Bidding round — each player bids how many tricks they'll win
- Highest bidder picks trump suit
- Must follow lead suit → then trump → then any card
- Scoring: bid×2 if successful, −bid×2 if failed, +1 per extra trick
- First player to reach target score wins

---

## 🗂 Project Structure

```
src/
├── App.jsx                              Router + auth guard
├── main.jsx                             Entry point
├── components/
│   ├── auth/AuthPage.jsx                Google sign-in page
│   ├── lobby/Dashboard.jsx              Home page with game selection
│   ├── lobby/LobbyPage.jsx              Public room browser + create/join
│   ├── lobby/RoomPage.jsx               Waiting room + ready system
│   ├── games/GameRouter.jsx             Routes to correct game
│   ├── games/uno/UnoGame.jsx            Complete UNO game UI + logic
│   ├── games/uno/UnoCard.jsx            Animated UNO card
│   ├── games/uno/ColorPicker.jsx        Wild card color selector
│   ├── games/callbridge/CallBridgeGame.jsx   Complete Call Bridge game
│   ├── games/callbridge/PlayingCard.jsx      Standard playing card
│   └── ui/VoicePanel.jsx                Voice chat controls
├── firebase/
│   ├── config.js                        Firebase initialization
│   ├── services.js                      All Firestore + RTDB operations
│   └── voiceChat.js                     WebRTC peer-to-peer voice manager
├── hooks/
│   ├── useAuth.js                       Auth state, Google sign-in
│   ├── useRoom.js                       Room create/join/leave/ready
│   └── useVoiceChat.js                  Voice chat enable/mute
├── store/index.js                       Zustand global state
├── utils/
│   ├── unoEngine.js                     Pure UNO game logic (no UI)
│   └── callBridgeEngine.js              Pure Call Bridge logic (no UI)
└── styles/globals.css                   Global CSS + animations
```

---

## 🔊 Voice Chat

Uses WebRTC peer-to-peer with Firebase Realtime Database as signaling.
Click the **Voice** button in any waiting room or game to enable.
Requires browser microphone permission.

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Auth | Firebase Authentication (Google) |
| Database | Firestore + Firebase Realtime Database |
| Voice | WebRTC (browser API) |
| State | Zustand |
| Hosting | Vercel |
