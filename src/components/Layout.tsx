import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signOut } from '../firebase';
import { UserProfile } from '../types';
import { GraduationCap, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  user: UserProfile | null;
}

export default function Layout({ children, user }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter leading-none">UNIPORTAL</span>
                <span className="text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase">University Systems</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Home</Link>
              {user && (
                <>
                  <Link to="/admission" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Admission</Link>
                  {user.role === 'student' && (
                    <>
                      <Link to="/portal" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Portal</Link>
                      <Link to="/courses" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Courses</Link>
                      <Link to="/results" className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors">Results</Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors">
                      <ShieldCheck className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4 bg-neutral-100 pl-4 pr-2 py-1.5 rounded-full border border-neutral-200">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black tracking-tight leading-none">{user.name.toUpperCase()}</span>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{user.role}</span>
                  </div>
                  <div className="w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-md">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-white transition-colors text-neutral-400 hover:text-rose-600"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="bg-neutral-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-neutral-800 transition-all shadow-lg hover:shadow-neutral-200"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-neutral-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-neutral-300" />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter text-neutral-300">UNIPORTAL</span>
                <span className="text-[8px] font-bold text-neutral-300 tracking-[0.2em] uppercase">Advanced Management</span>
              </div>
            </div>
            <div className="flex gap-8 text-xs font-bold text-neutral-400 uppercase tracking-widest">
              <Link to="/" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-neutral-900 transition-colors">Terms of Service</Link>
              <Link to="/" className="hover:text-neutral-900 transition-colors">Contact Support</Link>
            </div>
            <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
              &copy; 2026 UniPortal Systems. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
