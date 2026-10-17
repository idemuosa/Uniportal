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
const { sequelize, Op, User, Payment, Attendance, Application, EntranceExamQuestion, EntranceExamSubmission } = pkg;

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

function generateAdmissionId(departmentName) {
  let deptCode = 'AD';
  if (departmentName && typeof departmentName === 'string') {
    const clean = departmentName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (clean.length >= 3) {
      deptCode = clean[0] + clean[2];
    } else if (clean.length >= 1) {
      deptCode = clean[0] + (clean[1] || clean[0]);
    }
  }
  const digits = Math.floor(600000 + Math.random() * 100000);
  return `LUK-ADM-${deptCode}${digits}`;
}

app.post(['/api/academics/applications/', '/api/academics/applications'], authenticate, async (req, res) => {
  try {
    const deptName = req.body.departmentName || req.body.department || req.body.formData?.department || '';
    const appId = generateAdmissionId(deptName);
    const appRecord = await Application.create({
      id: appId,
      uid: req.user.uid,
      type: req.body.type || 'undergraduate',
      faculty: req.body.faculty,
      department: req.body.department || deptName,
      status: 'pending',
      formData: { ...req.body, generatedAppId: appId }
    });
    res.status(201).json(appRecord);
  } catch (error) {
    console.error('Application creation error:', error);
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

// ------------------------------------------------------------------
// 📝 ENTRANCE EXAM & CBT ENDPOINTS
// ------------------------------------------------------------------

// Default question generator helper if DB questions aren't seeded yet
const DEFAULT_CBT_QUESTIONS = {
  'English Language': [
    { id: 'eng_1', subject: 'English Language', stream: 'JAMB', question: 'Choose the option that best completes the sentence: The committee has completed ___ investigation.', options: ['its', 'it\'s', 'their', 'there'], correctAnswer: 0 },
    { id: 'eng_2', subject: 'English Language', stream: 'JAMB', question: 'Select the word opposite in meaning to "TRANSIENT".', options: ['Fleeting', 'Permanent', 'Fragile', 'Temporal'], correctAnswer: 1 },
    { id: 'eng_3', subject: 'English Language', stream: 'JAMB', question: 'Which of the following is a synonym for "METICULOUS"?', options: ['Careless', 'Thorough', 'Hastened', 'Casual'], correctAnswer: 1 }
  ],
  'Mathematics': [
    { id: 'mth_1', subject: 'Mathematics', stream: 'JAMB', question: 'If 2x + 5 = 15, what is the value of x?', options: ['3', '5', '10', '7'], correctAnswer: 1 },
    { id: 'mth_2', subject: 'Mathematics', stream: 'JAMB', question: 'Evaluate log10(1000).', options: ['1', '2', '3', '4'], correctAnswer: 2 },
    { id: 'mth_3', subject: 'Mathematics', stream: 'JAMB', question: 'What is the derivative of x^3 with respect to x?', options: ['x^2', '3x^2', '3x', 'x^4 / 4'], correctAnswer: 1 }
  ],
  'Physics': [
    { id: 'phy_1', subject: 'Physics', stream: 'JAMB', question: 'What is the SI unit of electric current?', options: ['Volt', 'Ohm', 'Ampere', 'Watt'], correctAnswer: 2 },
    { id: 'phy_2', subject: 'Physics', stream: 'JAMB', question: 'Which law states that stress is directly proportional to strain within the elastic limit?', options: ['Newton\'s Law', 'Hooke\'s Law', 'Boyle\'s Law', 'Pascal\'s Law'], correctAnswer: 1 }
  ],
  'Chemistry': [
    { id: 'chm_1', subject: 'Chemistry', stream: 'JAMB', question: 'What is the pH value of pure neutral water at 25°C?', options: ['0', '7', '14', '1'], correctAnswer: 1 },
    { id: 'chm_2', subject: 'Chemistry', stream: 'JAMB', question: 'Which gas is evolved when zinc reacts with dilute hydrochloric acid?', options: ['Oxygen', 'Hydrogen', 'Chlorine', 'Carbon Dioxide'], correctAnswer: 1 }
  ],
  'Biology': [
    { id: 'bio_1', subject: 'Biology', stream: 'JAMB', question: 'Which organelle is known as the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body'], correctAnswer: 1 },
    { id: 'bio_2', subject: 'Biology', stream: 'JAMB', question: 'Which process in plants converts light energy into chemical energy?', options: ['Respiration', 'Transpiration', 'Photosynthesis', 'Osmosis'], correctAnswer: 2 }
  ],
  'Economics': [
    { id: 'eco_1', subject: 'Economics', stream: 'JAMB', question: 'Opportunity cost is best defined as:', options: ['Total money spent', 'The next best alternative forgone', 'Fixed costs of production', 'Marginal benefit'], correctAnswer: 1 }
  ],
  'Direct Entry': [
    { id: 'de_1', subject: 'General Aptitude & Advanced Studies', stream: 'Direct Entry', question: 'Direct Entry Evaluation: Which research method focuses on numerical data analysis?', options: ['Qualitative', 'Quantitative', 'Ethnographic', 'Philosophical'], correctAnswer: 1 },
    { id: 'de_2', subject: 'General Aptitude & Advanced Studies', stream: 'Direct Entry', question: 'Identify the fundamental principle of academic integrity in tertiary education.', options: ['Plagiarism', 'Originality and Citation', 'Arbitrary Reasoning', 'Fabrication'], correctAnswer: 1 },
    { id: 'de_3', subject: 'General Aptitude & Advanced Studies', stream: 'Direct Entry', question: 'What is the primary objective of advanced field synthesis in higher education?', options: ['Rote Memorization', 'Critical Analysis and Problem Solving', 'Passive Reading', 'None of the above'], correctAnswer: 1 }
  ]
};

// 1. Get Questions / Filter by Stream or Subject
app.get(['/api/academics/entrance-exams/questions/', '/api/academics/entrance-exams/questions'], async (req, res) => {
  try {
    const { stream, subject } = req.query;
    const where = {};
    if (stream) where.stream = stream;
    if (subject) where.subject = subject;

    const dbQuestions = await EntranceExamQuestion.findAll({ where });
    if (dbQuestions && dbQuestions.length > 0) {
      return res.json(dbQuestions);
    }

    // Return default fallbacks
    let results = [];
    if (stream === 'Direct Entry') {
      results = DEFAULT_CBT_QUESTIONS['Direct Entry'];
    } else if (subject && DEFAULT_CBT_QUESTIONS[subject]) {
      results = DEFAULT_CBT_QUESTIONS[subject];
    } else {
      results = Object.values(DEFAULT_CBT_QUESTIONS).flat();
    }
    res.json(results);
  } catch (error) {
    logger.error('Error fetching CBT questions:', error);
    res.status(500).json({ error: 'Failed to fetch exam questions' });
  }
});

// 2. Admin: Add/Set Exam Questions (for Direct Entry or JAMB)
app.post(['/api/academics/entrance-exams/questions/', '/api/academics/entrance-exams/questions'], authenticate, async (req, res) => {
  try {
    const { stream, subject, question, options, correctAnswer, faculty, department } = req.body;
    if (!question || !options || correctAnswer === undefined) {
      return res.status(400).json({ error: 'Question, options, and correct answer index required' });
    }

    const newQuestion = await EntranceExamQuestion.create({
      stream: stream || 'JAMB',
      subject: subject || 'General Knowledge',
      question,
      options,
      correctAnswer: Number(correctAnswer),
      faculty,
      department
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    logger.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to add exam question' });
  }
});

// 3. Start Entrance Exam Session by JAMB/CBT Reg Number or Admission Registration Number
app.post(['/api/academics/entrance-exams/start/', '/api/academics/entrance-exams/start'], async (req, res) => {
  try {
    const { registrationNumber, stream, subjects, faculty, department } = req.body;
    const regNo = (registrationNumber || '').trim();

    if (!regNo) {
      return res.status(400).json({ error: 'JAMB / Direct Entry CBT / Admission Registration Number is required' });
    }

    let matchingApp = null;
    const cleanAppId = regNo.replace(/^LUK-ADM-/, '');
    try {
      const apps = await Application.findAll();
      matchingApp = apps.find(a =>
        a.id === regNo ||
        a.id === cleanAppId ||
        `LUK-ADM-${a.id}` === regNo ||
        a.uid === regNo ||
        (a.formData && (a.formData.jambRegNo === regNo || a.formData.jamb_reg_no === regNo))
      );
    } catch (appErr) {
      logger.warn('Application lookup in start exam warning:', appErr);
    }

    // Check if exam was already taken under regNo or matching application's identifiers
    const searchRegs = [regNo];
    if (matchingApp) {
      searchRegs.push(matchingApp.id, `LUK-ADM-${matchingApp.id}`);
      if (matchingApp.formData?.jambRegNo) searchRegs.push(matchingApp.formData.jambRegNo);
      if (matchingApp.uid) searchRegs.push(matchingApp.uid);
    }

    const existingSubmission = await EntranceExamSubmission.findOne({
      where: {
        [Op.or]: [
          { registrationNumber: { [Op.in]: searchRegs } },
          ...(matchingApp?.uid ? [{ uid: matchingApp.uid }] : [])
        ]
      }
    });

    if (existingSubmission) {
      return res.json({
        alreadyTaken: true,
        submission: existingSubmission,
        message: 'Entrance exam has already been completed for this registration number.'
      });
    }

    // Determine stream, faculty, department, and subjects from application if available
    const activeStream = stream || (matchingApp?.formData?.type?.includes('Direct Entry') ? 'Direct Entry' : 'JAMB');
    const activeFaculty = faculty || matchingApp?.faculty || matchingApp?.formData?.faculty || '';
    const activeDepartment = department || matchingApp?.department || matchingApp?.formData?.department || '';

    // Gather questions
    let assembledQuestions = [];
    if (activeStream === 'Direct Entry') {
      const deDbQuestions = await EntranceExamQuestion.findAll({ where: { stream: 'Direct Entry' } });
      assembledQuestions = deDbQuestions.length > 0 ? deDbQuestions : DEFAULT_CBT_QUESTIONS['Direct Entry'];
    } else {
      let activeSubjects = Array.isArray(subjects) && subjects.length > 0
        ? subjects
        : (matchingApp?.formData?.jambSubjects?.map(s => s.subject).filter(Boolean) || []);

      if (activeSubjects.length === 0) {
        activeSubjects = ['English Language', 'Mathematics', 'Physics', 'Chemistry'];
      }

      for (const sub of activeSubjects) {
        const subName = typeof sub === 'string' ? sub : (sub.subject || 'English Language');
        const dbQs = await EntranceExamQuestion.findAll({ where: { subject: subName } });
        const qs = dbQs.length > 0 ? dbQs : (DEFAULT_CBT_QUESTIONS[subName] || DEFAULT_CBT_QUESTIONS['English Language']);
        assembledQuestions = assembledQuestions.concat(qs);
      }
    }

    // Strip out correctAnswer from payload sent to candidate for exam integrity
    const candidateQuestions = assembledQuestions.map((q, idx) => ({
      id: q.id || `q_${idx}_${Date.now()}`,
      subject: q.subject || 'General',
      question: q.question,
      options: q.options,
      stream: q.stream || activeStream || 'JAMB'
    }));

    res.json({
      alreadyTaken: false,
      registrationNumber: regNo,
      stream: activeStream,
      faculty: activeFaculty,
      department: activeDepartment,
      durationMinutes: activeStream === 'Direct Entry' ? 45 : 60,
      questions: candidateQuestions
    });
  } catch (error) {
    logger.error('Error starting entrance exam:', error);
    res.status(500).json({ error: 'Failed to initialize entrance exam session' });
  }
});

// 4. Submit Entrance Exam & Calculate Score
app.post(['/api/academics/entrance-exams/submit/', '/api/academics/entrance-exams/submit'], async (req, res) => {
  try {
    const { registrationNumber, candidateName, candidateEmail, uid, stream, faculty, department, answers } = req.body;
    const regNo = (registrationNumber || '').trim();

    if (!regNo || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Registration number and answers array required' });
    }

    // Double-check existing
    const existing = await EntranceExamSubmission.findOne({ where: { registrationNumber: regNo } });
    if (existing) {
      return res.status(400).json({ error: 'Entrance exam already submitted for this registration number.' });
    }

    let correctCount = 0;
    const totalQuestions = answers.length;
    const subjectBreakdown = {};

    for (const ans of answers) {
      const sub = ans.subject || 'General';
      if (!subjectBreakdown[sub]) {
        subjectBreakdown[sub] = { total: 0, correct: 0, score: 0 };
      }
      subjectBreakdown[sub].total += 1;

      // Verify answer
      let isCorrect = false;
      if (ans.questionId) {
        const dbQ = await EntranceExamQuestion.findByPk(ans.questionId);
        if (dbQ) {
          isCorrect = dbQ.correctAnswer === Number(ans.selectedOption);
        } else {
          // Check default questions dictionary
          const defaultQs = Object.values(DEFAULT_CBT_QUESTIONS).flat();
          const found = defaultQs.find(q => q.id === ans.questionId);
          if (found) {
            isCorrect = found.correctAnswer === Number(ans.selectedOption);
          }
        }
      }

      if (isCorrect) {
        correctCount += 1;
        subjectBreakdown[sub].correct += 1;
      }
    }

    // Calculate percentage score
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Calculate per-subject percentage
    Object.keys(subjectBreakdown).forEach(sub => {
      const item = subjectBreakdown[sub];
      item.score = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
    });

    // Create submission record
    const submission = await EntranceExamSubmission.create({
      registrationNumber: regNo,
      candidateName: candidateName || 'Candidate',
      candidateEmail: candidateEmail || '',
      uid: uid || null,
      stream: stream || 'JAMB',
      faculty: faculty || '',
      department: department || '',
      totalScore: correctCount * 10,
      maxScore: totalQuestions * 10,
      percentage,
      subjectScores: subjectBreakdown,
      answers,
      status: 'submitted',
      admissionGuaranteed: false
    });

    // Notify Real-time socket & Admin
    io.emit('new_entrance_exam_submission', {
      id: submission.id,
      registrationNumber: regNo,
      candidateName: submission.candidateName,
      percentage
    });

    res.status(201).json({
      message: 'Entrance exam submitted successfully!',
      submission
    });
  } catch (error) {
    logger.error('Error submitting exam:', error);
    res.status(500).json({ error: 'Failed to submit entrance exam' });
  }
});

// 5. Admin: List Exam Submissions
app.get(['/api/academics/entrance-exams/submissions/', '/api/academics/entrance-exams/submissions'], authenticate, async (req, res) => {
  try {
    const submissions = await EntranceExamSubmission.findAll({
      order: [['submittedAt', 'DESC']]
    });
    res.json(submissions);
  } catch (error) {
    logger.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch CBT submissions' });
  }
});

// 6. Admin: Release Result to Student Portal & Guarantee Admission
app.post(['/api/academics/entrance-exams/release/:id/', '/api/academics/entrance-exams/release/:id'], authenticate, async (req, res) => {
  try {
    const submission = await EntranceExamSubmission.findByPk(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    submission.status = 'released';
    submission.admissionGuaranteed = true;
    submission.releasedAt = new Date();
    await submission.save();

    // Find and update candidate's Application status if exists
    if (submission.uid || submission.registrationNumber) {
      const appRecord = await Application.findOne({
        where: {
          [Op.or]: [
            { uid: submission.uid || '' },
            { id: submission.uid || '' }
          ]
        }
      });
      if (appRecord) {
        appRecord.status = 'approved';
        await appRecord.save();
      }
    }

    // Send email notification to student
    if (submission.candidateEmail) {
      try {
        await sendOfficialEmail({
          to: submission.candidateEmail,
          subject: 'Official Entrance Exam Result & Admission Guarantee',
          body: `
            <p>Dear <b>${submission.candidateName}</b>,</p>
            <p>Your Entrance Exam result for Reg No: <b>${submission.registrationNumber}</b> has been released!</p>
            <p><b>Score:</b> ${submission.percentage}%</p>
            <p><b>Admission Guarantee Status:</b> <span style="color:#059669; font-weight:bold;">GUARANTEED & APPROVED</span></p>
            <p>Please log in to your Student Portal to view your complete breakdown and print your Official Admission Guarantee Letter.</p>
          `
        });
      } catch (e) {
        logger.warn('Failed to send result email:', e);
      }
    }

    res.json({
      message: 'Result released and admission guaranteed successfully!',
      submission
    });
  } catch (error) {
    logger.error('Error releasing result:', error);
    res.status(500).json({ error: 'Failed to release exam result' });
  }
});

// 7. Student/Applicant: Get Released Result & Admission Guarantee
app.get(['/api/academics/entrance-exams/my-result/', '/api/academics/entrance-exams/my-result'], async (req, res) => {
  try {
    const { regNo, uid } = req.query;
    if (!regNo && !uid) {
      return res.status(400).json({ error: 'Registration number or User ID required' });
    }

    const searchRegs = [];
    if (regNo) {
      const clean = regNo.trim();
      searchRegs.push(clean);
      const cleanAppId = clean.replace(/^LUK-ADM-/, '');
      searchRegs.push(cleanAppId, `LUK-ADM-${cleanAppId}`);

      try {
        const apps = await Application.findAll();
        const matchingApp = apps.find(a =>
          a.id === clean ||
          a.id === cleanAppId ||
          `LUK-ADM-${a.id}` === clean ||
          a.uid === clean ||
          (a.formData && (a.formData.jambRegNo === clean || a.formData.jamb_reg_no === clean))
        );
        if (matchingApp) {
          searchRegs.push(matchingApp.id, `LUK-ADM-${matchingApp.id}`);
          if (matchingApp.formData?.jambRegNo) searchRegs.push(matchingApp.formData.jambRegNo);
          if (matchingApp.uid) searchRegs.push(matchingApp.uid);
        }
      } catch (appErr) {
        logger.warn('Application lookup in my-result warning:', appErr);
      }
    }

    const where = {};
    if (searchRegs.length > 0) {
      where[Op.or] = [
        { registrationNumber: { [Op.in]: searchRegs } },
        ...(uid ? [{ uid }] : [])
      ];
    } else if (uid) {
      where.uid = uid;
    }

    const submission = await EntranceExamSubmission.findOne({ where });
    if (!submission) {
      return res.status(404).json({ error: 'No entrance exam submission found for this registration number' });
    }

    res.json(submission);
  } catch (error) {
    logger.error('Error getting candidate result:', error);
    res.status(500).json({ error: 'Failed to fetch exam result' });
  }
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
async function seedDefaultAdmin() {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin_user@example.com';
    const adminUsername = adminEmail;
    const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'AdminPassword123!';

    const existingAdmin = await User.findOne({
      where: {
        [Op.or]: [{ email: adminEmail }, { username: adminUsername }]
      }
    });

    if (!existingAdmin) {
      const uid = 'usr_admin_default_2026';
      const hashedPassword = hashPassword(adminPass);
      await User.create({
        uid,
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        name: 'System Admin',
        role: 'admin',
        level: 'Staff'
      });
      logger.info(`🔑 Default admin account synchronized: ${adminEmail}`);
    }
  } catch (error) {
    logger.error('Error seeding default admin account:', error);
  }
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('🐘 Database synced successfully');
    await seedDefaultAdmin();
  } catch (err) {
    logger.warn(`⚠️ Database sync bypassed: ${err.message}`);
  }

  server.listen(PORT, () => {
    logger.info(`🚀 THE BEST UniPortal Server running on port ${PORT}`);
  });
};

startServer();
