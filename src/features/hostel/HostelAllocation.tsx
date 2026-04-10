import { useState, useEffect } from 'react';
import { UserProfile, Hostel, Payment } from '../../types';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { Bed, CheckCircle, Clock, Building2, MapPin, ShieldCheck, Home, ArrowRight, FileText, Info, AlertCircle, Printer, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HostelAllocationProps {
  user: UserProfile;
}

export default function HostelAllocation({ user }: HostelAllocationProps) {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [allocation, setAllocation] = useState<Hostel | null>(null);
  const [hasPaidHostel, setHasPaidHostel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const checkPayment = async () => {
      const q = query(collection(db, 'payments'), where('uid', '==', user.uid), where('type', '==', 'hostel'), where('status', '==', 'completed'));
      const snapshot = await getDocs(q);
      setHasPaidHostel(!snapshot.empty);
    };

    const unsubHostels = onSnapshot(collection(db, 'hostels'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hostel));
      setHostels(list);
      setAllocation(list.find(h => h.occupantId === user.uid) || null);
      setLoading(false);
    });

    checkPayment();
    return () => unsubHostels();
  }, [user.uid]);

  const handleBook = async (hostel: Hostel) => {
    if (!hasPaidHostel) {
      toast.error('Financial Clearance Required (Hostel Fees)');
      return;
    }

    setBooking(true);
    try {
      await updateDoc(doc(db, 'hostels', hostel.id!), {
        isOccupied: true,
        occupantId: user.uid,
        allocationDate: new Date().toISOString(),
      });
      toast.success('Residential Space Reserved Successfully');
    } catch (error) {
      toast.error('Registry Synchronization Failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      {/* 🏙️ REGISTRY HEADER */}
      <div className="bg-slate-50 p-10 rounded-[3rem] shadow-2xl border border-[#008751]/10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 space-y-2">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-inner"><Building2 className="w-6 h-6" /></div>
              <h2 className="text-3xl font-black text-[#008751] tracking-tighter uppercase italic">Institutional Housing Registry</h2>
           </div>
           <p className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-[0.3em] pl-12">Residential Asset Allocation & Management System</p>
        </div>
        
        {!allocation && (
          <div className={`px-8 py-4 rounded-2xl flex items-center gap-4 border-2 ${hasPaidHostel ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-[#008751]/10 text-[#008751]/40'}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${hasPaidHostel ? 'bg-emerald-600 text-[#008751]' : 'bg-slate-300 text-[#008751]'}`}>
                {hasPaidHostel ? <CheckCircle className="w-5 h-5" /> : '1'}
             </div>
             <div>
                <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Eligibility</p>
                <p className="text-xs font-black uppercase tracking-tighter">{hasPaidHostel ? 'Cleared for Allocation' : 'Tuition Clearance Required'}</p>
             </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {allocation ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-12 xl:col-span-8 bg-slate-50 p-12 rounded-[4rem] shadow-2xl border border-[#008751]/10 relative overflow-hidden">
                <div className="flex justify-between items-start mb-12">
                   <div className="space-y-4">
                      <h3 className="text-4xl font-black text-[#008751] tracking-tighter uppercase italic">Allocation Slip</h3>
                      <div className="flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl w-fit border border-emerald-100 shadow-inner">
                         <ShieldCheck className="w-4 h-4" /> Space Occupancy Verified
                      </div>
                   </div>
                   <button className="p-5 bg-white text-[#008751] rounded-3xl hover:bg-white transition-all shadow-2xl active:scale-90">
                      <Printer className="w-6 h-6" />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-[#008751]/10 space-y-2">
                      <p className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest">Permanent Hall</p>
                      <p className="text-2xl font-black text-[#008751] italic uppercase tracking-tighter">{allocation.name}</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-[#008751]/10 space-y-2">
                      <p className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest">Room Matrix</p>
                      <p className="text-2xl font-black text-[#008751] italic uppercase tracking-tighter">ROOM {allocation.roomNumber}</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-[#008751]/10 space-y-2">
                      <p className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest">Bed Position</p>
                      <p className="text-2xl font-black text-[#008751] italic uppercase tracking-tighter">SPACE {allocation.bedNumber}</p>
                   </div>
                </div>

                <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-6">
                   <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
                   <div className="space-y-2">
                      <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Occupancy Protocol</p>
                      <p className="text-[10px] text-amber-700/60 leading-relaxed font-medium italic">Present this digital slip alongside your Institutional Biometric ID card at the Hall Warden's office for key issuance. Space is non-transferable.</p>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                <div className="bg-indigo-950 p-10 rounded-[4rem] text-[#008751] space-y-8 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#008751]/3 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-125 transition-transform" />
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#008751]/5 rounded-2xl"><Fingerprint className="w-6 h-6" /></div>
                      <h4 className="text-lg font-black tracking-tighter uppercase italic">Biometric Pass</h4>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[#008751]/3 rounded-2xl border border-[#008751]/5">
                         <span className="text-[9px] font-black uppercase tracking-widest text-[#008751]/35">Face ID</span>
                         <CheckCircle className="text-[#008751] w-4 h-4" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#008751]/3 rounded-2xl border border-[#008751]/5">
                         <span className="text-[9px] font-black uppercase tracking-widest text-[#008751]/35">Left Index</span>
                         <CheckCircle className="text-[#008751] w-4 h-4" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#008751]/3 rounded-2xl border border-[#008751]/5">
                         <span className="text-[9px] font-black uppercase tracking-widest text-[#008751]/35">Right Index</span>
                         <CheckCircle className="text-[#008751] w-4 h-4" />
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hostels.filter(h => !h.isOccupied).map((hostel, idx) => (
                   <motion.div
                      key={hostel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-slate-50 p-10 rounded-[3.5rem] shadow-2xl border border-[#008751]/10 hover:border-emerald-500/20 hover:bg-emerald-50/10 transition-all group flex flex-col justify-between"
                   >
                      <div className="space-y-8">
                         <div className="w-16 h-16 bg-slate-50 text-[#008751]/40 rounded-3xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-[#008751] group-hover:rotate-12 transition-all shadow-inner border border-[#008751]/10">
                            <Home className="w-8 h-8" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Available Asset</p>
                            <h3 className="text-3xl font-black text-[#008751] tracking-tighter uppercase italic leading-none">{hostel.name}</h3>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pb-8">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-[#008751]/10">
                               <p className="text-[8px] font-black text-[#008751]/40 uppercase tracking-widest mb-1">Room</p>
                               <p className="text-base font-black text-[#008751] italic">{hostel.roomNumber}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-[#008751]/10">
                               <p className="text-[8px] font-black text-[#008751]/40 uppercase tracking-widest mb-1">Space</p>
                               <p className="text-base font-black text-[#008751] italic">{hostel.bedNumber}</p>
                            </div>
                         </div>
                      </div>
                      <button
                         onClick={() => handleBook(hostel)}
                         disabled={booking || !hasPaidHostel}
                         className="w-full bg-white text-[#008751] py-5 rounded-[2rem] font-black hover:bg-white transition-all shadow-xl disabled:opacity-20 flex items-center justify-center gap-3 active:scale-95 text-xs uppercase tracking-widest italic"
                      >
                         {booking ? 'Locking Space...' : <>Select Hall Space <ArrowRight className="w-5 h-5" /></>}
                      </button>
                   </motion.div>
                ))}

                {hostels.filter(h => !h.isOccupied).length === 0 && (
                   <div className="col-span-full py-24 text-center bg-slate-50 rounded-[4rem] border-4 border-dashed border-[#008751]/10 space-y-6">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                         <Clock className="w-12 h-12" />
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-xl font-black text-[#008751] uppercase italic">Housing Inventory Exhausted</h3>
                         <p className="text-[10px] text-[#008751]/40 font-bold uppercase tracking-widest italic">Waitlist Protocol Initialized. Report to Registry for Manual Allocation.</p>
                      </div>
                   </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



