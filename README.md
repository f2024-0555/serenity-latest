# 🌙 Serenity — Private Meditation Media Platform

A beautiful, private meditation and media platform. Upload your own audio and video files. Only people you approve can access it.

---

## What You Get

- 🔒 **Private access** — only users you approve can log in
- 🎵 **Audio player** — full-featured with shuffle, repeat, speed control
- 🎥 **Video player** — fullscreen, speed, auto-play next
- 📚 **Media library** — search, filter by type and category
- ❤️ **Favorites** — save your favourite sessions
- 📖 **History** — tracks what you've listened to
- 🛠️ **Admin panel** — upload media, manage users, block/approve accounts
- 📱 **Mobile responsive** — works on phone, tablet, desktop
- 🌌 **Dark cosmic design** — calming deep-space aesthetic

---

## Step 1 — Install Required Software

You need these installed on your computer:

### Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (the one that says "Recommended")
3. Install it. Done.

### Verify installation
Open your Terminal (Mac/Linux) or Command Prompt (Windows) and type:
```
node --version
```
You should see something like `v20.x.x`. If you do, you're good.

---

## Step 2 — Create Your Firebase Project

Firebase is a free service from Google that stores your files, handles login, and saves your data.

### 2a. Create account
1. Go to https://console.firebase.google.com
2. Sign in with your Google account

### 2b. Create project
1. Click **"Add project"**
2. Enter a name, e.g. `serenity-app`
3. Disable Google Analytics (not needed) → click Continue
4. Click **"Create project"**

### 2c. Enable Authentication
1. In the left sidebar click **"Authentication"**
2. Click **"Get started"**
3. Click **"Email/Password"**
4. Toggle **Enable** to ON
5. Click **Save**

### 2d. Create Firestore Database
1. In the left sidebar click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → click Next
4. Choose your region (pick one closest to you) → click **"Done"**

### 2e. Enable Storage
1. In the left sidebar click **"Storage"**
2. Click **"Get started"**
3. Click **"Next"** → **"Done"**

### 2f. Get your config keys
1. Click the ⚙️ gear icon next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **`</>`** (web) icon
5. Enter any nickname, e.g. `serenity-web` → click **"Register app"**
6. You will see a block of code like this — **copy these values**:
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "serenity-app.firebaseapp.com",
  projectId: "serenity-app",
  storageBucket: "serenity-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 3 — Set Up the Project

### 3a. Open the project folder
Extract the downloaded zip file. Open your Terminal and navigate into it:
```bash
cd serenity
```

### 3b. Create your environment file
Copy the example file:
```bash
cp .env.local.example .env.local
```

Open `.env.local` in any text editor (like Notepad or TextEdit) and fill in your Firebase values:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=serenity-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=serenity-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=serenity-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_ADMIN_EMAIL=your@email.com
```

### 3c. Install dependencies
```bash
npm install
```
This downloads all the code libraries. May take 1–2 minutes.

---

## Step 4 — Create Your Admin Account

### 4a. Create the account in Firebase
1. Go to Firebase Console → **Authentication** → **Users** tab
2. Click **"Add user"**
3. Enter your email and a strong password
4. Click **"Add user"**
5. **Copy the UID** shown in the table (looks like: `abc123xyz...`)

### 4b. Add admin record to Firestore
1. Go to Firebase Console → **Firestore Database**
2. Click **"Start collection"** (or **"+ Add collection"**)
3. Collection ID: `users` → click Next
4. Document ID: paste your **UID** from step above
5. Add these fields (click "Add field" for each):

| Field | Type | Value |
|-------|------|-------|
| uid | string | your-uid-here |
| email | string | your@email.com |
| displayName | string | Your Name |
| role | string | admin |
| status | string | active |
| createdAt | string | 2024-01-01T00:00:00.000Z |
| lastLogin | string | 2024-01-01T00:00:00.000Z |

6. Click **Save**

---

## Step 5 — Apply Security Rules

### Firestore rules
1. Go to Firebase Console → **Firestore Database** → **Rules** tab
2. Delete everything in the editor
3. Copy the entire contents of `firestore.rules` file and paste it
4. Click **"Publish"**

### Storage rules
1. Go to Firebase Console → **Storage** → **Rules** tab
2. Delete everything in the editor
3. Copy the entire contents of `storage.rules` file and paste it
4. Click **"Publish"**

---

## Step 6 — Run Locally

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

Log in with the admin email/password you created in Firebase Auth.

---

## Step 7 — Deploy for Free (Vercel)

Vercel hosts Next.js apps for free with no credit card needed.

### 7a. Push to GitHub
1. Create a free account at https://github.com
2. Create a new repository
3. Upload your project files there (or use Git commands)

### 7b. Deploy on Vercel
1. Go to https://vercel.com and sign up with GitHub
2. Click **"New Project"**
3. Import your GitHub repository
4. Before clicking Deploy, click **"Environment Variables"**
5. Add each variable from your `.env.local` file:
   - Click **"Add"** for each one
   - Name: `NEXT_PUBLIC_FIREBASE_API_KEY`, Value: your actual key
   - Repeat for all 7 variables
6. Click **"Deploy"**
7. Wait ~2 minutes
8. Your site is live at `https://your-project.vercel.app`! 🎉

---

## How to Use the App

### Adding media
1. Log in as admin
2. Click **"Admin"** in the left sidebar
3. Click **"Upload"** tab
4. Drag and drop your audio or video file
5. Add a title, description, category
6. Optionally add a thumbnail image
7. Click **"Upload to Sanctuary"**

### Approving new users
When someone signs up, their account status is "pending". To approve:
1. Go to **Admin** → **Users** tab
2. Find the user
3. Click **"Approve"** to give them access
4. Or click **"Block"** to deny access

### Managing users
- **Approve** — allows them to log in and use the app
- **Block** — prevents login even if they have an account
- **Make Admin** — gives full admin powers (be careful!)
- **Delete** — removes the user record

---

## Project Structure

```
serenity/
├── src/
│   ├── app/                    # All pages
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup/registration page
│   │   ├── dashboard/          # Home dashboard
│   │   ├── library/            # Full media library
│   │   └── admin/              # Admin panel
│   ├── components/
│   │   ├── auth/               # AuthGuard (protects pages)
│   │   ├── layout/             # Sidebar, AppLayout
│   │   ├── media/              # MediaCard, AudioPlayer, VideoPlayer
│   │   └── admin/              # UploadMedia form
│   ├── lib/
│   │   ├── firebase.ts         # Firebase setup
│   │   ├── auth-context.tsx    # Login/logout logic
│   │   ├── db.ts               # All database operations
│   │   └── player-store.ts     # Audio player state
│   └── types/
│       └── index.ts            # TypeScript types
├── firestore.rules             # Database security rules
├── storage.rules               # File storage security rules
├── .env.local.example          # Environment variable template
└── README.md                   # This file
```

---

## Troubleshooting

**"Permission denied" errors** — Make sure you published both the Firestore and Storage rules (Step 5).

**"Account not found" on login** — Make sure you created the Firestore user document in Step 4b with the correct UID.

**Files not uploading** — Check that Firebase Storage is enabled and Storage rules are published.

**Site loads but looks broken** — Make sure all environment variables are set correctly with no typos.

**"Account is pending" message** — Go to Firestore → users collection → find the document → change `status` field from `pending` to `active`.

---

## Support

For Firebase help: https://firebase.google.com/docs
For Next.js help: https://nextjs.org/docs
For Vercel help: https://vercel.com/docs
