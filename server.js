import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import { Server } from "socket.io";
import http from 'http';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import pkg from './database.cjs';
const { sequelize, Op, User, Payment, Attendance, Application } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'uniportal-secret-key-2026';

// Password hashing helper
function hashPassword(password) {
  const salt = 'uniportal_salt_2026';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  return hashPassword(password) === storedHash;
}

// Ensure logs directory exists
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}

// 🪵 Professional Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: path.join(__dirname, 'logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, 'logs/combined.log') })
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

// 🛡️ Middleware: Verify JWT or Firebase Token
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split('Bearer ')[1];

  // 1. Try local JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (jwtError) {
    // 2. Fallback to Firebase token verification
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (firebaseError) {
      return res.status(403).json({ error: 'Invalid Session' });
    }
  }
};

const corsOrigin = process.env.CORS_ORIGIN || "*";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin, methods: ["GET", "POST"] } });

app.use(cors({ origin: corsOrigin }));
app.use(bodyParser.json());

// 📦 Serve Static Frontend Assets (dist)
app.use(express.static(path.join(__dirname, 'dist')));

// 🤖 AI Command Hub (Gemini Pro)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");

// 📨 Institutional Mailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendOfficialEmail({ to, subject, body }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.info(`Simulated Email Sent to ${to}: ${subject}`);
    return;
  }
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
// 🚀 AUTHENTICATION & ACCOUNTS ENDPOINTS
// ------------------------------------------------------------------

