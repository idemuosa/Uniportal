const path = require('path');
const { Sequelize, DataTypes, Op } = require('sequelize');
require('dotenv').config();

// Parse command line arguments
function getArg(flag) {
  const arg = process.argv.find(a => a.startsWith(`${flag}=`));
  return arg ? arg.split('=')[1] : null;
}

const sqliteStorage = getArg('--sqlite-path') || process.env.SQLITE_PATH || path.join(__dirname, '..', 'uniportal.sqlite');
const pgUrl = getArg('--target-db-url') || process.env.DATABASE_URL;

console.log('--------------------------------------------------');
console.log('🚀 UniPortal SQLite to Render PostgreSQL Migration');
console.log('--------------------------------------------------');
console.log(`📁 Source SQLite DB: ${sqliteStorage}`);

if (!pgUrl || (!pgUrl.startsWith('postgres://') && !pgUrl.startsWith('postgresql://'))) {
  console.error('❌ Error: Target PostgreSQL DATABASE_URL is required.');
  console.error('Usage: npm run migrate:pg -- --target-db-url=postgres://user:password@host:5432/dbname');
  console.error('OR set DATABASE_URL environment variable.');
  process.exit(1);
}

const isLocalPg = pgUrl.includes('localhost') || pgUrl.includes('127.0.0.1');
console.log(`🐘 Target PostgreSQL DB: ${pgUrl.replace(/:[^:@]+@/, ':****@')}`);

// 1. Source SQLite Sequelize Instance
const sourceSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: sqliteStorage,
  logging: false
});

// 2. Target PostgreSQL Sequelize Instance
const targetSequelize = new Sequelize(pgUrl, {
  dialect: 'postgres',
  logging: false,
  ...(isLocalPg ? {} : {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  })
});

// Helper model definer
function defineModels(sequelize) {
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
    stream: { type: DataTypes.STRING, defaultValue: 'JAMB' },
    subject: { type: DataTypes.STRING },
    question: { type: DataTypes.TEXT },
    options: { type: DataTypes.JSON },
    correctAnswer: { type: DataTypes.INTEGER, defaultValue: 0 },
    faculty: { type: DataTypes.STRING },
    department: { type: DataTypes.STRING }
  });

  const EntranceExamSubmission = sequelize.define('EntranceExamSubmission', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    registrationNumber: { type: DataTypes.STRING, unique: true },
    candidateName: { type: DataTypes.STRING },
    candidateEmail: { type: DataTypes.STRING },
    uid: { type: DataTypes.STRING },
    stream: { type: DataTypes.STRING, defaultValue: 'JAMB' },
    faculty: { type: DataTypes.STRING },
    department: { type: DataTypes.STRING },
    totalScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    maxScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 100 },
    percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    subjectScores: { type: DataTypes.JSON },
    answers: { type: DataTypes.JSON },
    status: { type: DataTypes.STRING, defaultValue: 'submitted' },
    admissionGuaranteed: { type: DataTypes.BOOLEAN, defaultValue: false },
    releasedAt: { type: DataTypes.DATE },
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });

  return {
    User,
    Payment,
    Attendance,
    Application,
    EntranceExamQuestion,
    EntranceExamSubmission
  };
}

const sourceModels = defineModels(sourceSequelize);
const targetModels = defineModels(targetSequelize);

async function migrateTable(tableName, sourceModel, targetModel, primaryKey) {
  console.log(`\n📦 Syncing table '${tableName}'...`);
  const records = await sourceModel.findAll({ raw: true });
  console.log(`   Found ${records.length} record(s) in SQLite.`);

  if (records.length === 0) {
    console.log(`   ℹ️ No records to migrate for '${tableName}'.`);
    return { name: tableName, count: 0, status: 'SUCCESS' };
  }

  // Sanitize / parse JSON attributes if stored as strings in SQLite
  const cleanedRecords = records.map(r => {
    const item = { ...r };
    for (const key of Object.keys(item)) {
      if (item[key] === null || item[key] === undefined) continue;
      // Parse JSON fields if necessary
      if (typeof item[key] === 'string' && (item[key].startsWith('{') || item[key].startsWith('['))) {
        try {
          item[key] = JSON.parse(item[key]);
        } catch (e) {
          // Keep raw string if not JSON
        }
      }
      // Convert SQLite integer booleans to true/false
      if (key === 'admissionGuaranteed' && typeof item[key] === 'number') {
        item[key] = Boolean(item[key]);
      }
    }
    return item;
  });

  // Bulk create in PostgreSQL
  const keys = Object.keys(cleanedRecords[0]);
  await targetModel.bulkCreate(cleanedRecords, {
    updateOnDuplicate: keys,
    validate: true
  });

  const targetCount = await targetModel.count();
  console.log(`   ✅ Target PostgreSQL table '${tableName}' now has ${targetCount} record(s).`);

  if (targetCount >= records.length) {
    return { name: tableName, count: records.length, status: 'SUCCESS' };
  } else {
    throw new Error(`Record count mismatch in '${tableName}'. Expected at least ${records.length}, got ${targetCount}`);
  }
}

async function runMigration() {
  try {
    console.log('\n🔌 Testing connections...');
    await sourceSequelize.authenticate();
    console.log('   ✅ Connected to source SQLite DB.');
    await targetSequelize.authenticate();
    console.log('   ✅ Connected to target PostgreSQL DB.');

    console.log('\n🔨 Synchronizing PostgreSQL schema...');
    await targetSequelize.sync({ alter: true });
    console.log('   ✅ Schema synchronized.');

    const tables = [
      { name: 'Users', source: sourceModels.User, target: targetModels.User, pk: 'uid' },
      { name: 'Payments', source: sourceModels.Payment, target: targetModels.Payment, pk: 'id' },
      { name: 'Attendances', source: sourceModels.Attendance, target: targetModels.Attendance, pk: 'id' },
      { name: 'Applications', source: sourceModels.Application, target: targetModels.Application, pk: 'id' },
      { name: 'EntranceExamQuestions', source: sourceModels.EntranceExamQuestion, target: targetModels.EntranceExamQuestion, pk: 'id' },
      { name: 'EntranceExamSubmissions', source: sourceModels.EntranceExamSubmission, target: targetModels.EntranceExamSubmission, pk: 'id' },
    ];

    const results = [];

    for (const table of tables) {
      const res = await migrateTable(table.name, table.source, table.target, table.pk);
      results.push(res);
    }

    console.log('\n==================================================');
    console.log('🎉 MIGRATION COMPLETE SUMMARY');
    console.log('==================================================');
    results.forEach(r => {
      console.log(` - ${r.name.padEnd(25)} : ${r.count} record(s) migrated [${r.status}]`);
    });
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
