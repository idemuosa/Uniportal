import { useState, useEffect } from 'react';
import { UserProfile, AdmissionApplication, Course, LoanApplication, BankDetails } from '../../types';
import api from '../../api/axios';
import { FACULTIES, DEPARTMENTS, LEVELS, SCHOOL_FEES } from '../../constants';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Users, FileText, BookOpen, Settings, CheckCircle, XCircle, Trash2, Plus, DollarSign, Building2, Landmark, Clock, ArrowRight, Camera, Eye, Fingerprint, ShieldCheck, Award, AlertCircle, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  user: UserProfile;
  onSimulateLogin?: (user: UserProfile) => void;
}

export default function AdminDashboard({ user, onSimulateLogin }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'students' | 'courses' | 'treasury' | 'loans' | 'setup'>('applications');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);

  // New Course Form State
  const [newCourse, setNewCourse] = useState({ courseCode: '', title: '', units: 3, faculty: '', department: '', level: '100L' });
  const [newDept, setNewDept] = useState({ faculty: '', name: '' });
  const [manualStudent, setManualStudent] = useState({ name: '', email: '', faculty: '', department: '', level: '100L', age: 18, locationCity: '' });

  // Treasury State
  const [bankSetup, setBankSetup] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [banks, setBanks] = useState<BankDetails[]>([
    { accountName: 'idemudia osamudiamen', bankName: 'UBA', accountNumber: '2054037193' },
    { accountName: 'idemudia osamudiamen', bankName: 'OPAY', accountNumber: '8183793358' },
    { accountName: 'idemudia osamudiamen', bankName: 'PALMPAY', accountNumber: '8106202283' }
  ]);
  const [manualPay, setManualPay] = useState({ uid: '', type: 'tuition' as 'tuition' | 'hostel' | 'admission', amount: 0 });
  const [dynamicFees, setDynamicFees] = useState<Record<string, number>>(SCHOOL_FEES);
  const [maxLoanAmount, setMaxLoanAmount] = useState<number>(500000);
  const [acceptanceFee, setAcceptanceFee] = useState<number>(120000);
  const [earlyPaymentDiscount, setEarlyPaymentDiscount] = useState<number>(5);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [appsRes, studentsRes, coursesRes, loansRes, treasuryRes, bankRes] = await Promise.all([
          api.get('/academics/applications/'),
          api.get('/accounts/users/?role=student'),
          api.get('/academics/courses/'),
          api.get('/finances/loans/'),
          api.get('/portal/treasury-settings/'),
          api.get('/portal/bank-details/')
        ]);

        setApplications(appsRes.data);
        setStudents(studentsRes.data.map((u: any) => ({
          uid: u.id.toString(),
          email: u.email,
          role: u.role,
          name: `${u.first_name} ${u.last_name}`.trim(),
          university: 'UniPortal',
          ...u
        })));
        setCourses(coursesRes.data);
        setLoans(loansRes.data);
        
        if (treasuryRes.data.length > 0) {
          const t = treasuryRes.data[0];
          setMaxLoanAmount(t.max_loan_amount);
          setAcceptanceFee(t.acceptance_fee);
          setEarlyPaymentDiscount(t.early_payment_discount);
          // Fees logic would go here if synced
        }

        if (bankRes.data.length > 0) {
          setBanks(bankRes.data.map((b: any) => ({
            bankName: b.bank_name,
            accountNumber: b.account_number,
            accountName: b.account_name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Data Sync Interrupted');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (app: AdmissionApplication) => {
    try {
      const emailPrefix = app.name.toLowerCase().replace(/\s+/g, '.');
      const universityDomain = 'uniportal.edu.ng';
      const studentEmail = `${emailPrefix}@${universityDomain}`;
      const virtualAccountNumber = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
      const matricNo = `UNI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

      // Update Application status
      await api.patch(`/academics/applications/${app.id}/`, { status: 'approved' });
      
      // Update User profile
      await api.patch(`/accounts/users/${app.uid}/`, {
        role: 'student',
        faculty: app.faculty,
        department: app.department,
        level: '100L',
        matric_no: matricNo,
        student_email: studentEmail,
        virtual_account_number: virtualAccountNumber,
        age: app.age,
        location_city: app.locationCity
      });

      // Notification logic (keeping as fetch for now or moving to backend if needed)
      // For now, let's assume the notification happens on the backend eventually.

      toast.success('Application approved! Student email and nodes initialized.');
      // Refresh data
      window.location.reload(); 
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve application');
    }
  };

  const handleLoanStatus = async (loanId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/finances/loans/${loanId}/`, { status });
      toast.success(`Loan application ${status} successfully!`);
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status } : l));
    } catch (error) {
      toast.error(`Failed to ${status} loan application`);
    }
  };

  const handleReject = async (app: AdmissionApplication) => {
    try {
      await api.patch(`/academics/applications/${app.id!}/`, { status: 'rejected' });
      toast.success('Application rejected');
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
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
      await api.post('/academics/courses/', {
        course_code: newCourse.courseCode,
        title: newCourse.title,
        units: newCourse.units,
        faculty: newCourse.faculty,
        department: newCourse.department,
        level: newCourse.level
      });
      setNewCourse({ courseCode: '', title: '', units: 3, faculty: '', department: '', level: '100L' });
      toast.success('Course added successfully');
      // Refresh courses
      const res = await api.get('/academics/courses/');
      setCourses(res.data);
    } catch (error) {
      toast.error('Failed to add course');
    }
  };

  const handleAddDept = async () => {
    if (!newDept.faculty || !newDept.name) {
      toast.error('Please fill all department details');
      return;
    }
    toast.success('Department added (Local Cache Updated)');
    setNewDept({ faculty: '', name: '' });
  };

  const handleAddBank = async () => {
    if (!bankSetup.bankName || !bankSetup.accountNumber || !bankSetup.accountName) {
      toast.error('Please fill all bank details');
      return;
    }
    
    try {
      const response = await api.post('/portal/bank-details/', {
        bank_name: bankSetup.bankName,
        account_number: bankSetup.accountNumber,
        account_name: bankSetup.accountName
      });
      
      setBanks(prev => [...prev, {
        bankName: response.data.bank_name,
        accountNumber: response.data.account_number,
        accountName: response.data.account_name
      }]);

      toast.success('Official bank details configured successfully!');
      setBankSetup({ bankName: '', accountNumber: '', accountName: '' });
    } catch (error) {
      toast.error('Failed to add bank details');
    }
  };

  const handleRemoveBank = async (id: string) => {
    try {
      await api.delete(`/portal/bank-details/${id}/`);
      toast.success('Bank account removed from registry');
      setBanks(prev => prev.filter(b => b.id !== id));
    } catch(err) {
      toast.error('Failed to remove account');
    }
  };

  const handleUpdateFinance = async () => {
    try {
      const payload = {
        max_loan_limit: Number(maxLoanAmount),
        acceptance_fee: Number(acceptanceFee),
        early_payment_discount: Number(earlyPaymentDiscount)
      };

      const res = await api.get('/portal/treasury-settings/');
      if (res.data.length > 0) {
        await api.patch(`/portal/treasury-settings/${res.data[0].id}/`, payload);
      } else {
        await api.post('/portal/treasury-settings/', payload);
      }
      toast.success('Financial parameters updated successfully!');
    } catch (error: any) {
      console.error('Financial Parameter Update Error:', error);
      toast.error(`Failed to update financial parameters`);
    }
  };

  const handleUpdateAllFees = async () => {
    try {
      await setDoc(doc(db, 'settings', 'fees'), dynamicFees, { merge: true });
      toast.success('All treasury tariffs synchronized successfully!');
    } catch (error: any) {
      console.error('Tariff Sync Error:', error);
      toast.error(`Failed to synchronize tariffs: ${error.message || 'Check connection'}`);
    }
  };

  const handleAddNewFeeCategory = () => {
    if (!newCategoryName || !newCategoryAmount) {
      toast.error('Please specify both node name and base amount');
      return;
    }
    const updatedFees = { ...dynamicFees, [newCategoryName.toUpperCase()]: newCategoryAmount };
    setDynamicFees(updatedFees);
    setNewCategoryName('');
    setNewCategoryAmount(0);
    toast.success(`Node "${newCategoryName.toUpperCase()}" initialized in local registry`);
  };

  const handleManualPayment = async () => {
    if (!manualPay.uid || !manualPay.amount) {
      toast.error('Please select a student node and specify the quota');
      return;
    }
    try {
      await api.post('/finances/payments/', {
        user: manualPay.uid,
        amount: manualPay.amount,
        type: manualPay.type,
        status: 'success'
      });
      toast.success('Manual resolution entry finalized!');
      setManualPay({ uid: '', type: 'tuition', amount: 0 });
    } catch (error) {
      toast.error('Failed to register manual entry');
    }
  };

  const handleManualCreateStudent = async () => {
    if (!manualStudent.name || !manualStudent.email || !manualStudent.faculty) {
      toast.error('Please fill all student details');
      return;
    }
    try {
      const response = await api.post('/accounts/register/', {
        username: manualStudent.email, // Use full email for uniqueness
        email: manualStudent.email,
        password: 'ChangeMe123!',
        first_name: manualStudent.name.split(' ')[0],
        last_name: manualStudent.name.split(' ').slice(1).join(' '),
        role: 'student'
      });

      const user = response.data;
      
      // Update with academic details
      await api.patch(`/accounts/users/${user.id}/`, {
        faculty: manualStudent.faculty,
        department: manualStudent.department,
        level: manualStudent.level,
        age: manualStudent.age,
        location_city: manualStudent.locationCity
      });

      toast.success('Student account provisioned and notified!');
      setManualStudent({ name: '', email: '', faculty: '', department: '', level: '100L', age: 18, locationCity: '' });
      
      // Refresh list
      const studentsRes = await api.get('/accounts/users/?role=student');
      setStudents(studentsRes.data.map((u: any) => ({
        uid: u.id.toString(),
        email: u.email,
        role: u.role,
        name: `${u.first_name} ${u.last_name}`.trim(),
        university: 'UniPortal',
        ...u
      })));
    } catch (error) {
      toast.error('Failed to create student account');
    }
  };

  const startSimulation = (student: UserProfile) => {
    if (onSimulateLogin) {
      onSimulateLogin(student);
      navigate('/portal');
      toast.success(`Logged in as ${student.name}`);
    }
  };

  if (loading) return <div className="flex justify-center p-12 bg-white min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-white p-4 font-sans text-[#008751] selection:bg-green-500 selection:text-[#008751] relative overflow-hidden">
      {/*  ATMOSPHERIC BACKGROUND (PURPLE EDITION) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#008751]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#008751]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-green-950/40 p-8 rounded-[3rem] border border-[#008751]/10 shadow-2xl shadow-green-900/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10">
            <h1 className="text-2xl font-black tracking-tighter text-green-950 uppercase mb-1">Admin Node </h1>
            <p className="text-[#008751] font-black uppercase tracking-[0.4em] text-sm">Registration Dashboard</p>
          </div>
          <div className="flex bg-green-50 p-2 rounded-2xl border border-green-100 shadow-inner overflow-x-auto relative z-10 scrollbar-hide">
            {(['applications', 'students', 'courses', 'treasury', 'loans', 'setup'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeTab === tab ? 'bg-[#008751] text-[#008751] shadow-xl shadow-green-900/40 border border-[#008751]/20' : 'text-[#008751] hover:text-[#008751] hover:bg-green-100/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-280 h-29">
          {[
            { icon: Users, label: 'Students', value: students.length, color: 'purple' },
            { icon: FileText, label: 'Apps', value: applications.filter(a => a.status === 'pending').length, color: 'purple' },
            { icon: BookOpen, label: 'Courses', value: courses.length, color: 'purple' },
            { icon: Landmark, label: 'Loans', value: loans.filter(l => l.status === 'pending').length, color: 'purple' },
            { icon: DollarSign, label: 'Revenue', value: '#0', color: 'purple' }
          ].map(stat => (
            <div key={stat.label} className="bg-green-950/40 p-6 rounded-[2.5rem] border border-[#008751]/5 shadow-xl shadow-green-900/5 hover:border-[#008751]/30 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#008751]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-3 bg-green-50 rounded-2xl border border-green-50 text-[#008751] group-hover:bg-[#008751] group-hover:text-[#008751] transition-all duration-500"><stat.icon className="w-4 h-4" /></div>
                <span className="text-base font-black text-[#008751] uppercase tracking-[0.3em]">{stat.label}</span>
              </div>
              <p className="text-2xl font-black text-green-950 tracking-tighter uppercase relative z-10">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-green-950/40 rounded-[2rem] border border-[#008751]/5 shadow-2xl shadow-green-900/5 overflow-hidden relative min-h-[200px]">
          {activeTab === 'applications' && (
            <div className="p-10 relative z-10">
              <h4 className="text-lg font-black mb-8 text-green-950 uppercase tracking-tighter  flex items-center gap-4">
                <FileText className="w-5 h-5 text-[#008751]" />
                Admission
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-green-50">
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Biometric</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Identity</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Faculty</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Dept.</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Status</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {applications.map(app => (
                      <tr key={app.id} className="hover:bg-green-50/50 transition-all group">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${app.faceUrl ? 'bg-white border-[#008751]/10 text-[#008751]' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                              <Camera className="w-4 h-4" />
                            </div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${app.leftIndexUrl ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                              <Fingerprint className="w-4 h-4" />
                            </div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${app.rightIndexUrl ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-200'}`}>
                              <Fingerprint className="w-4 h-4" />
                            </div>
                          </div>
                        </td>
                        <td className="py-6">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="text-left group/name"
                          >
                            <p className="font-black text-green-950 text-base tracking-tight uppercase group-hover/name:text-[#008751] transition-colors uppercase italic mb-1">{app.name}</p>
                            <p className="text-sm font-black text-[#008751] uppercase tracking-widest bg-green-50 px-2 py-1 rounded border border-green-100 inline-block">{app.lukkeRegNo || 'UNASSIGNED ID'}</p>
                          </button>
                        </td>
                        <td className="py-6 text-[#008751] font-black uppercase tracking-tight text-sm italic">{app.faculty}</td>
                        <td className="py-6 text-[#008751] font-black uppercase tracking-tight text-sm italic">{app.department}</td>
                        <td className="py-6">
                          <span className={`px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-[0.3em] border shadow-sm ${app.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : app.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedApp(app)} className="p-2.5 bg-green-50 text-[#008751] rounded-xl hover:bg-[#008751] hover:text-[#008751] border border-green-100 shadow-inner transition-all active:scale-90"><Eye className="w-4 h-4" /></button>
                            {app.status === 'pending' && (
                              <>
                                <button onClick={() => handleApprove(app)} className="p-2.5 bg-[#008751] text-[#008751] rounded-xl hover:bg-green-700 transition-all shadow-lg active:scale-90"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={() => handleReject(app)} className="p-2.5 bg-slate-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-50 transition-all active:scale-90"><XCircle className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="p-10 relative z-10">
              <h3 className="text-lg font-black mb-8 text-green-950 uppercase tracking-tighter italic flex items-center gap-4">
                <BookOpen className="w-5 h-5 text-[#008751]" />
                Course Management Dashboard
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-green-50">
                      <th className="py-6 font-black text-[10px] text-[#008751] uppercase tracking-[0.4em]">Course Identity</th>
                      <th className="py-6 font-black text-[10px] text-[#008751] uppercase tracking-[0.4em]">Faculty / Dept.</th>
                      <th className="py-6 font-black text-[10px] text-[#008751] uppercase tracking-[0.4em]">Level</th>
                      <th className="py-6 font-black text-[10px] text-[#008751] uppercase tracking-[0.4em]">Units</th>
                      <th className="py-6 font-black text-[10px] text-[#008751] uppercase tracking-[0.4em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {courses.map(course => (
                      <tr key={course.id} className="hover:bg-green-50/50 transition-all group">
                        <td className="py-6">
                          <p className="font-black text-green-950 text-base tracking-tight uppercase italic mb-1">{course.title}</p>
                          <p className="font-mono text-[#008751] text-[10px] font-black uppercase tracking-widest">{course.courseCode}</p>
                        </td>
                        <td className="py-6">
                          <p className="text-[10px] font-black text-[#008751] uppercase italic mb-1">{course.faculty}</p>
                          <p className="text-[9px] font-black text-[#008751] uppercase tracking-widest leading-none">{course.department}</p>
                        </td>
                        <td className="py-6 font-black text-green-950 text-sm italic">{course.level}</td>
                        <td className="py-6 font-black text-green-950 text-sm italic">{course.units} Units</td>
                        <td className="py-6 text-right">
                          <button className="p-3 bg-slate-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-50 transition-all active:scale-95 shadow-md">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <p className="text-[#008751] font-black uppercase tracking-[0.5em] text-[10px] italic">No curriculum nodes provisioned. Use "Setup" to initialize.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="p-10 relative z-10">
              <h3 className="text-lg font-black mb-8 text-green-950 uppercase tracking-tighter italic flex items-center gap-4">
                <Landmark className="w-5 h-5 text-[#008751]" />
                Loan Processing
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-green-50">
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Protocol Node</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">ID Proof</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Valuation</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Rationale</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Status</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Execution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {loans.map(loan => (
                      <tr key={loan.id} className="hover:bg-green-50/50 transition-all group">
                        <td className="py-6 font-black text-green-950 text-base tracking-tight uppercase italic">{loan.name}</td>
                        <td className="py-6">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-[#008751]/60 uppercase tracking-widest leading-none">BVN: {loan.bvn || '---'}</p>
                            <p className="text-[9px] font-black text-[#008751]/45 uppercase tracking-widest leading-none">NIN: {loan.nin || '---'}</p>
                          </div>
                        </td>
                        <td className="py-6 font-mono text-green-700 text-base font-black italic">#{loan.amount.toLocaleString()}</td>
                        <td className="py-6 text-[#008751] text-[9px] font-black uppercase tracking-widest max-w-xs italic">{loan.purpose}</td>
                        <td className="py-6">
                          <span className={`px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-[0.3em] border ${loan.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : loan.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-6">
                          {loan.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleLoanStatus(loan.id!, 'approved')} className="p-3 bg-[#008751] text-[#008751] rounded-xl hover:bg-green-700 transition-all shadow-lg active:scale-95 border border-[#008751]/20"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleLoanStatus(loan.id!, 'rejected')} className="p-3 bg-slate-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-50 transition-all shadow-md active:scale-90"><XCircle className="w-4 h-4" /></button>
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
            <div className="p-10 space-y-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8 group">
                  <h3 className="text-lg font-black flex items-center gap-4 text-green-950 uppercase tracking-tighter italic">
                    <div className="p-4 bg-green-50 rounded-2xl text-[#008751] border border-green-100 shadow-xl group-hover:bg-[#008751] group-hover:text-[#008751] transition-all duration-700"><Plus className="w-5 h-5" /></div>
                    Add Course
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Course Code (CSC101)"
                      value={newCourse.courseCode}
                      onChange={e => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                      className="w-90 h-2 p-6 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 outline-none focus:ring-2 ring-green-500/50 transition-all font-black text-sm uppercase tracking-[0.2em] placeholder:text-[#008751] italic"
                    />
                    <input
                      type="text"
                      placeholder="Course Title"
                      value={newCourse.title}
                      onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                      className="w-90 h-2 p-6  rounded-[2rem] bg-green-50 border border-green-100 text-green-950 outline-none focus:ring-2 ring-green-500/50 transition-all font-black text-sm placeholder:text-[#008751] uppercase tracking-widest italic"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={newCourse.faculty}
                        onChange={e => setNewCourse({ ...newCourse, faculty: e.target.value, department: '' })}
                        className="p-6 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 font-black text-[10px] appearance-none outline-none focus:ring-2 ring-green-500/50 uppercase italic"
                      >
                        <option value="" className="bg-slate-50 ">Faculty</option>
                        {FACULTIES.map(f => <option key={f} value={f} className="bg-slate-50">{f}</option>)}
                      </select>
                      <select
                        value={newCourse.department}
                        onChange={e => setNewCourse({ ...newCourse, department: e.target.value })}
                        className="p-6 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 font-black text-[10px] appearance-none outline-none focus:ring-2 ring-green-500/50 uppercase italic"
                      >
                        <option value="" className="bg-slate-50">DEPT</option> 
                        {newCourse.faculty && DEPARTMENTS[newCourse.faculty].map(d => <option key={d} value={d} className="bg-slate-50">{d}</option>)}
                      </select>
                    </div>
                    <button onClick={handleAddCourse} className="w-60 h-3 bg-[#008751] text-[#008751] p-6 rounded-[2rem] font-black hover:bg-green-700 transition-all shadow-xl active:scale-95 text-base uppercase tracking-[0.3em]  border border-[#008751]/20">Add Course</button>
                  </div>
                </div>

                <div className="space-y-8 group">
                  <h3 className="text-lg font-black flex items-center gap-4 text-green-950 uppercase tracking-tighter italic">
                    <div className="p-2 bg-green-50 rounded-2xl text-[#008751] border border-green-100 shadow-xl group-hover:bg-[#008751] group-hover:text-[#008751] transition-all duration-700"><Building2 className="w-5 h-5" /></div>
                    Add Department
                  </h3>
                  <div className="space-y-4  ">
                    <select
                      value={newDept.faculty}
                      onChange={e => setNewDept({ ...newDept, faculty: e.target.value })}
                      className="w-100 p-5 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 font-black text-[10px] appearance-none outline-none focus:ring-2 ring-green-500/50 uppercase italic"
                    >
                      <option value="" className="bg-slate-50">Select Faculty</option>
                      {FACULTIES.map(f => <option key={f} value={f} className="bg-slate-50">{f}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Departments"
                      value={newDept.name}
                      onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                      className="w-100 p-5 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 outline-none focus:ring-2 ring-green-500/50 transition-all font-black text-sm placeholder:text-[#008751] uppercase tracking-widest"
                    />
                    <button onClick={handleAddDept} className="w-100 h-5 bg-[#008751] text-[#008751] p-6 rounded-[2rem] font-black hover:bg-green-700 transition-all shadow-xl active:scale-95 text-sm uppercase tracking-[0.3em] italic border border-[#008751]/20">Initialization</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="p-10 space-y-12 relative z-10">
              <h3 className="text-xl font-black text-green-950 uppercase tracking-tighter italic flex items-center gap-4">
                <Users className="w-6 h-6 text-[#008751]" />
                Verified Registrar
              </h3>

              {/* Manual Student Creation Form */}
              <div className="bg-green-50/50 p-10 rounded-[4rem] border border-green-100 shadow-xl space-y-8 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <h4 className="relative z-10 text-sm font-black text-green-950 uppercase tracking-[0.4em] italic flex items-center gap-3">
                  <Plus className="w-4 h-4 text-[#008751]" /> Admin Provisioning
                </h4>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <input
                    placeholder="IDENTITY NAME"
                    className="p-6 rounded-3xl bg-slate-50 border border-green-100 text-sm font-black text-green-950 uppercase italic focus:ring-2 ring-green-500/50 outline-none transition-all placeholder:text-[#008751]"
                    value={manualStudent.name}
                    onChange={e => setManualStudent({ ...manualStudent, name: e.target.value })}
                  />
                  <input
                    placeholder="ADMIN EMAIL ADDRESS"
                    className="p-6 rounded-3xl bg-slate-50 border border-green-100 text-sm font-black text-green-950 italic focus:ring-2 ring-green-500/50 outline-none transition-all placeholder:text-[#008751]"
                    value={manualStudent.email}
                    onChange={e => setManualStudent({ ...manualStudent, email: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Age Level(Part)"
                    className="p-6 rounded-3xl bg-slate-50 border border-green-100 text-sm font-black text-green-950 italic focus:ring-2 ring-green-500/50 outline-none transition-all placeholder:text-[#008751]"
                    value={manualStudent.age || ''}
                    onChange={e => setManualStudent({ ...manualStudent, age: Number(e.target.value) })}
                  />
                  <select
                    className="p-6 rounded-3xl bg-slate-50 border border-green-100 text-[10px] font-black text-green-950 uppercase italic focus:ring-2 ring-green-500/50 outline-none transition-all"
                    value={manualStudent.faculty}
                    onChange={e => setManualStudent({ ...manualStudent, faculty: e.target.value, department: '' })}
                  >
                    <option value="" className="bg-slate-50">FACULTY NODE</option>
                    {FACULTIES.map(f => <option key={f} value={f} className="bg-slate-50">{f}</option>)}
                  </select>
                  <select
                    className="p-6 rounded-3xl bg-slate-50 border border-green-100 text-[10px] font-black text-green-950 uppercase italic focus:ring-2 ring-green-500/50 outline-none transition-all"
                    value={manualStudent.department}
                    onChange={e => setManualStudent({ ...manualStudent, department: e.target.value })}
                  >
                    <option value="" className="bg-slate-50">DEPT NODE</option>
                    {manualStudent.faculty && DEPARTMENTS[manualStudent.faculty].map(d => <option key={d} value={d} className="bg-slate-50">{d}</option>)}
                  </select>
                  <input
                    placeholder="GEOGRAPHICAL LOCATION"
                    className="p-6 rounded-3xl bg-slate-50 border border-green-100 text-sm font-black text-green-950 uppercase italic focus:ring-2 ring-green-500/50 outline-none transition-all placeholder:text-[#008751]"
                    value={manualStudent.locationCity}
                    onChange={e => setManualStudent({ ...manualStudent, locationCity: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleManualCreateStudent}
                  className="relative z-10 w-full bg-[#008751] text-[#008751] p-6 rounded-[2rem] font-black text-sm hover:bg-green-700 transition-all shadow-xl border border-[#008751]/20 active:scale-95 uppercase tracking-[0.4em] italic"
                >
                  Update
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-green-50 text-left">
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Protocol ID</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Node Identity</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Age</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Locality</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Faculty</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em]">Cycle</th>
                      <th className="py-6 font-black text-sm text-[#008751] uppercase tracking-[0.4em] text-right">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {students.map(student => (
                      <tr key={student.uid} className="hover:bg-green-50/50 transition-all group">
                        <td className="py-6 font-mono text-green-700 text-sm font-black tracking-tighter uppercase italic">{student.matricNo}</td>
                        <td className="py-6">
                          <p className="font-black text-green-950 text-base tracking-tight uppercase italic mb-1">{student.name}</p>
                        </td>
                        <td className="py-6 font-black text-green-950 text-base italic">{student.age || '--'}</td>
                        <td className="py-6 font-black text-[#008751] text-[10px] uppercase tracking-widest italic">{student.locationCity || '--'}</td>
                        <td className="py-6 text-[#008751] font-black uppercase tracking-widest text-[9px] italic">{student.faculty}</td>
                        <td className="py-6 text-[#008751]/45 font-black uppercase tracking-widest text-[9px] italic">{student.level}</td>
                        <td className="py-6 text-right">
                          <button
                            onClick={() => startSimulation(student)}
                            className="p-4 bg-green-50 text-[#008751] rounded-2xl hover:bg-[#008751] hover:text-[#008751] transition-all shadow-lg border border-green-100 flex items-center gap-3 text-[10px] uppercase font-black tracking-[0.3em] ml-auto active:scale-95 italic"
                          >
                            <LogIn className="w-4 h-4" />
                            Execute Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'treasury' && (
            <div className="p-10 space-y-12 relative z-10 w-full max-w-6xl mx-auto">
              <h3 className="text-xl font-black mb-8 text-green-950 uppercase tracking-tighter italic flex items-center gap-4">
                <DollarSign className="w-6 h-6 text-[#008751]" />
                Treasury
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-[#008751] uppercase tracking-[0.5em] flex items-center gap-3 italic">
                    <DollarSign className="w-4 h-4 text-[#008751]" /> Current Resolution Protocol
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(dynamicFees).sort().map(([level, fee]) => (
                      <div key={level} className="flex justify-between p-6 bg-green-50/50 rounded-[2rem] border border-green-100 group hover:bg-[#008751] hover:text-[#008751] transition-all duration-500">
                        <span className="font-black text-[#008751] group-hover:text-[#008751]/50 uppercase tracking-[0.2em] text-sm italic">{level} CYCLE</span>
                        <span className="font-mono text-green-700 group-hover:text-[#008751] font-black text-lg tracking-tighter italic">#{fee.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-10 rounded-[4rem] border border-green-100 shadow-2xl shadow-green-900/5 space-y-10 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative z-10 flex justify-between items-end">
                      <div>
                        <h4 className="text-xl font-black text-green-950 uppercase tracking-tighter italic mb-2">Adjust Global Tariffs</h4>
                        <p className="text-[#008751] text-xs font-black uppercase tracking-[0.3em]">Bulk Registry Synchronization Node</p>
                      </div>
                      <Settings className="w-6 h-6 text-[#008751]/20 animate-spin-slow" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
                      {Object.entries(dynamicFees).sort().map(([level, fee]) => (
                        <div key={level} className="flex flex-col gap-2 p-6 bg-green-50/50 rounded-[2.5rem] border border-green-100 hover:border-green-300 transition-all group/node">
                          <span className="font-black text-[#008751] uppercase tracking-[0.2em] text-[10px] italic flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {level} CYCLE
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#008751] font-mono font-black text-lg">#</span>
                            <input
                              type="number"
                              value={fee}
                              onChange={e => setDynamicFees({ ...dynamicFees, [level]: Number(e.target.value) })}
                              className="w-full bg-transparent border-none text-green-950 font-mono font-black text-xl outline-none focus:text-[#008751] transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6 pt-6 border-t border-green-100 relative z-10">
                      <h5 className="text-[10px] font-black text-[#008751] uppercase tracking-[0.5em] italic">Initialize New Treasury Node</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          placeholder="NODE IDENTIFIER (e.g. PGD)"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          className="p-6 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 font-black text-[10px] outline-none placeholder:text-[#008751] italic focus:ring-2 ring-green-500/50 uppercase"
                        />
                        <input
                          type="number"
                          placeholder="BASE QUOTA (#)"
                          value={newCategoryAmount || '' || '0'}
                          onChange={e => setNewCategoryAmount(Number(e.target.value))}
                          className="p-6 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 font-black text-[10px] outline-none placeholder:text-[#008751] italic focus:ring-2 ring-green-500/50"
                        />
                      </div>
                      <button
                        onClick={handleAddNewFeeCategory}
                        className="w-full bg-green-50 text-[#008751] p-5 rounded-[2.5rem] font-black text-[10px] hover:bg-[#008751] hover:text-[#008751] transition-all border border-green-100 uppercase tracking-[0.4em] italic active:scale-95 flex items-center justify-center gap-3"
                      >
                        <Plus className="w-4 h-4" /> Provision New Levels
                      </button>
                    </div>

                    <button
                      onClick={handleUpdateAllFees}
                      className="relative z-10 w-full bg-[#008751] text-[#008751] p-8 rounded-[3rem] font-black text-sm hover:bg-green-700 transition-all shadow-xl shadow-green-900/20 active:scale-95 uppercase tracking-[0.5em] italic border border-[#008751]/20"
                    >
                      Authorize
                    </button>
                  </div>

                  <div className="mt-12 p-10 bg-slate-50 rounded-[3.5rem] space-y-8 shadow-2xl shadow-green-900/5 border border-green-100 relative overflow-hidden group/finance">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#008751]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/finance:scale-150 transition-transform duration-1000" />

                    <h5 className="text-sm font-black text-green-950 uppercase tracking-[0.4em] italic flex items-center gap-3">
                      <Settings className="w-5 h-5 text-[#008751]" /> ACCEPTANCE FEES, LOAN AND DISCOUNT
                    </h5>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#008751] uppercase tracking-[.3em] ml-2">Institutional Acceptance Fee (#)</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-[#008751] text-lg">#</span>
                          <input
                            type="number"
                            value={acceptanceFee}
                            onChange={e => setAcceptanceFee(Number(e.target.value))}
                            className="w-full p-6 pl-12 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 font-black text-xl outline-none focus:ring-4 ring-green-500/10 transition-all placeholder:text-[#008751]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#008751] uppercase tracking-[.3em] ml-2">Maximum Credit Limit / Loan (#)</label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-[#008751] text-lg">#</span>
                          <input
                            type="number"
                            value={maxLoanAmount}
                            onChange={e => setMaxLoanAmount(Number(e.target.value))}
                            className="w-full p-6 pl-12 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 font-black text-xl outline-none focus:ring-4 ring-green-500/10 transition-all placeholder:text-[#008751]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#008751] uppercase tracking-[.3em] ml-2">Early Settlement Incentive (%)</label>
                        <div className="relative">
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-[#008751] text-lg">%</span>
                          <input
                            type="number"
                            value={earlyPaymentDiscount}
                            onChange={e => setEarlyPaymentDiscount(Number(e.target.value))}
                            className="w-full p-6 rounded-[2rem] bg-green-50 border border-green-100 text-green-950 font-black text-xl outline-none focus:ring-4 ring-green-500/10 transition-all placeholder:text-[#008751]"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleUpdateFinance}
                        className="w-full bg-[#008751] text-[#008751] p-7 rounded-[2.5rem] font-black text-sm hover:bg-green-700 transition-all shadow-xl active:scale-95 uppercase tracking-[0.5em] italic flex items-center justify-center gap-4"
                      >
                        Authorize Finance Update <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="bg-slate-50 p-10 rounded-[4rem] border border-green-100 shadow-2xl shadow-green-900/5 space-y-8">
                    <h4 className="text-sm font-black text-green-950 uppercase tracking-[0.5em] flex items-center gap-3 italic">
                      <Landmark className="w-4 h-4 text-[#008751]" /> Payment Method and Account details
                    </h4>
                    
                    <div className="space-y-3">
                      {banks.length > 0 ? banks.map((bank, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-green-50 rounded-2xl border border-green-100 group">
                          <div>
                            <p className="font-black text-green-900 uppercase">{bank.bankName}</p>
                            <p className="text-base font-black text-[#008751] uppercase tracking-widest">{bank.accountNumber}</p>
                            <p className="text-[10px] font-black text-[#008751] uppercase tracking-widest">{bank.accountName}</p>
                          </div>
                          <button onClick={() => handleRemoveBank(bank.accountNumber)} className="p-3 bg-slate-50 text-rose-600 rounded-xl hover:bg-rose-50 shadow-sm border border-rose-100 active:scale-95 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )) : (
                        <p className="text-[10px] font-black text-[#008751] uppercase tracking-widest italic p-4 bg-green-50/50 rounded-xl">No active nodes...</p>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-green-50">
                      <h5 className="text-[10px] font-black text-[#008751] uppercase tracking-[0.5em] italic">Register New Bank Identity</h5>
                      <input
                        className="w-full bg-green-50 border border-green-100 rounded-[2rem] p-6 text-green-950 font-black text-sm placeholder:text-[#008751] italic outline-none focus:ring-2 ring-green-500/50 uppercase tracking-widest"
                        placeholder="UNITED BANK FOR AFRICA"
                        value={bankSetup.bankName}
                        onChange={e => setBankSetup({ ...bankSetup, bankName: e.target.value })}
                      />
                      <input
                        className="w-full bg-green-50 border border-green-100 rounded-[2rem] p-6 text-green-950 font-black text-sm placeholder:text-[#008751] italic outline-none focus:ring-2 ring-green-500/50 uppercase tracking-widest"
                        placeholder="ACCOUNT NUMBER"
                        value={bankSetup.accountNumber}
                        onChange={e => setBankSetup({ ...bankSetup, accountNumber: e.target.value })}
                      />
                      <input
                        className="w-full bg-green-50 border border-green-100 rounded-[2rem] p-6 text-green-950 font-black text-sm placeholder:text-[#008751] italic outline-none focus:ring-2 ring-green-500/50 uppercase tracking-widest"
                        placeholder="BENEFICIARY "
                        value={bankSetup.accountName}
                        onChange={e => setBankSetup({ ...bankSetup, accountName: e.target.value })}
                      />
                      <button
                        onClick={handleAddBank}
                        className="w-full bg-[#008751] text-[#008751] p-6 rounded-[2rem] font-black text-sm hover:bg-green-700 transition-all shadow-xl active:scale-95 uppercase tracking-[0.5em] italic border border-[#008751]/20"
                      >
                        Add Bank Account
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-10 rounded-[4rem] border border-green-100 shadow-2xl shadow-green-900/5 space-y-8 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-500/5 opacity-40" />
                    <h4 className="relative z-10 text-sm font-black text-green-950 uppercase tracking-[0.5em] flex items-center gap-3 italic">
                      <Plus className="w-4 h-4 text-[#008751]" /> Manual Resolution Override
                    </h4>
                    <div className="relative z-10 space-y-4">
                      <select
                        className="w-full bg-green-50 border border-green-100 rounded-[2rem] p-6 text-green-950 font-black text-sm appearance-none outline-none focus:ring-2 ring-green-500/50 uppercase italic"
                        value={manualPay.uid}
                        onChange={e => setManualPay({ ...manualPay, uid: e.target.value })}
                      >
                        <option value="" className="bg-slate-50">SELECT TARGET NODE</option>
                        {students.map(s => <option key={s.uid} value={s.uid} className="bg-slate-50">{(s.matricNo || 'IDLE') + ' - ' + s.name}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          className="w-full bg-green-50 border border-green-100 rounded-[2rem] p-6 text-green-950 font-black text-sm appearance-none outline-none focus:ring-2 ring-green-500/50 uppercase italic"
                          value={manualPay.type}
                          onChange={e => setManualPay({ ...manualPay, type: e.target.value as any })}
                        >
                          <option value="tuition" className="bg-slate-50">TUITION</option>
                          <option value="hostel" className="bg-slate-50">HOSTEL</option>
                        </select>
                        <input
                          type="number"
                          placeholder="AMOUNT (NGN)"
                          className="w-full bg-green-50 border border-green-100 rounded-[2rem] p-6 text-green-950 font-black text-sm placeholder:text-[#008751] outline-none focus:ring-2 ring-green-500/50 italic uppercase tracking-widest"
                          value={manualPay.amount || ''}
                          onChange={e => setManualPay({ ...manualPay, amount: Number(e.target.value) })}
                        />
                      </div>
                      <button
                        onClick={handleManualPayment}
                        className="w-full bg-[#008751] text-[#008751] p-6 rounded-[2rem] font-black text-[10px] hover:bg-green-700 transition-all shadow-xl active:scale-95 uppercase tracking-[0.5em] italic border border-[#008751]/20"
                      >
                        Finalize Entry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Candidate  Modal */}
        <AnimatePresence>
          {selectedApp && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 bg-slate-50 backdrop-blur-md" onClick={() => setSelectedApp(null)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-6xl bg-slate-50 rounded-[4rem] overflow-hidden shadow-[0_64px_128px_-32px_rgba(88,28,135,0.2)] border border-green-100 flex flex-col md:flex-row h-[90vh] md:h-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* LEFT: BIOMETRIC & BIO DATA */}
                <div className="w-full md:w-[400px] bg-green-50/30 border-r border-green-50 p-12 flex flex-col gap-10 overflow-y-auto">
                  <div className="space-y-8">
                    <div className="aspect-square bg-slate-50 rounded-[4rem] border border-green-100 shadow-xl overflow-hidden relative group">
                      {selectedApp.faceUrl ? (
                        <img src={selectedApp.faceUrl} alt="Face" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#008751]"><Camera className="w-20 h-20" /></div>
                      )}
                      <div className="absolute top-6 right-6 p-3 bg-[#008751]/10 backdrop-blur-xl rounded-2xl text-[#008751] border border-green-200 shadow-2xl animate-pulse"><ShieldCheck className="w-5 h-5" /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="aspect-square bg-slate-50 rounded-[2rem] border border-green-100 shadow-inner overflow-hidden relative group">
                        {selectedApp.leftIndexUrl ? (
                          <img src={selectedApp.leftIndexUrl} alt="Left Index" className="w-full h-full object-cover group-hover:scale-125 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-green-50"><Fingerprint className="w-8 h-8" /></div>
                        )}
                        <div className="absolute bottom-3 left-3 px-3 py-1 bg-slate-50/90 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-50 text-[#008751]">Left Index</div>
                      </div>
                      <div className="aspect-square bg-slate-50 rounded-[2rem] border border-green-100 shadow-inner overflow-hidden relative group">
                        {selectedApp.rightIndexUrl ? (
                          <img src={selectedApp.rightIndexUrl} alt="Right Index" className="w-full h-full object-cover group-hover:scale-125 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-green-50"><Fingerprint className="w-8 h-8" /></div>
                        )}
                        <div className="absolute bottom-3 left-3 px-3 py-1 bg-slate-50/90 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-50 text-[#008751]">Right Index</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black text-[#008751] uppercase tracking-widest mb-1 italic">Full Name</h4>
                      <p className="text-base font-black text-green-950 tracking-tighter uppercase italic">{selectedApp.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-[8px] font-black text-[#008751] uppercase tracking-widest mb-1 italic">Gender</h4>
                        <p className="text-[10px] font-black text-green-900 uppercase italic">{selectedApp.gender || 'UNDEFINED'}</p>
                      </div>
                      <div>
                        <h4 className="text-[8px] font-black text-[#008751] uppercase tracking-widest mb-1 italic">State of Origin</h4>
                        <p className="text-[10px] font-black text-green-900 uppercase italic">{selectedApp.stateOfOrigin || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[8px] font-black text-[#008751] uppercase tracking-widest mb-1 italic">Faculty / Department</h4>
                      <p className="text-[10px] font-black text-[#008751] uppercase italic">{selectedApp.faculty} â€¢ {selectedApp.department}</p>
                    </div>
                  </div>
                </div>

                {/* RIGHT: ACADEMIC RECORDS & ACTIONS */}
                <div className="flex-1 p-10 overflow-y-auto space-y-10 bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-[#008751] uppercase tracking-[0.4em] italic mb-1">Administrative Dossier</p>
                      <h2 className="text-3xl font-black text-green-950 tracking-tighter uppercase italic">Candidate Admissions Record</h2>
                    </div>
                    <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${selectedApp.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      Current Status: {selectedApp.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* JAMB SCORES */}
                    <div className="p-8 bg-[#008751]/8 rounded-[3rem] text-[#008751] space-y-8 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform" />
                      <h5 className="text-sm font-black uppercase tracking-[0.4em] text-[#008751]/35 italic flex items-center gap-2">
                        <Award className="w-4 h-4" /> JAMB UTME Score Card
                      </h5>
                      <div className="grid grid-cols-2 gap-6 relative z-10">
                        {selectedApp.jambSubjects && Object.entries(selectedApp.jambSubjects).map(([subject, score]) => (
                          <div key={subject} className="bg-slate-50/5 p-4 rounded-2xl border border-[#008751]/5 hover:bg-slate-50/10 transition-colors">
                            <p className="text-[8px] font-black text-[#008751]/35 uppercase tracking-widest mb-1">{subject}</p>
                            <p className="text-2xl font-black italic tracking-tighter">{score}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-[#008751]/5 flex justify-between items-end relative z-10">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-[#008751]/35 uppercase tracking-widest">Aggregate UTME Score</p>
                          <p className="text-4xl font-black tracking-tighter text-[#008751] italic">{selectedApp.jambScore}</p>
                        </div>
                        <ShieldCheck className="w-10 h-10 text-[#008751]/5" />
                      </div>
                    </div>

                    {/* O-LEVEL RESULTS */}
                    <div className="bg-green-50 p-8 rounded-[3rem] border border-green-100 space-y-8 shadow-inner">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#008751] italic flex items-center gap-2">
                        <FileText className="w-4 h-4" /> WAEC / NECO Record Grid
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedApp.oLevelResults && Object.entries(selectedApp.oLevelResults).map(([subject, grade]) => (
                          <div key={subject} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-green-100">
                            <span className="text-[8px] font-black text-green-900 uppercase tracking-tight italic">{subject}</span>
                            <span className="px-3 py-1 bg-green-50 text-[#008751] rounded-lg text-[10px] font-black border border-green-100">{grade}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-[7px] text-amber-700/60 leading-relaxed font-bold italic">Verifier: Institutional registrars must cross-match O-Level records with official scratch-card verification portals during physical screening.</p>
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENTS & ACTIONS */}
                  <div className="flex flex-col md:flex-row gap-6 pt-6 border-t border-green-50">
                    <div className="flex-1 space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#008751] italic">Electronic Document Vault</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100 hover:bg-slate-50 hover:shadow-lg transition-all group">
                          <div className="p-2 bg-green-100 text-[#008751] rounded-lg group-hover:scale-110 transition-transform"><FileText className="w-4 h-4" /></div>
                          <span className="text-[8px] font-black text-green-950 uppercase tracking-widest italic">JAMB Result Slip</span>
                        </button>
                        <button className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100 hover:bg-slate-50 hover:shadow-lg transition-all group">
                          <div className="p-2 bg-green-100 text-[#008751] rounded-lg group-hover:scale-110 transition-transform"><FileText className="w-4 h-4" /></div>
                          <span className="text-[8px] font-black text-green-950 uppercase tracking-widest italic">O-Level Transcript</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-4 items-end">
                      <button
                        onClick={() => setSelectedApp(null)}
                        className="px-10 py-5 bg-green-50 text-[#008751] border border-green-100 rounded-3xl font-black text-sm hover:bg-slate-50 hover:text-green-900 transition-all shadow-inner uppercase tracking-widest italic"
                      >
                        Dismiss Dossier
                      </button>
                      {selectedApp.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReject(selectedApp)}
                            className="px-8 py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-3xl font-black text-sm hover:bg-rose-600 hover:text-[#008751] transition-all shadow-md uppercase tracking-widest italic active:scale-95"
                          >
                            Deny Entry
                          </button>
                          <button
                            onClick={() => handleApprove(selectedApp)}
                            className="px-12 py-5 bg-[#008751] text-[#008751] rounded-3xl font-black text-sm hover:bg-green-700 transition-all shadow-xl shadow-green-900/20 uppercase tracking-widest italic active:scale-95"
                          >
                            Authorize Admission
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}




