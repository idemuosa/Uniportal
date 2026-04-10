import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserProfile, BankDetails } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Landmark, Phone, ArrowLeft, ShieldCheck, CheckCircle2, Copy, Building2, ChevronRight, Wallet } from 'lucide-react';
import { FaCopy, FaCheckCircle } from 'react-icons/fa';

interface RemitaPaymentProps {
  user: UserProfile;
}

export default function RemitaPayment({ user }: RemitaPaymentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { type, amount } = location.state || { type: 'tuition', amount: 0 };
  const [method, setMethod] = useState<'card' | 'bank' | 'ussd'>('card');
  const [processing, setProcessing] = useState(false);
  const [rrr] = useState(`RRR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  const [banks, setBanks] = useState<BankDetails[]>([
    { accountName: 'idemudia osamudiamen', bankName: 'UBA', accountNumber: '2054037193' },
    { accountName: 'idemudia osamudiamen', bankName: 'OPAY', accountNumber: '8183793358' },
    { accountName: 'idemudia osamudiamen', bankName: 'PALMPAY', accountNumber: '8106202283' }
  ]);
  const [copiedAcct, setCopiedAcct] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState(user.name || '');

  useEffect(() => {
    const fetchTreasury = async () => {
      try {
        const [treasuryRes, bankRes] = await Promise.all([
          api.get('/portal/treasury-settings/'),
          api.get('/portal/bank-details/')
        ]);
        
        if (bankRes.data.length > 0) {
          setBanks(bankRes.data.map((b: any) => ({
            bankName: b.bank_name,
            accountNumber: b.account_number,
            accountName: b.account_name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch treasury data:', error);
      }
    };
    fetchTreasury();
  }, []);

  if (!amount) {
    return <div className="p-20 text-center text-[#008751]">Invalid session. Redirecting...{setTimeout(() => navigate('/payments'), 2000)}</div>;
  }

  const handleComplete = async () => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await api.post('/finances/payments/', {
        type: type,
        amount: amount,
        reference: rrr,
        status: 'success',
        method: method,
      });
      
      toast.success(`Payment settled! Ref: ${rrr}`);
      navigate('/payments');
    } catch (err) {
      console.error(err);
      toast.error('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAcct(text);
    toast.success('Account number copied!');
    setTimeout(() => setCopiedAcct(null), 3000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) return v.substring(0, 2) + '/' + v.substring(2, 4);
    return v;
  };

  return (
    <div className="min-h-[85vh] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <button 
          onClick={() => navigate('/payments')}
          className="flex items-center gap-2 text-[#008751]/40 hover:text-[#008751] transition-all mb-6 text-xs font-bold uppercase tracking-widest bg-slate-50 px-5 py-2.5 rounded-full border border-[#008751]/8 hover:border-[#008751]/20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Payments
        </button>

        {/* HEADER */}
        <div className="bg-white border border-[#008751]/8 rounded-2xl p-8 mb-6 flex flex-col md:flex-row justify-between items-center shadow-[0_4px_30px_rgba(0,135,81,0.04)]">
          <div className="flex items-center gap-5 mb-4 md:mb-0">
            <div className="w-16 h-16 bg-[#008751]/8 border border-[#008751]/10 rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8 text-[#008751]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-[#008751] uppercase leading-none">Remita <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008751] to-emerald-500">Gateway</span></h1>
              <p className="text-[10px] font-bold text-[#008751]/30 uppercase tracking-widest mt-1">Secure Payment Processing</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-[#008751]/8 px-5 py-3 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-[#008751]" />
            <div className="flex flex-col">
               <span className="font-black tracking-tight text-[#008751] text-sm">Encrypted</span>
               <span className="text-[8px] font-bold text-[#008751]/25 tracking-widest uppercase">End-to-End Secure</span>
            </div>
          </div>
        </div>

        {/* RRR & AMOUNT */}
        <div className="bg-slate-50 border border-[#008751]/8 rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#008751]/30 uppercase tracking-widest mb-1">Reference (RRR)</p>
            <p className="font-mono text-2xl font-black text-[#008751] tracking-widest">{rrr}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#008751]/30 uppercase tracking-widest mb-1">Amount</p>
            <p className="text-4xl font-black text-[#008751]">₦{amount.toLocaleString()}</p>
          </div>
        </div>

        {/* METHOD SELECTION */}
        <div className="bg-white border border-[#008751]/8 rounded-2xl p-5 mb-5">
          <p className="text-xs font-black text-[#008751] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#008751]/8 pb-2">
            <ChevronRight className="w-3 h-3" /> Payment Method
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'card', label: 'ATM Card', icon: <CreditCard className="w-5 h-5" />, desc: 'Debit/Credit' },
              { id: 'bank', label: 'Bank Transfer', icon: <Landmark className="w-5 h-5" />, desc: 'Direct Transfer' },
              { id: 'ussd', label: 'USSD', icon: <Phone className="w-5 h-5" />, desc: '*737# / *966#' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMethod(item.id as any)}
                className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all ${
                  method === item.id 
                    ? 'border-[#008751] bg-[#008751]/5 text-[#008751] shadow-[0_4px_15px_rgba(0,135,81,0.08)]' 
                    : 'border-[#008751]/8 bg-slate-50 text-[#008751]/35 hover:border-[#008751]/20 hover:text-[#008751]/60'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                <span className="text-[8px] font-medium opacity-60">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DYNAMIC CONTENT */}
        <AnimatePresence mode="wait">
          {method === 'card' && (
            <motion.div 
              key="card-form"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-[#008751]/8 rounded-2xl p-5 mb-5 space-y-4"
            >
              <h3 className="text-sm font-black text-[#008751] uppercase tracking-widest flex items-center gap-2 border-b border-[#008751]/8 pb-2">
                <CreditCard className="w-4 h-4" /> Card Details
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-widest ml-1 mb-1 block">Cardholder Name</label>
                  <input 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="w-full p-4 rounded-xl bg-slate-50 border border-[#008751]/10 text-[#008751] font-semibold text-sm placeholder:text-[#008751]/20 focus:border-[#008751]/30 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-widest ml-1 mb-1 block">Card Number</label>
                  <input 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="0000  0000  0000  0000"
                    maxLength={19}
                    className="w-full p-4 rounded-xl bg-slate-50 border border-[#008751]/10 text-[#008751] font-mono text-lg font-black tracking-widest placeholder:text-[#008751]/20 focus:border-[#008751]/30 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-widest ml-1 mb-1 block">Expiry</label>
                    <input 
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full p-4 rounded-xl bg-slate-50 border border-[#008751]/10 text-[#008751] font-mono font-black text-center tracking-widest placeholder:text-[#008751]/20 focus:border-[#008751]/30 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-widest ml-1 mb-1 block">CVV</label>
                    <input 
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="•••"
                      maxLength={3}
                      className="w-full p-4 rounded-xl bg-slate-50 border border-[#008751]/10 text-[#008751] font-mono font-black text-center tracking-widest placeholder:text-[#008751]/20 focus:border-[#008751]/30 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {method === 'bank' && (
            <motion.div 
              key="bank-form"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-[#008751]/8 rounded-2xl p-5 mb-5 space-y-4"
            >
              <h3 className="text-sm font-black text-[#008751] uppercase tracking-widest flex items-center gap-2 border-b border-[#008751]/8 pb-2">
                <Landmark className="w-4 h-4" /> Bank Accounts
              </h3>
              <p className="text-[11px] text-[#008751]/40 font-medium">
                Transfer ₦{amount.toLocaleString()} to any account below. Use your <strong className="text-[#008751]">Matric Number</strong> as reference.
              </p>

              <div className="space-y-3">
                {banks.length > 0 ? banks.map((bank, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-50 border border-[#008751]/8 rounded-xl p-4 hover:border-[#008751]/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white border border-[#008751]/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-[#008751]" />
                        </div>
                        <div>
                          <h4 className="font-black text-[#008751] text-sm uppercase tracking-wide">{bank.bankName}</h4>
                          <p className="text-[9px] font-medium text-[#008751]/35 uppercase tracking-widest">{bank.accountName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#008751]/8 p-3 rounded-lg flex justify-between items-center mt-2">
                      <span className="font-mono text-lg font-black text-[#008751] tracking-widest">{bank.accountNumber}</span>
                      <button 
                        onClick={() => copyToClipboard(bank.accountNumber)}
                        className="flex items-center gap-1.5 bg-[#008751]/8 px-3 py-1.5 rounded-lg hover:bg-[#008751]/15 transition-colors"
                      >
                        {copiedAcct === bank.accountNumber ? (
                          <><FaCheckCircle size={12} color="#008751" /><span className="text-[9px] text-[#008751] font-bold uppercase">Copied!</span></>
                        ) : (
                          <><FaCopy size={12} color="#008751" /><span className="text-[9px] text-[#008751] font-bold uppercase">Copy</span></>
                        )}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center border-2 border-dashed border-[#008751]/10 rounded-xl">
                    <p className="text-[#008751]/25 font-bold uppercase tracking-widest text-sm">No bank accounts configured</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {method === 'ussd' && (
            <motion.div 
              key="ussd-form"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-[#008751]/8 rounded-2xl p-5 mb-5 space-y-4"
            >
              <h3 className="text-sm font-black text-[#008751] uppercase tracking-widest flex items-center gap-2 border-b border-[#008751]/8 pb-2">
                <Phone className="w-4 h-4" /> USSD Codes
              </h3>

              <div className="space-y-2">
                {[
                  { bank: 'GTBank', code: '*737*50*Amount*159#' },
                  { bank: 'First Bank', code: '*894*Amount#' },
                  { bank: 'UBA', code: '*919*4*Amount#' },
                  { bank: 'Access Bank', code: '*901*Amount#' },
                  { bank: 'Zenith Bank', code: '*966*Amount#' },
                ].map((item) => (
                  <div key={item.bank} className="bg-slate-50 border border-[#008751]/5 p-3 rounded-lg flex justify-between items-center hover:border-[#008751]/15 transition-all">
                    <div>
                      <p className="text-xs font-bold text-[#008751] uppercase tracking-wide">{item.bank}</p>
                      <p className="text-[10px] font-mono text-[#008751]/40 mt-0.5">{item.code}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(item.code); toast.success(`${item.bank} USSD copied!`); }} className="bg-[#008751]/8 p-2 rounded-lg hover:bg-[#008751]/15 transition-colors">
                      <Copy className="w-3 h-3 text-[#008751]" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STUDENT INFO & SUBMIT */}
        <div className="bg-white border border-[#008751]/8 rounded-2xl p-5 mb-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-widest ml-1 mb-1 block">Student Name</label>
              <input disabled value={user.name} className="w-full p-3 rounded-xl bg-slate-50 border border-[#008751]/8 text-[#008751]/50 font-semibold text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-widest ml-1 mb-1 block">Email</label>
              <input disabled value={user.email} className="w-full p-3 rounded-xl bg-slate-50 border border-[#008751]/8 text-[#008751]/50 font-semibold text-xs" />
            </div>
          </div>
          
          <button 
            onClick={handleComplete}
            disabled={processing}
            className="w-full bg-[#008751] text-white py-4 rounded-xl font-black hover:bg-[#006e41] transition-all shadow-[0_8px_25px_rgba(0,135,81,0.2)] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] text-sm tracking-wider uppercase"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Complete Payment
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 border border-[#008751]/5 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-[#008751]/25 mb-1">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">256-bit Encryption • Secured by Lukke Registry</span>
          </div>
        </div>

        <p className="mt-4 text-center text-[#008751]/20 text-[10px] font-medium leading-relaxed">
          Proceeding implies acceptance of the university's non-refundable policy and processing charges.
        </p>
      </div>
    </div>
  );
}
