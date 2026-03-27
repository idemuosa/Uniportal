import { useState, useEffect } from 'react';
import { UserProfile, Payment } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { SCHOOL_FEES, HOSTEL_FEE } from '../constants';
import { toast } from 'sonner';
import { CreditCard, CheckCircle, Clock, DollarSign, ShieldCheck, History, Landmark, Copy, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentPortalProps {
  user: UserProfile;
}

export default function PaymentPortal({ user }: PaymentPortalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'payments'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handlePayment = async (type: 'tuition' | 'hostel', amount: number) => {
    setPaying(true);
    try {
      await addDoc(collection(db, 'payments'), {
        uid: user.uid,
        amount,
        type,
        status: 'completed',
        transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} payment successful!`);
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const tuitionFee = user.level ? (SCHOOL_FEES as any)[user.level] : 0;
  const hasPaidTuition = payments.some(p => p.type === 'tuition' && p.status === 'completed');
  const hasPaidHostel = payments.some(p => p.type === 'hostel' && p.status === 'completed');

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Payment Portal</h2>
          <p className="text-neutral-500">Manage your university fees and transactions.</p>
        </div>
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-wider">Secure Payments</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm space-y-8">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Fee Schedule
            </h3>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Tuition Fees ({user.level})</p>
                  <p className="text-2xl font-bold">₦{tuitionFee.toLocaleString()}</p>
                </div>
                {hasPaidTuition ? (
                  <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">Paid</span>
                ) : (
                  <button
                    onClick={() => handlePayment('tuition', tuitionFee)}
                    disabled={paying}
                    className="bg-neutral-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                  >
                    Pay Now
                  </button>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Hostel Fees</p>
                  <p className="text-2xl font-bold">₦{HOSTEL_FEE.toLocaleString()}</p>
                </div>
                {hasPaidHostel ? (
                  <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">Paid</span>
                ) : (
                  <button
                    onClick={() => handlePayment('hostel', HOSTEL_FEE)}
                    disabled={paying}
                    className="bg-neutral-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Landmark className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Bank Transfer Method</span>
              </div>
              
              <div className="space-y-6">
                <p className="text-neutral-400 text-sm">Transfer the exact fee amount to your virtual account below. Payments are automatically verified within 5-10 minutes.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Bank Name</p>
                    <p className="text-lg font-bold">UniPortal Bank</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Account Number</p>
                      <p className="text-lg font-mono font-bold">{user.virtualAccountNumber || 'Not Assigned'}</p>
                    </div>
                    {user.virtualAccountNumber && (
                      <button onClick={() => copyToClipboard(user.virtualAccountNumber!, 'Account Number')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Copy className="w-4 h-4 text-emerald-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <Info className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Ensure you use your <span className="text-white font-bold">Matric Number</span> as the transaction narration for faster manual reconciliation if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm space-y-8">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6" />
              History
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {payments.length === 0 && <p className="text-neutral-400 text-sm italic">No transactions found.</p>}
              {payments.map(payment => (
                <div key={payment.id} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl border border-neutral-200"><CreditCard className="w-5 h-5 text-neutral-400" /></div>
                    <div>
                      <p className="font-bold capitalize text-sm">{payment.type} Fee</p>
                      <p className="text-[10px] text-neutral-400 font-mono uppercase">{payment.transactionId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">₦{payment.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-neutral-400">{new Date(payment.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
