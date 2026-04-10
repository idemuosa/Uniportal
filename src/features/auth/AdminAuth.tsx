import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Lock, Mail, ShieldCheck, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminAuth() {
  const [name, setName] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [signUpMode, setSignUpMode] = useState(false);
  const navigate = useNavigate();

  const ADMIN_SECRET = 'LUKKE-ADMIN-26';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (resetMode) {
        toast.info('Administrative Recovery Protocol Dispatched (Simulation)');
        setResetMode(false);
      } else if (signUpMode) {
        if (secretCode.toUpperCase().trim() !== ADMIN_SECRET) {
          toast.error('Invalid Administrative Secret Key');
          setLoading(false);
          return;
        }
        
        const names = name.split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        await api.post('/accounts/register/', {
          username: email, // Use full email for uniqueness
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role: 'admin'
        });

        toast.success('Administrative Node Initialized Successfully. Please Log In.');
        setSignUpMode(false);
      } else {
        const response = await api.post('/token/', {
          username: username || email,
          password,
        });

        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);

        // Verify role
        const userResponse = await api.get('/accounts/user/');
        if (userResponse.data.role === 'admin') {
          toast.success('Administrative Access Granted');
          window.location.href = '/admin';
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          toast.error('Access Denied: Administrative Role Required');
        }
      }
    } catch (error: any) {
      console.error('Admin Auth error:', error);
      const errorMsg = error.response?.data?.detail || 'Process Interrupted: Unauthorized Attempt';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-6 relative overflow-hidden font-sans selection:bg-green-500 selection:text-[ #22c55e]">
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#008751]/5 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* LOGO & HEADER */}
        <div className="text-center space-y-6">
          <div className="inline-flex p-5 bg-slate-50 border border-[#22c55e]/15">
            <ShieldCheck className="w-12 h-12 text-[#22c55e]" />
          </div>
          <div>
            <h6 className="text-3xl font-black text-[#22c55e] tracking-tighter">{signUpMode ? 'Registry Node' : 'Admin Login'}</h6>
            <p className="text-sm font-black text-[#22c55e] uppercase tracking-[0.3em] mt-2">{signUpMode ? 'Authorized Admin' : 'Authenticate'}</p>
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="bg-white border border-[#22c55e]/8 p-10 shadow-[0_0_40px_rgba(22,163,74,0.1)]">
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-4">
              {signUpMode && (
                <>
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22c55e]/30 group-focus-within:text-[#008751] transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="Enter Your Name"
                      className="w-full bg-slate-50 border border-[#22c55e]/10 p-2 pl-10 text-sm font-black text-[#22c55e] placeholder:text-[#22c55e]/30 focus:ring-2 ring-green-500 focus:border-[#008751] outline-none transition-all tracking-widest"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />  
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22c55e]/30 group-focus-within:text-[#22c55e] transition-colors" />
                    <input
                      type="password"
                      required
                      placeholder="SECRET ACCESS KEY"
                      className="w-full bg-slate-50 border border-[#22c55e]/10 p-2 pl-14 text-sm font-black text-[#22c55e] placeholder:text-[#22c55e]/30 focus:ring-2 ring-green-500 focus:border-[#008751] outline-none transition-all uppercase tracking-widest"
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22c55e]/30 group-focus-within:text-[#22c55e] transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  className="w-full h-10 bg-slate-50 border border-[#008751]/10 p-2 pl-14 text-sm font-black text-[#008751] placeholder:text-[#008751]/30 focus:ring-2 ring-green-500 focus:border-[#008751] outline-none transition-all tracking-widest"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {!resetMode && (
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#008751]/30 group-focus-within:text-[#008751] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    className="w-full bg-slate-50 border border-[#008751]/10 p-2 pl-14 h-10 text-sm font-black text-[#008751] placeholder:text-[#008751]/30 focus:ring-2 ring-green-500 focus:border-[#008751] outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-[#008751]/10 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-[#008751]/30" /> : <Eye className="w-4 h-4 text-[#008751]/30" />}
                  </button>
                </div>
              )}
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#008751] border border-[#008751] text-white font-black text-sm uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:brightness-125 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {resetMode ? 'INITIALIZE RECOVERY' : signUpMode ? 'CREATE ADMIN' : 'AUTHORIZE'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#008751]/5 text-center">
            <button
              onClick={() => setSignUpMode(!signUpMode)}
              className="text-xs font-black text-[#008751]/30 uppercase tracking-[0.3em] hover:text-[#008751] transition-colors"
            >
              {signUpMode ? 'Return to Authorization' : 'Request Administrative Node Access'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


