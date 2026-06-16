# School Portal - AI Powered Management System

A comprehensive school portal built with modern web technologies, featuring real-time communication and AI-driven features.

## 🚀 Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js (Express)
- **Real-time:** Socket.io
- **Database:** Firebase (Firestore)
- **Deployment:** Railway
- **Mobile/Desktop:** Capacitor & Electron support

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd schoolportal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env.local` file in the root and add your configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   # Add other necessary keys
   ```

### Running Locally

- **Start Frontend (Vite):**
  ```bash
  npm run dev
  ```
- **Start WebSocket Server:**
  ```bash
  npm run start:ws
  ```

## 🌟 Productive Portal Features

- **RBAC & Security:** Robust role-based access control with Firestore rules.
- **Academic SIS:** Attendance logging and course registration workflows.
- **Treasury:** Verified payment processing with real-time confirmation.
- **AI Assistant:** Google Gemini-powered academic tutor integrated into the layout.
- **Real-time:** Instant notifications via Socket.io for all critical updates.
- **Logging:** Comprehensive backend logging with Winston.

## 🚢 Deployment (Railway)

This project is configured for deployment on **Railway**.

### Do I need Docker?

**Short answer:** No, but it's recommended.

- **Without Docker:** Railway's [Nixpacks](https://nixpacks.com/) will automatically detect your Node.js environment and build the project. This is the simplest way.
- **With Docker:** Providing a `Dockerfile` gives you full control over the build environment. This is useful if you want to ensure the exact same environment between development and production, or if you need to run multiple processes (like the API and WebSocket server) in a specific way.

### Deployment Steps

1. Connect your GitHub repository to [Railway](https://railway.app/).
2. Railway will automatically detect the project.
3. Configure your Environment Variables in the Railway dashboard.
4. (Optional) Add a `Dockerfile` if you need custom build steps.

## 📱 Mobile & Desktop

- **Android/iOS:** Uses Capacitor. Run `npm run cap:sync` to sync web assets.
- **Desktop:** Uses Electron. Run `npm run electron:dev` for development.
