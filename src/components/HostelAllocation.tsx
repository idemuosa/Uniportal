import { useState, useEffect } from 'react';
import { UserProfile, Hostel, Payment } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { Bed, CheckCircle, Clock, Building2, MapPin, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

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
      toast.error('Please pay hostel fees first');
      return;
    }

    setBooking(true);
    try {
      await updateDoc(doc(db, 'hostels', hostel.id!), {
        isOccupied: true,
        occupantId: user.uid,
      });
      toast.success('Hostel bed allocated successfully!');
    } catch (error) {
      toast.error('Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div></div>;

  if (allocation) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Bed className="w-6 h-6" />
            Your Allocation
          </h2>
          <div className="p-8 rounded-2xl bg-neutral-900 text-white space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <span className="text-neutral-400 text-sm font-bold uppercase tracking-wider">Hostel Name</span>
              <span className="text-xl font-bold">{allocation.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <span className="text-neutral-400 text-sm font-bold uppercase tracking-wider">Room Number</span>
              <span className="text-xl font-bold">{allocation.roomNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 text-sm font-bold uppercase tracking-wider">Bed Space</span>
              <span className="text-xl font-bold">{allocation.bedNumber}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Hostel Allocation</h2>
          <p className="text-neutral-500">Select an available bed space in your preferred hostel.</p>
        </div>
        {!hasPaidHostel && (
          <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex items-center gap-3">
            <Clock className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Payment Required</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hostels.filter(h => !h.isOccupied).map(hostel => (
          <motion.div
            key={hostel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm hover:border-neutral-900 transition-all group"
          >
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">{hostel.name}</h3>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-neutral-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Room {hostel.roomNumber}
              </p>
              <p className="text-sm text-neutral-500 flex items-center gap-2">
                <Bed className="w-4 h-4" />
                Bed {hostel.bedNumber}
              </p>
            </div>
            <button
              onClick={() => handleBook(hostel)}
              disabled={booking || !hasPaidHostel}
              className="w-full bg-neutral-900 text-white p-3 rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              {booking ? 'Booking...' : 'Book Bed Space'}
            </button>
          </motion.div>
        ))}
        {hostels.filter(h => !h.isOccupied).length === 0 && (
          <div className="col-span-full p-12 text-center bg-neutral-50 rounded-3xl border border-neutral-200">
            <p className="text-neutral-400 font-bold">No bed spaces available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
