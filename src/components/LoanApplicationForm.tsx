import React, { useState } from 'react';
import { UserProfile, LoanApplication } from '../types';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Landmark, DollarSign, Calendar, FileText, Send, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface LoanApplicationFormProps {
  user: UserProfile;
}

export default function LoanApplicationForm({ user }: LoanApplicationFormProps) {
  const [amount, setAmount] = useState<number>(50000);
  const [purpose, setPurpose] = useState('');
  const [repaymentPeriod, setRepaymentPeriod] = useState<number>(6);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose) {
      toast.error('Please state the purpose of the loan');
      return;
    }

    setLoading(true);
    try {
      const loanApp: LoanApplication = {
        uid: user.uid,
        name: user.name,
        amount,
        purpose,
        status: 'pending',
        createdAt: new Date().toISOString(),
        university: user.university,
        repaymentPeriod,
      };

      await addDoc(collection(db, 'loans'), loanApp);
      toast.success('Loan application submitted successfully!');
      setPurpose('');
    } catch (error) {
      console.error('Loan error:', error);
      toast.error('Failed to submit loan application');
    } finally {
      setLoading(false);
    }
  };

  const interestRate = 0.05; // 5% interest
  const totalRepayment = amount * (1 + interestRate);
  const monthlyInstallment = totalRepayment / repaymentPeriod;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-neutral-900 text-white p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Landmark className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">UniPortal Bank</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Student Loan Scheme</h1>
            <p className="text-neutral-400 text-lg max-w-md">Empowering your academic journey with flexible financial support. Low interest rates, easy repayment.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 text-center min-w-[240px]">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Maximum Limit</p>
            <p className="text-4xl font-black">₦500,000</p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">5% Annual Interest Rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <FileText className="w-6 h-6 text-neutral-400" />
              Loan Application Form
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Loan Amount (₦)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="number"
                    min="10000"
                    max="500000"
                    step="5000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all font-mono text-lg"
                  />
                </div>
                <input 
                  type="range" 
                  min="10000" 
                  max="500000" 
                  step="5000" 
                  value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Repayment Period</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <select
                      value={repaymentPeriod}
                      onChange={(e) => setRepaymentPeriod(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-neutral-200 focus:border-neutral-900 outline-none bg-white font-bold"
                    >
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                      <option value={24}>24 Months</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Student Email</label>
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-600 font-medium">
                    {user.studentEmail || 'Not generated yet'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Purpose of Loan</label>
                <textarea
                  required
                  rows={4}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-4 rounded-xl border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all resize-none"
                  placeholder="e.g. Tuition fees, Research materials, Laptop purchase..."
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  By submitting this application, you agree to the terms and conditions of the UniPortal Bank Student Loan Scheme. Repayments will be automatically deducted from your virtual account or linked bank account.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Submit Application
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Repayment Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Principal Amount</span>
                <span className="font-bold">₦{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Interest (5%)</span>
                <span className="font-bold text-emerald-600">+₦{(amount * interestRate).toLocaleString()}</span>
              </div>
              <div className="h-px bg-neutral-100 my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Total Repayment</span>
                <span className="font-black">₦{totalRepayment.toLocaleString()}</span>
              </div>
              <div className="mt-6 p-4 bg-neutral-900 text-white rounded-2xl text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Monthly Installment</p>
                <p className="text-2xl font-black">₦{monthlyInstallment.toLocaleString()}</p>
                <p className="text-[10px] text-neutral-400 mt-1">For {repaymentPeriod} months</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-900 mb-4">Why UniPortal Bank?</h3>
            <ul className="space-y-3">
              {[
                'No hidden charges',
                'Instant approval for verified students',
                'Flexible repayment plans',
                'Supports academic growth'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-emerald-800 font-medium">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
