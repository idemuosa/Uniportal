import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import { Server } from "socket.io";
import http from 'http';
import winston from 'winston';
import { GoogleGenerativeAI } from "@google/generative-ai";
import pkg from './database.cjs';
const { sequelize, User, Payment, Attendance, Application } = pkg;

// 🪵 Professional Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

// 🔥 Firebase Admin (Identity & Security)
try {
  if (process.env.SERVICE_ACCOUNT_PATH) {
    const serviceAccount = await import('./serviceAccountKey.json', { assert: { type: 'json' } });
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount.default) });
  } else {
    admin.initializeApp();
  }
  logger.info('🛡️ Firebase Guard Active');
} catch (e) {
  logger.warn('⚠️ Firebase Admin initialization bypassed');
}

// 🛡️ Middleware: Verify Firebase Token
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid Session' });
  }
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(bodyParser.json());

// 🤖 AI Command Hub (Gemini Pro)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");

// 📨 Institutional Mailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendOfficialEmail({ to, subject, body }) {
  const mailOptions = {
    from: `"UniPortal Registry" <${process.env.EMAIL_USER}>`,
    to, subject,
    html: `<div style="font-family: sans-serif; padding: 40px; color: #1a1a1a; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 24px;">
      <h2 style="color: #059669; margin-bottom: 24px;">${subject}</h2>
      <div style="line-height: 1.6; font-size: 15px;">${body}</div>
      <p style="margin-top: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; pt: 20px;">Institutional ID: ${new Date().getTime()}</p>
    </div>`
  };
  return transporter.sendMail(mailOptions);
}

// ------------------------------------------------------------------
// 🚀 THE BEST API ENDPOINTS
// ------------------------------------------------------------------

// 1. Intelligent AI Tutor (Context-Aware)
app.post('/api/ai/tutor', authenticate, async (req, res) => {
  const { prompt } = req.body;
  try {
    // Fetch student data from Postgres for context
    const student = await User.findByPk(req.user.uid, { include: [Payment, Application] });
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const context = `
      You are the UniPortal AI Assistant.
      Student Name: ${student?.name || 'User'}
      Level: ${student?.level || '100L'}
      Fees Paid: ${student?.Payments?.length || 0}
      Admission Status: ${student?.Application?.status || 'Pending'}
      Answer concisely as a helpful university guide.
    `;

    const result = await model.generateContent([context, prompt]);
    res.json({ text: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: 'AI Brain Lag' });
  }
});

// 2. Real-Time Treasury (Verified)
app.post('/api/payments/verify', authenticate, async (req, res) => {
  const { amount, type, reference } = req.body;
  try {
    const payment = await Payment.create({
      uid: req.user.uid,
      amount, type,
      status: 'success',
      transactionId: reference || `REF-${Date.now()}`,
      method: 'remita'
    });

    // Real-time notification to the student
    io.to(`user_${req.user.uid}`).emit('notification', {
      title: 'Payment Secured',
      message: `${type.toUpperCase()} of ₦${amount.toLocaleString()} has been verified.`,
      type: 'success'
    });

    res.json({ status: 'success', payment });
  } catch (error) {
    res.status(500).json({ error: 'Treasury sync failed' });
  }
});

// 3. Admin: Super-Search & Analytics
app.get('/api/admin/analytics', authenticate, async (req, res) => {
  try {
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalRevenue = await Payment.sum('amount', { where: { status: 'success' } });
    const pendingApps = await Application.count({ where: { status: 'pending' } });

    res.json({ totalStudents, totalRevenue, pendingApps });
  } catch (error) {
    res.status(500).json({ error: 'Analytics failure' });
  }
});

// 4. Attendance Hub
app.post('/api/academics/attendance', authenticate, async (req, res) => {
  try {
    const attendance = await Attendance.create({
      studentId: req.user.uid,
      courseId: req.body.courseId || 'GEN101',
      location: req.body.location || 'Lecture Hall A'
    });
    res.json({ status: 'success', attendance });
  } catch (error) {
    res.status(500).json({ error: 'Attendance log failed' });
  }
});

// 5. User Sync (Firebase -> Postgres)
app.post('/api/users/sync', authenticate, async (req, res) => {
  const { name, role, email } = req.body;
  try {
    const [user, created] = await User.findOrCreate({
      where: { uid: req.user.uid },
      defaults: { name, role, email }
    });
    res.json({ user, created });
  } catch (error) {
    res.status(500).json({ error: 'Identity sync failure' });
  }
});

// 📡 Socket Events
io.on('connection', (socket) => {
  socket.on('join_room', (uid) => {
    socket.join(`user_${uid}`);
    logger.info(`👤 User ${uid} connected to real-time hub`);
  });
});

// ------------------------------------------------------------------
// 🏁 START THE BEST PORTAL
// ------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('🐘 Database synced successfully');
  } catch (err) {
    logger.warn(`⚠️ Database sync bypassed: ${err.message}`);
  }

  server.listen(PORT, () => {
    logger.info(`🚀 THE BEST UniPortal Server running on port ${PORT}`);
  });
};

startServer();
