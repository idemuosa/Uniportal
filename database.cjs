const { Sequelize, DataTypes, Op } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;

let sequelize;

if (dbUrl && (dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql'))) {
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    ...(isLocal ? {} : {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  });
} else if (dbUrl && dbUrl.startsWith('sqlite')) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbUrl.replace(/^sqlite:\/\//, '').replace(/^sqlite:/, '') || './uniportal.sqlite',
    logging: false
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './uniportal.sqlite',
    logging: false
  });
}

// Define Models
const User = sequelize.define('User', {
  uid: { type: DataTypes.STRING, primaryKey: true },
  username: { type: DataTypes.STRING, unique: true },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  firstName: { type: DataTypes.STRING },
  lastName: { type: DataTypes.STRING },
  name: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, defaultValue: 'student' },
  faculty: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },
  level: { type: DataTypes.STRING, defaultValue: '100L' },
  matricNo: { type: DataTypes.STRING },
  photoUrl: { type: DataTypes.STRING }
});

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  uid: { type: DataTypes.STRING },
  amount: { type: DataTypes.DECIMAL(10, 2) },
  type: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
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
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  faceUrl: { type: DataTypes.STRING },
  formData: { type: DataTypes.JSON }
});

const EntranceExamQuestion = sequelize.define('EntranceExamQuestion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  stream: { type: DataTypes.STRING, defaultValue: 'JAMB' }, // 'JAMB' or 'Direct Entry'
  subject: { type: DataTypes.STRING }, // e.g. 'English Language', 'General Aptitude', etc.
  question: { type: DataTypes.TEXT },
  options: { type: DataTypes.JSON }, // ["Option A", "Option B", "Option C", "Option D"]
  correctAnswer: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0-based index
  faculty: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING }
});

const EntranceExamSubmission = sequelize.define('EntranceExamSubmission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  registrationNumber: { type: DataTypes.STRING, unique: true }, // JAMB Reg No or DE CBT Reg No
  candidateName: { type: DataTypes.STRING },
  candidateEmail: { type: DataTypes.STRING },
  uid: { type: DataTypes.STRING },
  stream: { type: DataTypes.STRING, defaultValue: 'JAMB' }, // 'JAMB' or 'Direct Entry'
  faculty: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },
  totalScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  maxScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 100 },
  percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  subjectScores: { type: DataTypes.JSON }, // e.g. { "English Language": 80, "Mathematics": 70 }
  answers: { type: DataTypes.JSON },
  status: { type: DataTypes.STRING, defaultValue: 'submitted' }, // 'submitted' or 'released'
  admissionGuaranteed: { type: DataTypes.BOOLEAN, defaultValue: false },
  releasedAt: { type: DataTypes.DATE },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
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
  Op,
  User,
  Payment,
  Attendance,
  Application,
  EntranceExamQuestion,
  EntranceExamSubmission
};
