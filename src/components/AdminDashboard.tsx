import { useState, useEffect } from 'react';
import { UserProfile, AdmissionApplication, Course } from '../types';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDocs, where } from 'firebase/firestore';
import { FACULTIES, DEPARTMENTS, LEVELS, SCHOOL_FEES } from '../constants';
import { toast } from 'sonner';
import { Users, FileText, BookOpen, Settings, CheckCircle, XCircle, Trash2, Plus, DollarSign, Building2, Landmark, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { LoanApplication } from '../types';

interface AdminDashboardProps {
  user: UserProfile;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'students' | 'courses' | 'fees' | 'loans' | 'setup'>('applications');
  const [loading, setLoading] = useState(true);

  // New Course Form State
  const [newCourse, setNewCourse] = useState({ courseCode: '', title: '', units: 3, faculty: '', department: '', level: '100L' });
  const [newDept, setNewDept] = useState({ faculty: '', name: '' });

  useEffect(() => {
    const unsubApps = onSnapshot(collection(db, 'applications'), (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdmissionApplication)));
    });
    const unsubStudents = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)).filter(u => u.role === 'student'));
    });
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });
    const unsubLoans = onSnapshot(collection(db, 'loans'), (snapshot) => {
      setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanApplication)));
    });
    setLoading(false);
    return () => { unsubApps(); unsubStudents(); unsubCourses(); unsubLoans(); };
  }, []);

  const handleApprove = async (app: AdmissionApplication) => {
    try {
      const emailPrefix = app.name.toLowerCase().replace(/\s+/g, '.');
      const universityDomain = app.university.toLowerCase() === 'general' ? 'uniportal.edu.ng' : `${app.university.toLowerCase()}.edu.ng`;
      const studentEmail = `${emailPrefix}@${universityDomain}`;
      const virtualAccountNumber = `99${Math.floor(10000000 + Math.random() * 90000000)}`;

      await updateDoc(doc(db, 'applications', app.id!), { status: 'approved' });
      await updateDoc(doc(db, 'users', app.uid), {
        role: 'student',
        faculty: app.faculty,
        department: app.department,
        level: '100L',
        matricNo: `UNI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        studentEmail,
        virtualAccountNumber
      });
      toast.success('Application approved! Student email and virtual account generated.');
    } catch (error) {
      toast.error('Failed to approve application');
    }
  };

  const handleLoanStatus = async (loanId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'loans', loanId), { status });
      toast.success(`Loan application ${status} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${status} loan application`);
    }
  };

  const handleReject = async (app: AdmissionApplication) => {
    try {
      await updateDoc(doc(db, 'applications', app.id!), { status: 'rejected' });
      toast.success('Application rejected');
    } catch (error) {
      toast.error('Failed to reject application');
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.courseCode || !newCourse.title || !newCourse.faculty) {
      toast.error('Please fill all course details');
      return;
    }
    try {
      await addDoc(collection(db, 'courses'), newCourse);
      setNewCourse({ courseCode: '', title: '', units: 3, faculty: '', department: '', level: '100L' });
      toast.success('Course added successfully');
    } catch (error) {
      toast.error('Failed to add course');
    }
  };

  const handleAddDept = async () => {
    if (!newDept.faculty || !newDept.name) {
      toast.error('Please fill all department details');
      return;
    }
    toast.success('Department added (Simulated - would update constants/db)');
    setNewDept({ faculty: '', name: '' });
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-neutral-500">Manage university operations and data.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
          <button onClick={() => setActiveTab('applications')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'applications' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}>Applications</button>
          <button onClick={() => setActiveTab('students')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'students' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}>Students</button>
          <button onClick={() => setActiveTab('courses')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'courses' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}>Courses</button>
          <button onClick={() => setActiveTab('fees')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'fees' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}>Fees</button>
          <button onClick={() => setActiveTab('loans')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'loans' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}>Loans</button>
          <button onClick={() => setActiveTab('setup')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'setup' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}>Setup</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users className="w-6 h-6" /></div>
            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Students</span>
          </div>
          <p className="text-3xl font-bold">{students.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileText className="w-6 h-6" /></div>
            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Apps</span>
          </div>
          <p className="text-3xl font-bold">{applications.filter(a => a.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><BookOpen className="w-6 h-6" /></div>
            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Courses</span>
          </div>
          <p className="text-3xl font-bold">{courses.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Landmark className="w-6 h-6" /></div>
            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Loans</span>
          </div>
          <p className="text-3xl font-bold">{loans.filter(l => l.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Revenue</span>
          </div>
          <p className="text-3xl font-bold">₦0</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        {activeTab === 'applications' && (
          <div className="p-8">
            <h3 className="text-xl font-bold mb-6">Admission Applications</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Name</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Faculty</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Department</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 font-medium">{app.name}</td>
                      <td className="py-4 text-neutral-600">{app.faculty}</td>
                      <td className="py-4 text-neutral-600">{app.department}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : app.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {app.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(app)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"><CheckCircle className="w-5 h-5" /></button>
                            <button onClick={() => handleReject(app)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><XCircle className="w-5 h-5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="p-8">
            <h3 className="text-xl font-bold mb-6">Loan Applications</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Student</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Amount</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Purpose</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 font-medium">{loan.name}</td>
                      <td className="py-4 font-mono">₦{loan.amount.toLocaleString()}</td>
                      <td className="py-4 text-neutral-600 max-w-xs truncate">{loan.purpose}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${loan.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : loan.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {loan.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleLoanStatus(loan.id!, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"><CheckCircle className="w-5 h-5" /></button>
                            <button onClick={() => handleLoanStatus(loan.id!, 'rejected')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><XCircle className="w-5 h-5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="p-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-6 h-6" />
                  Add New Course
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Course Code (e.g. CSC101)"
                    value={newCourse.courseCode}
                    onChange={e => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                    className="w-full p-4 rounded-xl border border-neutral-200 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Course Title"
                    value={newCourse.title}
                    onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="w-full p-4 rounded-xl border border-neutral-200 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newCourse.faculty}
                      onChange={e => setNewCourse({ ...newCourse, faculty: e.target.value, department: '' })}
                      className="p-4 rounded-xl border border-neutral-200 outline-none bg-white"
                    >
                      <option value="">Select Faculty</option>
                      {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select
                      value={newCourse.department}
                      onChange={e => setNewCourse({ ...newCourse, department: e.target.value })}
                      className="p-4 rounded-xl border border-neutral-200 outline-none bg-white"
                    >
                      <option value="">Select Dept</option>
                      {newCourse.faculty && DEPARTMENTS[newCourse.faculty].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddCourse} className="w-full bg-neutral-900 text-white p-4 rounded-xl font-bold hover:bg-neutral-800 transition-all">Add Course</button>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  Add New Department
                </h3>
                <div className="space-y-4">
                  <select
                    value={newDept.faculty}
                    onChange={e => setNewDept({ ...newDept, faculty: e.target.value })}
                    className="w-full p-4 rounded-xl border border-neutral-200 outline-none bg-white"
                  >
                    <option value="">Select Faculty</option>
                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Department Name"
                    value={newDept.name}
                    onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full p-4 rounded-xl border border-neutral-200 outline-none"
                  />
                  <button onClick={handleAddDept} className="w-full bg-neutral-900 text-white p-4 rounded-xl font-bold hover:bg-neutral-800 transition-all">Add Department</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="p-8">
            <h3 className="text-xl font-bold mb-6">Enrolled Students</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Matric No</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Name</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Faculty</th>
                    <th className="py-4 font-bold text-sm text-neutral-500 uppercase tracking-wider">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {students.map(student => (
                    <tr key={student.uid} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-4 font-mono text-sm">{student.matricNo}</td>
                      <td className="py-4 font-medium">{student.name}</td>
                      <td className="py-4 text-neutral-600">{student.faculty}</td>
                      <td className="py-4 text-neutral-600">{student.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="p-8">
            <h3 className="text-xl font-bold mb-6">School Fees Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-neutral-500 uppercase tracking-wider text-xs">Current Fee Schedule</h4>
                {Object.entries(SCHOOL_FEES).map(([level, fee]) => (
                  <div key={level} className="flex justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <span className="font-bold">{level}</span>
                    <span className="font-mono">₦{fee.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="bg-neutral-900 text-white p-8 rounded-3xl">
                <h4 className="text-xl font-bold mb-4">Update Next Level Fees</h4>
                <p className="text-neutral-400 text-sm mb-6">Adjust the fees for the upcoming academic session.</p>
                <div className="space-y-4">
                  <select className="w-full p-4 rounded-xl bg-neutral-800 border border-neutral-700 outline-none">
                    <option>Select Level</option>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                  <input type="number" placeholder="New Fee Amount" className="w-full p-4 rounded-xl bg-neutral-800 border border-neutral-700 outline-none" />
                  <button className="w-full bg-white text-neutral-900 p-4 rounded-xl font-bold hover:bg-neutral-100 transition-colors">Update Fees</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
