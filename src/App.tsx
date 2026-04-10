/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api/axios';
import { UserProfile } from './types';
import Layout from './layouts/Layout';
import Home from './pages/Home';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminAuth from './features/auth/AdminAuth';
import StudentPortal from './features/student/StudentPortal';
import AdmissionForm from './features/academics/AdmissionForm';
import CourseRegistration from './features/academics/CourseRegistration';
import PaymentPortal from './features/finances/PaymentPortal';
import HostelAllocation from './features/hostel/HostelAllocation';
import Results from './features/academics/Results';
import LoanApplicationForm from './features/finances/LoanApplicationForm';
import Auth from './features/auth/Auth';
import RemitaPayment from './features/finances/RemitaPayment';
import { Toaster, toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [simulatedUser, setSimulatedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('/accounts/user/');
          // Mapping Django user to the existing UserProfile type
          const djangoUser = response.data;
          const userProfile: UserProfile = {
            uid: djangoUser.id.toString(),
            email: djangoUser.email,
            role: djangoUser.role,
            name: `${djangoUser.first_name} ${djangoUser.last_name}`.trim() || djangoUser.username,
            university: 'UniPortal', // default placeholder for now
            photoUrl: '',
            faculty: djangoUser.faculty,
            department: djangoUser.department,
          };
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#008751]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(22,163,74,0.4)]" />
          <p className="text-green-400 font-bold animate-pulse">Initializing UniPortal...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admission" element={user ? <AdmissionForm user={user} /> : <Navigate to="/auth" />} />
          <Route path="/portal" element={(simulatedUser || user)?.role === 'student' ? <StudentPortal user={(simulatedUser || user)!} /> : <Navigate to="/auth" />} />
          <Route path="/courses" element={(simulatedUser || user)?.role === 'student' ? <CourseRegistration user={(simulatedUser || user)!} /> : <Navigate to="/auth" />} />
          <Route path="/payments" element={(simulatedUser || user) ? <PaymentPortal user={(simulatedUser || user)!} /> : <Navigate to="/auth" />} />
          <Route path="/remita-payment" element={(simulatedUser || user) ? <RemitaPayment user={(simulatedUser || user)!} /> : <Navigate to="/auth" />} />
          <Route path="/hostels" element={(simulatedUser || user)?.role === 'student' ? <HostelAllocation user={(simulatedUser || user)!} /> : <Navigate to="/auth" />} />
          <Route path="/results" element={(simulatedUser || user)?.role === 'student' ? <Results user={(simulatedUser || user)!} /> : <Navigate to="/auth" />} />
          <Route path="/loan" element={(simulatedUser || user) ? <LoanApplicationForm user={(simulatedUser || user)!} /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} onSimulateLogin={setSimulatedUser} /> : <Navigate to="/admin/login" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

