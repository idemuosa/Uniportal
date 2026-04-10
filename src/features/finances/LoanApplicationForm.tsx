import React, { useState, useEffect } from 'react';
import { UserProfile, LoanApplication } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Landmark, DollarSign, Calendar, FileText, Send, Info, TrendingUp, HandCoins, ShieldCheck, Fingerprint } from 'lucide-react';
import { motion } from 'motion/react';

interface LoanApplicationFormProps {
  user: UserProfile;
}

export default function LoanApplicationForm({ user }: LoanApplicationFormProps) {
  const [amount, setAmount] = useState<number>(50000);
  const [purpose, setPurpose] = useState('');
  const [repaymentPeriod, setRepaymentPeriod] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [maxLoanLimit, setMaxLoanLimit] = useState<number>(500000);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/portal/treasury-settings/');
        const settings = response.data[0]; // Assuming first record
        if (settings && settings.max_loan_limit) setMaxLoanLimit(Number(settings.max_loan_limit));
      } catch (error) {
        console.error('Settings error:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose || !bvn || !nin) {
      toast.error('Please fill all required identification fields');
      return;
    }
    if (bvn.length !== 11) {
      toast.error('BVN must be 11 digits');
      return;
    }
    if (nin.length !== 11) {
      toast.error('NIN must be 11 digits');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount,
        purpose,
        repayment_period: repaymentPeriod,
        bvn,
        nin,
        type: 'Student Loan'
      };

      await api.post('/finances/loans/', payload);
      toast.success('Loan application submitted successfully!');
      setPurpose('');
      setBvn('');
      setNin('');
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
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-slate-50/90 backdrop-blur-3xl text-[#008751] p-14 rounded-[4rem] border border-[#008751]/15 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left space-y-6">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="p-4 bg-[#008751]/3 rounded-3xl border border-[#008751]/8 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                <Landmark className="w-8 h-8 text-[#008751]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">LUKKE Financial Systems</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">Student Loan Scheme</h1>
            <p className="text-emerald-100/30 text-lg font-bold max-w-md leading-relaxed">Empowering your academic journey with flexible financial infrastructure. Low interest rates, automated settlement.</p>
          </div>
          <div className="bg-[#008751]/3 backdrop-blur-3xl p-10 rounded-[3rem] border border-[#008751]/8 text-center min-w-[280px] group-hover:bg-[#008751]/5 transition-all shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60 mb-4">Maximum Limit</p>
            <p className="text-5xl font-black tracking-tighter text-[#008751]">#{(maxLoanLimit / 1000).toFixed(0)}k</p>
            <div className="mt-6 pt-6 border-t border-[#008751]/5">
              <p className="text-[10px] font-black text-[#008751] uppercase tracking-widest bg-emerald-500/10 inline-block px-4 py-1.5 rounded-full border border-emerald-500/20">5% Annual Fixed Rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-900/40 backdrop-blur-xl p-12 rounded-[4rem] border border-[#008751]/15 shadow-2xl space-y-12 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            <h2 className="text-3xl font-black tracking-tighter text-[#008751] flex items-center gap-5 uppercase relative z-10">
              <div className="p-4 bg-emerald-500/20 rounded-2xl border border-[#008751]/5 shadow-inner leading-none"><HandCoins className="w-8 h-8 text-[#008751]" /></div>
              Application Terminal
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center ml-2">
                   <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Requested Capital (#)</label>
                   <span className="font-mono text-[#008751] font-black text-lg">#{amount.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500/20" />
                  <input
                    type="number"
                    min="10000"
                    max={maxLoanLimit}
                    step="5000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-16 pr-8 py-8 rounded-[2.5rem] bg-[#008751]/3 border border-[#008751]/8 text-[#008751] outline-none focus:bg-[#008751]/5 focus:border-emerald-500 transition-all font-black text-2xl tracking-tighter placeholder:text-emerald-900"
                  />
                </div>
                <input 
                  type="range" 
                  min="10000" 
                  max={maxLoanLimit}
                  step="5000" 
                  value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-3 bg-[#008751]/3 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-2">Verification BVN</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500/20" />
                    <input
                      required
                      type="text"
                      maxLength={11}
                      placeholder="ENTER 11-DIGIT BVN"
                      value={bvn}
                      onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-16 pr-8 py-8 rounded-[2rem] bg-[#008751]/3 border border-[#008751]/8 text-[#008751] outline-none focus:bg-[#008751]/5 focus:border-emerald-500 transition-all font-black text-xl placeholder:text-emerald-900"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-2">Verification NIN</label>
                  <div className="relative">
                    <Fingerprint className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500/20" />
                    <input
                      required
                      type="text"
                      maxLength={11}
                      placeholder="ENTER 11-DIGIT NIN"
                      value={nin}
                      onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-16 pr-8 py-8 rounded-[2rem] bg-[#008751]/3 border border-[#008751]/8 text-[#008751] outline-none focus:bg-[#008751]/5 focus:border-emerald-500 transition-all font-black text-xl placeholder:text-emerald-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-2">Repayment Period</label>
                  <div className="relative">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500/20" />
                    <select
                      value={repaymentPeriod}
                      onChange={(e) => setRepaymentPeriod(Number(e.target.value))}
                      className="w-full pl-16 pr-8 py-8 rounded-[2rem] bg-[#008751]/3 border border-[#008751]/8 text-[#008751] outline-none focus:bg-[#008751]/5 focus:border-emerald-500 transition-all font-black text-xl appearance-none cursor-pointer"
                    >
                      <option value={3} className="bg-slate-50">3 Months</option>
                      <option value={6} className="bg-slate-50">6 Months</option>
                      <option value={12} className="bg-slate-50">12 Months</option>
                      <option value={24} className="bg-slate-50">24 Months</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-2">Verification Email</label>
                  <div className="p-8 bg-white/2 rounded-[2rem] border border-[#008751]/5 text-emerald-100/40 text-sm font-black tracking-tight uppercase">
                    {user.studentEmail || 'Pending Matriculation'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-2">Purpose of Capital</label>
                <textarea
                  required
                  rows={4}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-8 rounded-[2.5rem] bg-[#008751]/3 border border-[#008751]/8 text-[#008751] outline-none focus:bg-[#008751]/5 focus:border-emerald-500 transition-all font-black text-xl placeholder:text-emerald-900 resize-none"
                  placeholder="e.g. Tuition settlement, Research infrastructure, Systems acquisition..."
                />
              </div>

              <div className="p-8 bg-emerald-500/5 rounded-[3rem] border border-emerald-500/10 flex gap-6 group/info shadow-inner">
                <div className="p-4 bg-emerald-500/20 rounded-2xl h-fit group-hover/info:rotate-12 transition-transform duration-500"><Info className="w-8 h-8 text-[#008751] shrink-0" /></div>
                <p className="text-xs text-emerald-100/30 font-bold leading-relaxed">
                  By submitting this application, you authorize the <span className="text-[#008751] font-black">LUKKE Internal Revenue Service</span> to deduct repayments automatically from your virtual ledger or linked assets. Standard verification applies.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#008751] py-8 rounded-[2.5rem] font-black hover:bg-emerald-50 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 text-xl uppercase tracking-tighter"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Initialize Disbursement
                    <Send className="w-7 h-7" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-50/80 backdrop-blur-3xl p-12 rounded-[4rem] border border-[#008751]/15 shadow-2xl h-fit sticky top-24 overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
            <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-[#008751] uppercase tracking-tighter relative z-10">
               <div className="p-3 bg-emerald-500/20 rounded-2xl shadow-inner"><TrendingUp className="w-6 h-6 text-[#008751]" /></div>
               Settlement Summary
            </h3>
            <div className="space-y-8 relative z-10">
              <div className="flex justify-between items-center py-5 border-b border-[#008751]/5 group/stat cursor-default">
                <span className="text-emerald-100/40 text-[10px] font-black uppercase tracking-[0.4em] group-hover/stat:text-[#008751] transition-colors">Principal</span>
                <span className="font-black text-[#008751] text-2xl tracking-tighter">#{amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-5 border-b border-[#008751]/5 group/stat cursor-default">
                <span className="text-emerald-100/40 text-[10px] font-black uppercase tracking-[0.4em] group-hover/stat:text-[#008751] transition-colors">Interest (5%)</span>
                <span className="font-black text-[#008751] text-2xl tracking-tighter">+#{(amount * interestRate).toLocaleString()}</span>
              </div>
              <div className="pt-8 text-center bg-[#008751]/3 p-10 rounded-[2.5rem] border border-[#008751]/8 group-hover:bg-[#008751]/5 transition-all">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500/60 mb-4">Total Obligation</p>
                <p className="text-5xl font-black tracking-tighter text-[#008751]">#{totalRepayment.toLocaleString()}</p>
              </div>
              <div className="mt-10 p-10 bg-emerald-500 text-[#008751] rounded-[3rem] text-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-60 mb-2">Monthly Installment</p>
                <p className="text-4xl font-black tracking-tighter">#{monthlyInstallment.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-4 opacity-40">Duration: {repaymentPeriod} Cycles</p>
              </div>
            </div>
            
            <div className="mt-12 p-8 bg-[#008751]/3 rounded-[2.5rem] border border-[#008751]/5 text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-3">System Protocol</p>
               <p className="text-[10px] text-emerald-100/30 font-medium italic leading-relaxed">Disbursement occurs within 72hrs of internal risk assessment approval.</p>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-2xl space-y-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-700" />
            <h3 className="text-3xl font-black text-[#008751] uppercase tracking-tighter relative z-10">Why LUKKE Bank?</h3>
            <ul className="space-y-6 relative z-10">
              {[
                'Zero Processing Fees',
                'Instant Risk Assessment',
                'Flexible Repayment Cycles',
                'Academic Integrity Support'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm text-emerald-900 font-black uppercase tracking-tight group/item">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] group-hover/item:scale-150 transition-transform" />
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


