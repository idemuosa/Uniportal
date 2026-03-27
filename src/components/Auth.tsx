import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  db
} from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Mail, Lock, User, LogIn, UserPlus, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UniversityName } from '../types';

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[^A-Za-z0-9]/.test(password)) strength += 25;
  return strength;
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState<UniversityName>('GENERAL');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const navigate = useNavigate();

  const universities: { id: UniversityName; name: string; color: string }[] = [
    { id: 'GENERAL', name: 'General Portal', color: 'bg-neutral-900' },
    { id: 'UNIBEN', name: 'University of Benin (UNIBEN)', color: 'bg-purple-800' },
    { id: 'UI', name: 'University of Ibadan (UI)', color: 'bg-blue-900' },
    { id: 'UNILAG', name: 'University of Lagos (UNILAG)', color: 'bg-rose-900' },
  ];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (resetMode) {
        await sendPasswordResetEmail(auth, email);
        toast.success('Password reset email sent!');
        setResetMode(false);
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logged in successfully!');
        navigate('/');
      } else {
        if (getPasswordStrength(password) < 75) {
          toast.error('Please use a stronger password');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        await sendEmailVerification(user);
        
        const newUser: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          role: 'applicant',
          name: name,
          university: university,
          photoUrl: '',
          ...(university === 'UNIBEN' && { kofaId: `KOF/${Math.floor(100000 + Math.random() * 900000)}` }),
          ...(university === 'UI' && { uiMatricNo: `UI/${Math.floor(100000 + Math.random() * 900000)}` }),
          ...(university === 'UNILAG' && { unilagId: `ULG/${Math.floor(100000 + Math.random() * 900000)}` }),
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        
        toast.success(`Account created for ${university}! Please verify your email.`);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const newUser: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          role: 'applicant',
          name: user.displayName || 'New User',
          university: 'GENERAL',
          photoUrl: user.photoURL || '',
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
      }
      
      toast.success('Logged in with Google!');
      navigate('/');
    } catch (error: any) {
      toast.error('Google login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-xl"
      >
        <div className="text-center mb-10">
          <div className={`w-16 h-16 ${universities.find(u => u.id === university)?.color || 'bg-neutral-900'} text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-colors duration-500`}>
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            {resetMode ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h2>
          <p className="text-neutral-500 mt-2">
            {resetMode ? 'Enter your email to receive a reset link' : (isLogin ? 'Login to access your university portal' : 'Join our academic community today')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && !resetMode && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Select University</label>
                <div className="grid grid-cols-2 gap-2">
                  {universities.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUniversity(u.id)}
                      className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all ${
                        university === u.id 
                          ? `${u.color} text-white border-transparent` 
                          : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {u.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                placeholder="email@university.edu"
              />
            </div>
          </div>

          {!resetMode && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    className="text-xs font-bold text-neutral-900 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && password && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span>Password Strength</span>
                    <span className={getPasswordStrength(password) >= 75 ? 'text-emerald-600' : 'text-amber-600'}>
                      {getPasswordStrength(password) >= 75 ? 'Strong' : 'Weak'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getPasswordStrength(password)}%` }}
                      className={`h-full transition-all ${
                        getPasswordStrength(password) < 50 ? 'bg-rose-500' : 
                        getPasswordStrength(password) < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-tight">
                    Must be 8+ chars, include uppercase, number, and special char.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {resetMode ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </>
            )}
          </button>
        </form>

        {!resetMode && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-neutral-400 font-bold tracking-widest">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-neutral-200 text-neutral-900 py-4 rounded-xl font-bold hover:bg-neutral-50 transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Google Authentication
            </button>
          </>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (resetMode) setResetMode(false);
              else setIsLogin(!isLogin);
            }}
            className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            {resetMode ? 'Back to Login' : (isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