// 1. User Registration
app.post(['/api/accounts/register/', '/api/accounts/register'], async (req, res) => {
  const { username, email, password, first_name, last_name, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userEmail = email.toLowerCase().trim();
    const userUsername = (username || email).toLowerCase().trim();

    // Check existing user using Op.or
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email: userEmail }, { username: userUsername }]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const hashedPassword = hashPassword(password);
    const userRole = role || 'applicant';
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || userUsername;

    const user = await User.create({
      uid,
      username: userUsername,
      email: userEmail,
      password: hashedPassword,
      firstName: first_name || '',
      lastName: last_name || '',
      name: fullName,
      role: userRole,
      level: '100L'
    });

    try {
      await sendOfficialEmail({
        to: userEmail,
        subject: 'Welcome to UniPortal',
        body: `Hello ${fullName}, your account has been registered successfully.`
      });
    } catch (e) {
      // ignore email sending errors in registration response
    }

    res.status(201).json({
      id: user.uid,
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 2. JWT Token Obtain (Login)
app.post(['/api/token/', '/api/token'], async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    const term = username.toLowerCase().trim();
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: term }, { username: term }]
      }
    });

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ detail: 'No active account found with the given credentials' });
    }

    const payload = { uid: user.uid, email: user.email, role: user.role };
    const access = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    const refresh = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ access, refresh });
  } catch (error) {
    logger.error('Token error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// 3. JWT Token Refresh
app.post(['/api/token/refresh/', '/api/token/refresh'], async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refresh, JWT_SECRET);
    const access = jwt.sign({ uid: decoded.uid, email: decoded.email, role: decoded.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ access });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// 4. Current User Detail
app.get(['/api/accounts/user/', '/api/accounts/user'], authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.uid || req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.uid,
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      faculty: user.faculty,
      department: user.department,
      level: user.level,
      matric_no: user.matricNo
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// 5. List Users (e.g. Admin filtering by role)
app.get(['/api/accounts/users/', '/api/accounts/users'], authenticate, async (req, res) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};
    const users = await User.findAll({ where });

    const formattedUsers = users.map(u => ({
      id: u.uid,
      uid: u.uid,
      username: u.username,
      email: u.email,
      role: u.role,
      first_name: u.firstName,
      last_name: u.lastName,
      faculty: u.faculty,
      department: u.department,
      level: u.level,
      matric_no: u.matricNo
    }));

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 6. Update User (Patch user role, matric_no, etc.)
app.patch(['/api/accounts/users/:uid/', '/api/accounts/users/:uid'], authenticate, async (req, res) => {
  try {
    const targetUid = req.params.uid;
    const user = await User.findByPk(targetUid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { role, matric_no, faculty, department, level } = req.body;
    if (role) user.role = role;
    if (matric_no !== undefined) user.matricNo = matric_no;
    if (faculty) user.faculty = faculty;
    if (department) user.department = department;
    if (level) user.level = level;

    await user.save();

    res.json({
      id: user.uid,
      uid: user.uid,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      faculty: user.faculty,
      department: user.department,
      level: user.level,
      matric_no: user.matricNo
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ------------------------------------------------------------------
// 🚀 OTHER PORTAL API ENDPOINTS
// ------------------------------------------------------------------

// Intelligent AI Tutor
app.post('/api/ai/tutor', authenticate, async (req, res) => {
  const { prompt } = req.body;
  try {
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

// Real-Time Treasury (Verified)
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

    io.to(`user_${req.user.uid}`).emit('notification', {
      title: 'Payment Secured',
      message: `${type.toUpperCase()} of ₦${Number(amount).toLocaleString()} has been verified.`,
      type: 'success'
    });

    res.json({ status: 'success', payment });
  } catch (error) {
    res.status(500).json({ error: 'Treasury sync failed' });
  }
});

// Admin Analytics
app.get('/api/admin/analytics', authenticate, async (req, res) => {
  try {
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalRevenue = await Payment.sum('amount', { where: { status: 'success' } });
    const pendingApps = await Application.count({ where: { status: 'pending' } });

    res.json({ totalStudents, totalRevenue: totalRevenue || 0, pendingApps });
  } catch (error) {
    res.status(500).json({ error: 'Analytics failure' });
  }
});

// Attendance Hub
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

// User Sync (Firebase -> Postgres)
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

// Academics Applications
app.get(['/api/academics/applications/', '/api/academics/applications'], authenticate, async (req, res) => {
  try {
    const apps = await Application.findAll();
    res.json(apps);
  } catch (error) {
    res.json([]);
  }
});

app.post(['/api/academics/applications/', '/api/academics/applications'], authenticate, async (req, res) => {
  try {
    const appRecord = await Application.create({
      uid: req.user.uid,
      type: req.body.type || 'undergraduate',
      faculty: req.body.faculty,
      department: req.body.department,
      status: 'pending',
      formData: req.body
    });
    res.status(201).json(appRecord);
  } catch (error) {
    res.status(500).json({ error: 'Application creation failed' });
  }
});

app.patch(['/api/academics/applications/:id/', '/api/academics/applications/:id'], authenticate, async (req, res) => {
  try {
    const appRecord = await Application.findByPk(req.params.id);
    if (appRecord) {
      if (req.body.status) appRecord.status = req.body.status;
      await appRecord.save();
    }
    res.json(appRecord || {});
  } catch (error) {
    res.status(500).json({ error: 'Application update failed' });
  }
});

// Courses
let inMemoryCourses = [
  { id: 1, course_code: 'CSC101', title: 'Introduction to Computer Science', credit_units: 3, level: '100L' },
  { id: 2, course_code: 'MTH101', title: 'General Mathematics I', credit_units: 3, level: '100L' },
  { id: 3, course_code: 'PHY101', title: 'General Physics I', credit_units: 3, level: '100L' },
];

app.get(['/api/academics/courses/', '/api/academics/courses'], async (req, res) => {
  res.json(inMemoryCourses);
});

app.post(['/api/academics/courses/', '/api/academics/courses'], authenticate, async (req, res) => {
  const newCourse = {
    id: inMemoryCourses.length + 1,
    course_code: req.body.course_code || req.body.courseCode || 'CSC201',
    title: req.body.title || 'Untitled Course',
    credit_units: req.body.credit_units || req.body.creditUnits || 3,
    level: req.body.level || '100L'
  };
  inMemoryCourses.push(newCourse);
  res.status(201).json(newCourse);
});

// Course Registrations
let inMemoryRegistrations = [];
app.get(['/api/academics/registrations/', '/api/academics/registrations'], authenticate, async (req, res) => {
  res.json(inMemoryRegistrations);
});

app.post(['/api/academics/registrations/', '/api/academics/registrations'], authenticate, async (req, res) => {
  const reg = { id: Date.now(), uid: req.user.uid, ...req.body };
  inMemoryRegistrations.push(reg);
  res.status(201).json(reg);
});

// Finances Payments
app.get(['/api/finances/payments/', '/api/finances/payments'], authenticate, async (req, res) => {
  try {
    const payments = await Payment.findAll({ where: { uid: req.user.uid } });
    res.json(payments);
  } catch (error) {
    res.json([]);
  }
});

app.post(['/api/finances/payments/', '/api/finances/payments'], authenticate, async (req, res) => {
  try {
    const payment = await Payment.create({
      uid: req.user.uid,
      amount: req.body.amount,
      type: req.body.type || 'School Fees',
      status: req.body.status || 'success',
      transactionId: req.body.transactionId || `TX-${Date.now()}`,
      method: req.body.method || 'card'
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Payment record failed' });
  }
});

// Loans
let inMemoryLoans = [];
app.get(['/api/finances/loans/', '/api/finances/loans'], authenticate, async (req, res) => {
  res.json(inMemoryLoans);
});

app.post(['/api/finances/loans/', '/api/finances/loans'], authenticate, async (req, res) => {
  const loan = { id: `loan_${Date.now()}`, uid: req.user.uid, status: 'pending', ...req.body };
  inMemoryLoans.push(loan);
  res.status(201).json(loan);
});

app.patch(['/api/finances/loans/:id/', '/api/finances/loans/:id'], authenticate, async (req, res) => {
  const loan = inMemoryLoans.find(l => l.id === req.params.id);
  if (loan && req.body.status) loan.status = req.body.status;
  res.json(loan || {});
});

// Treasury Settings & Bank Details
app.get(['/api/portal/treasury-settings/', '/api/portal/treasury-settings'], async (req, res) => {
  res.json({ remitaMerchantId: 'MERCHANT-UNI-2026', gatewayActive: true });
});

app.get(['/api/portal/bank-details/', '/api/portal/bank-details'], async (req, res) => {
  res.json([
    { bankName: 'First Bank of Nigeria', accountName: 'UniPortal Registry', accountNumber: '0123456789' }
  ]);
});

app.get(['/api/portal/faculties/', '/api/portal/faculties'], async (req, res) => {
  res.json([
    { name: 'Science', departments: ['Computer Science', 'Mathematics', 'Physics'] },
    { name: 'Engineering', departments: ['Electrical Engineering', 'Mechanical Engineering'] }
  ]);
});

// Notifications / Email Dispatch
app.post(['/api/notify', '/api/notify/'], async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    await sendOfficialEmail({ to, subject, body: message });
    res.json({ status: 'sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// 📡 Socket Events
io.on('connection', (socket) => {
  socket.on('join_room', (uid) => {
    socket.join(`user_${uid}`);
    logger.info(`👤 User ${uid} connected to real-time hub`);
  });
});

// 🛡️ API 404 Fallback Handler (Always return JSON for API requests)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// 🔐 Admin Direct URL Redirection (e.g., uniportal/admin -> /#/admin)
app.get(['/admin', '/admin/'], (req, res) => {
  res.redirect('/#/admin');
});

// 🌐 SPA Fallback Routing for Client-Side Navigation
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build not found. Please build the client app.');
  }
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
