export type UserRole = 'admin' | 'student' | 'staff' | 'applicant';
export type UniversityName = 'UNIBEN' | 'UI' | 'UNILAG' | 'GENERAL';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  university: UniversityName;
  photoUrl?: string;
  faculty?: string;
  department?: string;
  level?: string;
  matricNo?: string;
  staffId?: string;
  isVerified?: boolean;
  kofaId?: string; // UNIBEN specific
  unilagId?: string; // UNILAG specific
  uiMatricNo?: string; // UI specific
  studentEmail?: string;
  virtualAccountNumber?: string;
}

export interface LoanApplication {
  id?: string;
  uid: string;
  name: string;
  amount: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  university: UniversityName;
  repaymentPeriod: number; // in months
}

export interface AdmissionApplication {
  id?: string;
  uid: string;
  name: string;
  email: string;
  university: UniversityName;
  faculty: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  credentials?: string[];
  createdAt: string;
  jambRegNo: string;
  postUtmeScore?: number;
}

export interface Course {
  id?: string;
  courseCode: string;
  title: string;
  units: number;
  faculty: string;
  department: string;
  level: string;
}

export interface Registration {
  id?: string;
  studentId: string;
  semester: string;
  level: string;
  courses: string[];
  isApproved: boolean;
  createdAt: string;
}

export interface Payment {
  id?: string;
  uid: string;
  amount: number;
  type: 'tuition' | 'hostel' | 'admission';
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  createdAt: string;
}

export interface Hostel {
  id?: string;
  name: string;
  roomNumber: string;
  bedNumber: string;
  isOccupied: boolean;
  occupantId?: string;
}

export interface Result {
  id?: string;
  studentId: string;
  courseId: string;
  grade: string;
  score: number;
  semester: string;
  level: string;
  gp: number;
}
