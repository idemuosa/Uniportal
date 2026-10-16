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
  Application
};
