const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/uniportal';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  ...(process.env.DATABASE_URL ? {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Necessary for many cloud providers like Railway/Render
      }
    }
  } : {})
});

// Define Models
const User = sequelize.define('User', {
  uid: { type: DataTypes.STRING, primaryKey: true }, // Firebase UID
  email: { type: DataTypes.STRING, unique: true },
  name: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM('admin', 'student', 'staff', 'applicant'), defaultValue: 'student' },
  faculty: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },
  level: { type: DataTypes.STRING, defaultValue: '100L' },
  matricNo: { type: DataTypes.STRING, unique: true },
  photoUrl: { type: DataTypes.STRING }
});

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  uid: { type: DataTypes.STRING },
  amount: { type: DataTypes.DECIMAL(10, 2) },
  type: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  transactionId: { type: DataTypes.STRING, unique: true },
  method: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  studentId: { type: DataTypes.STRING },
  courseId: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Application = sequelize.define('Application', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  uid: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  faculty: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  faceUrl: { type: DataTypes.STRING },
  formData: { type: DataTypes.JSONB } // Store other form fields
});

// Relationships
User.hasMany(Payment, { foreignKey: 'uid' });
Payment.belongsTo(User, { foreignKey: 'uid' });

User.hasMany(Attendance, { foreignKey: 'studentId' });
Attendance.belongsTo(User, { foreignKey: 'studentId' });

User.hasOne(Application, { foreignKey: 'uid' });
Application.belongsTo(User, { foreignKey: 'uid' });

module.exports = {
  sequelize,
  User,
  Payment,
  Attendance,
  Application
};
