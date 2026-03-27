import { UserProfile } from '../types';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, CreditCard, Building2, UserCheck, FileText, LayoutDashboard, Bed, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  user: UserProfile | null;
}

export default function Home({ user }: HomeProps) {
  const universities = [
    { id: 'UNIBEN', name: 'University of Benin', color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200', logo: 'https://picsum.photos/seed/uniben/200/200', motto: 'Knowledge for Service' },
    { id: 'UI', name: 'University of Ibadan', color: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-200', logo: 'https://picsum.photos/seed/ui/200/200', motto: 'Recte Sapere Fons' },
    { id: 'UNILAG', name: 'University of Lagos', color: 'text-rose-900', bg: 'bg-rose-50', border: 'border-rose-200', logo: 'https://picsum.photos/seed/unilag/200/200', motto: 'In Deed and In Truth' },
  ];

  const currentUni = user ? universities.find(u => u.id === user.university) : null;

  const cards = [
    { title: "Admission Portal", icon: UserCheck, link: "/admission", description: "Apply for admission and track your application status.", roles: ["applicant", "admin", "student"] },
    { title: "Student Portal", icon: LayoutDashboard, link: "/portal", description: "Access your student profile, courses, and results.", roles: ["student", "admin"] },
    { title: "Course Registration", icon: BookOpen, link: "/courses", description: "Register for your semester courses across all faculties.", roles: ["student", "admin"] },
    { title: "Payment Portal", icon: CreditCard, link: "/payments", description: "Pay school fees, hostel fees, and other charges.", roles: ["student", "applicant", "admin"] },
    { title: "Hostel Allocation", icon: Bed, link: "/hostels", description: "Apply for hostel accommodation and bed space.", roles: ["student", "admin"] },
    { title: "Academic Results", icon: FileText, link: "/results", description: "Check your semester results and calculate your CGPA.", roles: ["student", "admin"] },
    { title: "Admin Dashboard", icon: Building2, link: "/admin", description: "Manage students, staff, courses, and university data.", roles: ["admin"] },
    { title: "Transcript Request", icon: FileText, link: "/transcript", description: "Request official academic transcripts for alumni.", roles: ["student", "admin"] },
    { title: "Online Clearance", icon: ShieldCheck, link: "/clearance", description: "Final year student clearance and certificate tracking.", roles: ["student", "admin"] },
  ];

  const filteredCards = cards.filter(card => !user || card.roles.includes(user.role));

  return (
    <div className="space-y-12">
      {currentUni ? (
        <section className={`relative overflow-hidden py-20 ${currentUni.bg} rounded-3xl border ${currentUni.border} shadow-sm px-10`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 bg-white rounded-2xl p-4 shadow-xl border border-neutral-100">
              <img src={currentUni.logo} alt={currentUni.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="text-center md:text-left">
              <h1 className={`text-5xl font-black tracking-tighter ${currentUni.color} mb-2`}>
                {currentUni.name.toUpperCase()}
              </h1>
              <p className="text-lg font-bold text-neutral-500 italic mb-6">
                "{currentUni.motto}"
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${currentUni.color} bg-white border ${currentUni.border}`}>
                  Official Portal
                </span>
                <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-neutral-500 bg-white border border-neutral-200">
                  Session 2025/2026
                </span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
            <GraduationCap className={`w-full h-full transform translate-x-1/4 translate-y-1/4 ${currentUni.color}`} />
          </div>
        </section>
      ) : (
        <section className="text-center py-20 bg-white rounded-3xl border border-neutral-200 shadow-sm px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl font-black tracking-tighter text-neutral-900 mb-4">
              UNIPORTAL
            </h1>
            <p className="text-xl text-neutral-500 max-w-2xl mx-auto font-medium">
              The unified management system for Nigeria's leading academic institutions.
            </p>
            {!user ? (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/auth"
                  className="w-full sm:w-auto bg-neutral-900 text-white px-10 py-4 rounded-full font-bold hover:bg-neutral-800 transition-all shadow-2xl hover:shadow-neutral-200 flex items-center justify-center gap-2"
                >
                  Get Started
                  <UserCheck className="w-5 h-5" />
                </Link>
                <div className="flex gap-4">
                  {universities.map(u => (
                    <div key={u.id} className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center overflow-hidden grayscale hover:grayscale-0 transition-all cursor-help" title={u.name}>
                      <img src={u.logo} alt={u.id} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Logged in as {user.name}</p>
              </div>
            )}
          </motion.div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link
              to={card.link}
              className="group block p-8 bg-white rounded-2xl border border-neutral-200 hover:border-neutral-900 transition-all hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{card.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                {card.description}
              </p>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="bg-neutral-900 text-white rounded-3xl p-12 overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to start your journey?</h2>
          <p className="text-neutral-400 mb-8">
            Our comprehensive portal handles everything from your first application to your final graduation results.
          </p>
          <Link
            to="/admission"
            className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-full font-bold hover:bg-neutral-100 transition-colors"
          >
            Apply Now
            <GraduationCap className="w-5 h-5" />
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <GraduationCap className="w-full h-full transform translate-x-1/4 translate-y-1/4" />
        </div>
      </section>
    </div>
  );
}
