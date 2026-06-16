const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const { Server } = require("socket.io");
const http = require('http');
const winston = require('winston');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { sequelize, User, Payment, Attendance, Application } = require('./database');

// 🪵 Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

// 🔥 Firebase Admin initialization (Still used for Auth Verification)
try {
  if (process.env.SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.SERVICE_ACCOUNT_PATH);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }
  logger.info('Firebase Admin Initialized for Auth');
} catch (e) {
  logger.warn('Firebase Admin already initialized or missing credentials');
}

const app = express();
const server = http.createServer(app);

// 📡 Socket.io Initialization
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(bodyParser.json());

// 🤖 AI Tutor Initialization
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");

// 📨 Institutional Notification Hub
async function sendEmail({ to, subject, body, ccAdmin = true }) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@university.edu';
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: { 
        user: process.env.EMAIL_USER || 'treasury@university.edu', 
        pass: process.env.EMAIL_PASS 
      },
    });

    const mailOptions = {
      from: '"University Registry" <registry@university.edu>',
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 40px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px;">
          <h2 style="color: #008751; border-bottom: 1px solid #f3f4f6; padding-bottom: 20px;">${subject}</h2>
          <div style="padding: 20px 0; line-height: 1.6;">${body}</div>
          <hr style="border: 1px solid #f3f4f6; margin: 30px 0;" />
          <p style="font-size: 11px; color: #999; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            Institutional Registry • Digital Confirmation • ${new Date().getFullYear()}
          </p>
        </div>
      `,
    };

    if (ccAdmin) mailOptions.cc = adminEmail;
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error('Notification Dispatch Failed:', err);
  }
}

// ------------------------------------------------------------------
// API ENDPOINTS (PostgreSQL Powered)
// ------------------------------------------------------------------

// Sync User Metadata from Firebase to PostgreSQL
app.post('/api/users/sync', async (req, res) => {
  const { uid, email, name, role } = req.body;
  try {
    const [user, created] = await User.findOrCreate({
      where: { uid },
      defaults: { email, name, role }
    });
    res.json({ status: 'success', user, created });
  } catch (error) {
    logger.error('Sync Error:', error);
    res.status(500).json({ error: 'Database sync failed' });
  }
});

// 1️⃣ AI Tutor Endpoint
app.post('/api/ai/tutor', async (req, res) => {
  const { prompt, studentInfo } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const context = `You are an AI Tutor for UniPortal. Student: ${studentInfo.name}, Dept: ${studentInfo.department}. Answer helpfully.`;
    const result = await model.generateContent([context, prompt]);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    logger.error('AI Error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// 2️⃣ Real-time Notification Dispatcher
app.post('/api/notify', async (req, res) => {
  const { to, subject, body, type, userId } = req.body;
  try {
    await sendEmail({ to, subject, body });
    if (userId) {
      io.to(`user_${userId}`).emit('notification', { title: subject, message: body, type });
    }
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ error: 'Notification failure' });
  }
});

// 3️⃣ Treasury & Payments (PostgreSQL)
app.post('/api/payments/verify', async (req, res) => {
  const { uid, amount, type, reference } = req.body;
  try {
    const transactionId = reference || 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    await Payment.create({
      uid, amount, type, status: 'success',
      transactionId, method: 'remita'
    });

    io.to(`user_${uid}`).emit('payment_verified', { transactionId, status: 'success' });
    
    logger.info(`Payment verified: ${transactionId} for user ${uid}`);
    res.json({ status: 'success', transactionId });
  } catch (error) {
    logger.error('Payment Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// 4️⃣ Attendance Logging (PostgreSQL)
app.post('/api/academics/attendance', async (req, res) => {
  const { studentId, courseId, location } = req.body;
  try {
    await Attendance.create({ studentId, courseId, location });
    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ error: 'Attendance log failed' });
  }
});

// 5️⃣ Admissions (PostgreSQL)
app.post('/api/academics/applications', async (req, res) => {
  const { uid, type, faculty, department, face_url, ...formData } = req.body;
  try {
    const application = await Application.create({
      uid, type, faculty, department, faceUrl: face_url, formData
    });
    res.json({ status: 'success', application });
  } catch (error) {
    logger.error('Application Error:', error);
    res.status(500).json({ error: 'Application submission failed' });
  }
});

// ------------------------------------------------------------------
// SOCKET.IO EVENTS
// ------------------------------------------------------------------
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`User ${userId} joined their notification room`);
  });
});

// ------------------------------------------------------------------
// SERVER START
// ------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  logger.info('PostgreSQL Database Connected & Synced');
  server.listen(PORT, () => {
    logger.info(`🚀 Productive Portal Server running on port ${PORT}`);
  });
}).catch(err => {
  logger.error('Unable to connect to PostgreSQL:', err);
});
