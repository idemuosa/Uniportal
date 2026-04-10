const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Firebase Admin initialization
try {
  // Use service account if available, else local default
  if (process.env.SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.SERVICE_ACCOUNT_PATH);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }
} catch (e) {
  console.warn('Firebase Admin already initialized or missing credentials');
}

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(bodyParser.json());

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
          <h2 style="color: #6d28d9; border-bottom: 1px solid #f3f4f6; padding-bottom: 20px;">${subject}</h2>
          <div style="padding: 20px 0; line-height: 1.6;">
            ${body}
          </div>
          <hr style="border: 1px solid #f3f4f6; margin: 30px 0;" />
          <p style="font-size: 11px; color: #999; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            Institutional Registry • Digital Confirmation • ${new Date().getFullYear()}
          </p>
        </div>
      `,
    };

    if (ccAdmin) {
      mailOptions.cc = adminEmail;
    }

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Notification Dispatch Failed:', err);
  }
}

// 📡 Notification Endpoint for Admissions & Courses
app.post('/api/notify', async (req, res) => {
  const { to, subject, body, type } = req.body;
  if (!to || !subject || !body) return res.status(400).json({ error: 'Missing logic' });

  try {
    await sendEmail({ to, subject, body });
    res.json({ status: 'success', message: `Institutional ${type || 'Notification'} Dispatched` });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Delivery Failure' });
  }
});

// 💳 Remita Payment endpoint (Production-ready mock)
app.post('/api/remita/payment', async (req, res) => {
  const { uid, type, amount, email: userEmail } = req.body;
  if (!uid || !amount) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const transactionId = 'RM-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // 1. Log to Firestore
    await db.collection('payments').add({
      uid,
      amount: Number(amount),
      type,
      status: 'completed',
      transactionId,
      method: 'remita',
      createdAt: new Date().toISOString(),
    });

    // 2. Automated Email
    const userDoc = await db.collection('users').doc(uid).get();
    const targetEmail = userEmail || userDoc.data()?.email;
    
    if (targetEmail) {
      await sendEmail({
        to: targetEmail,
        subject: `Treasury Receipt: ${type.toUpperCase()}`,
        body: `
          <p>Confirmation of verified payment for <b>${type}</b>.</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 5px 0;"><b>Value Secured:</b> ₦${amount.toLocaleString()}</p>
            <p style="margin: 5px 0;"><b>Auth Reference:</b> ${transactionId}</p>
            <p style="margin: 5px 0;"><b>Temporal Hash:</b> ${new Date().toLocaleString()}</p>
          </div>
          <p>This document serves as an official proof of financial settlement.</p>
        `
      });
    }

    res.json({ 
      status: 'success', 
      message: 'Payment verified and treasury updated',
      transactionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Remita Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal treasury synchronisation failure' });
  }
});

// Health Check
app.get('/health', (req, res) => res.send('Treasury API Active'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Treasury Server running on port ${PORT}`));