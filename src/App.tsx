/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, sendEmailVerification } from './firebase';
import { UserProfile } from './types';
import Layout from './components/Layout';
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import StudentPortal from './components/StudentPortal';
import AdmissionForm from './components/AdmissionForm';
import CourseRegistration from './components/CourseRegistration';
import PaymentPortal from './components/PaymentPortal';
import HostelAllocation from './components/HostelAllocation';
import Results from './components/Results';
import LoanApplicationForm from './components/LoanApplicationForm';
import Auth from './components/Auth';
import { Toaster, toast } from 'sonner';
import { Mail, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setEmailVerified(firebaseUser.emailVerified);
        
        // Listen to user profile changes
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            // Fallback if doc doesn't exist yet
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'applicant',
              name: firebaseUser.displayName || 'User',
              university: 'GENERAL',
              photoUrl: firebaseUser.photoURL || '',
            };
            setUser(newUser);
          }
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500 font-bold animate-pulse">Initializing UniPortal...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" richColors />
      {!emailVerified && auth.currentUser && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-center justify-center gap-3 text-amber-800 text-sm font-medium sticky top-0 z-[100]">
          <Mail className="w-4 h-4" />
          <span>Please verify your email address to access all features.</span>
          <button 
            onClick={() => sendEmailVerification(auth.currentUser!).then(() => toast.success('Verification email sent!'))}
            className="underline font-bold hover:text-amber-900"
          >
            Resend Email
          </button>
        </div>
      )}
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admission" element={user ? <AdmissionForm user={user} /> : <Navigate to="/auth" />} />
          <Route path="/portal" element={user?.role === 'student' ? <StudentPortal user={user} /> : <Navigate to="/auth" />} />
          <Route path="/courses" element={user?.role === 'student' ? <CourseRegistration user={user} /> : <Navigate to="/auth" />} />
          <Route path="/payments" element={user ? <PaymentPortal user={user} /> : <Navigate to="/auth" />} />
          <Route path="/hostels" element={user?.role === 'student' ? <HostelAllocation user={user} /> : <Navigate to="/auth" />} />
          <Route path="/results" element={user?.role === 'student' ? <Results user={user} /> : <Navigate to="/auth" />} />
          <Route path="/loan" element={user ? <LoanApplicationForm user={user} /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
