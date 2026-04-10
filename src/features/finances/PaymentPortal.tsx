import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, CheckSquare, CreditCard, Building2, Bell, FileText, ChevronRight, CheckCircle2, History, Settings, Landmark, Mail } from "lucide-react";
import api from "../../api/axios";
import { UserProfile, Payment, BankDetails } from "../../types";
import { toast } from 'sonner';

const PaymentPortal: React.FC<{ user: UserProfile }> = ({ user }) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicFees, setDynamicFees] = useState<Record<string, number>>({});
  const [acceptanceFee, setAcceptanceFee] = useState<number>(0);
  const [earlyPaymentDiscount, setEarlyPaymentDiscount] = useState<number>(0);
  const [banks, setBanks] = useState<BankDetails[]>([
    { accountName: 'idemudia osamudiamen', bankName: 'UBA', accountNumber: '2054037193' },
    { accountName: 'idemudia osamudiamen', bankName: 'OPAY', accountNumber: '8183793358' },
    { accountName: 'idemudia osamudiamen', bankName: 'PALMPAY', accountNumber: '8106202283' }
  ]);
  
  const [selectedBank, setSelectedBank] = useState<BankDetails | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, treasuryRes, bankRes] = await Promise.all([
          api.get('/finances/payments/'),
          api.get('/portal/treasury-settings/'),
          api.get('/portal/bank-details/')
        ]);

        setPayments(paymentsRes.data);
        
        if (treasuryRes.data.length > 0) {
          const t = treasuryRes.data[0];
          setAcceptanceFee(t.acceptance_fee);
          setEarlyPaymentDiscount(t.early_payment_discount);
        }

        if (bankRes.data.length > 0) {
          setBanks(bankRes.data.map((b: any) => ({
            bankName: b.bank_name,
            accountNumber: b.account_number,
            accountName: b.account_name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch payment data:', error);
        toast.error('Could not load payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePayment = (type: string, amount: number) => {
    navigate("/remita-payment", { state: { type, amount } });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Account number copied!");
  };

  const lastPayment = payments[0] || null;

  return (
    <div className="min-h-[85vh] bg-white text-[#008751] p-4 md:p-8 font-sans rounded-[2.5rem] border border-[#008751]/8 shadow-[0_10px_50px_rgba(0,135,81,0.04)] relative overflow-hidden">
      
      {/* HEADER SECTION */}
      <header className="mb-10 border-b border-[#008751]/8 pb-6 flex flex-col items-center">
        <div className="flex flex-col md:flex-row w-full justify-between items-center mb-6">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[#008751] uppercase leading-none">Payment <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008751] via-emerald-500 to-[#006e41]">Portal</span></h1>
            <p className="text-[#008751]/35 text-[11px] font-bold tracking-widest uppercase mt-2">Fee Settlement & Treasury Management</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 border border-[#008751]/8 px-6 py-3 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-[#008751]" />
            <div className="flex flex-col">
               <span className="font-black tracking-tight text-[#008751] text-sm">Secured</span>
               <span className="text-[9px] font-bold text-[#008751]/30 tracking-widest uppercase">End-to-End Encrypted</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 w-full border-t border-[#008751]/5 pt-4 text-[10px] font-bold uppercase text-[#008751]/35 tracking-widest">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#008751]" /> Verification</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#008751]" /> Reconciliation</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#008751]" /> Receipting</span>
        </div>
      </header>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Fee Schedule */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="bg-slate-50/80 border border-[#008751]/8 rounded-2xl p-5 relative overflow-hidden">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#008751] mb-4 flex items-center gap-2 border-b border-[#008751]/8 pb-2">
              <ChevronRight className="w-3 h-3" /> Fee Schedule
            </h2>

            <div className="space-y-3">
              {[
                { label: "Acceptance", amount: acceptanceFee || 50000, type: "acceptance" },
                { label: "Tuition Fee", amount: dynamicFees[user.level || '100L'] || 120000, type: "tuition" },
                { label: "Hostel Fee", amount: 50000, type: "hostel" },
              ].map((fee) => {
                const isTuition = fee.type === 'tuition';
                const discountAmount = isTuition ? (fee.amount * earlyPaymentDiscount / 100) : 0;
                const finalAmount = fee.amount - discountAmount;
                const isPaid = payments.some(p => p.type === fee.type && p.status === 'success');

                return (
                  <div key={fee.label} className="bg-white border border-[#008751]/8 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-[#008751] flex items-center gap-2 text-sm">
                        <ChevronRight className="w-2 h-2 text-[#008751]/50" /> {fee.label}
                      </h3>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-[#008751]/8">
                        <span className="font-black text-lg text-[#008751]">₦{finalAmount.toLocaleString()}</span>
                        {isPaid && <CheckCircle2 className="text-[#008751] w-4 h-4" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#008751]/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#008751]/35 uppercase">
                        <CreditCard className="w-3 h-3" /> Card & Remita
                      </div>
                      <button 
                        onClick={() => handlePayment(fee.type, finalAmount)}
                        disabled={isPaid}
                        className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${isPaid ? 'bg-slate-100 border border-[#008751]/10 text-[#008751]/30 cursor-not-allowed' : 'bg-[#008751] text-white hover:bg-[#006e41] shadow-[0_4px_15px_rgba(0,135,81,0.2)]'}`}
                      >
                        {isPaid ? 'Cleared ✓' : 'Pay Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invoice Panel */}
          <div className="bg-white border border-[#008751]/8 rounded-2xl p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#008751] mb-4 flex items-center gap-2 border-b border-[#008751]/8 pb-2">
              <ChevronRight className="w-3 h-3" /> Quick Pay
            </h2>
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-[#008751]/5">
               <span className="text-[10px] font-bold text-[#008751]/50 uppercase tracking-widest">Top-up:</span>
               <div className="flex gap-2">
                 <button onClick={() => navigate("/remita-payment", { state: { type: "topup", amount: 0 } })} className="flex items-center gap-2 bg-white border border-[#008751]/10 px-3 py-2 rounded-lg hover:border-[#008751]/30 hover:bg-[#008751]/5 transition-all text-xs font-bold text-[#008751] uppercase"><CreditCard className="w-3 h-3" /> Card</button>
                 <button onClick={() => navigate("/remita-payment", { state: { type: "topup", amount: 0 } })} className="flex items-center gap-2 bg-white border border-[#008751]/10 px-3 py-2 rounded-lg hover:border-[#008751]/30 hover:bg-[#008751]/5 transition-all text-xs font-bold text-[#008751] uppercase"><Building2 className="w-3 h-3" /> Transfer</button>
               </div>
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: Banks & Receipt */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Bank Transfer */}
          <div className="bg-white border border-[#008751]/8 rounded-2xl p-6 min-h-[280px]">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#008751] mb-5 flex items-center gap-2 border-b border-[#008751]/8 pb-2">
              <ChevronRight className="w-3 h-3" /> Bank Accounts (Click to copy)
            </h2>

            <div className="space-y-3 overflow-y-auto pr-1">
              {banks.length > 0 ? banks.map((bank, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    setSelectedBank(bank);
                    copyToClipboard(bank.accountNumber);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedBank?.accountNumber === bank.accountNumber ? 'bg-[#008751]/5 border-[#008751]/30 shadow-[0_4px_15px_rgba(0,135,81,0.08)]' : 'bg-slate-50 border-[#008751]/5 hover:border-[#008751]/15'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-[#008751] text-base tracking-wide uppercase">{bank.bankName}</h3>
                    <Building2 className={`w-5 h-5 transition-colors ${selectedBank?.accountNumber === bank.accountNumber ? "text-[#008751]" : "text-[#008751]/20"}`} />
                  </div>
                  
                  <div className="bg-white border border-[#008751]/8 p-3 rounded-lg flex justify-between items-center my-2">
                    <span className="font-mono text-xl font-black text-[#008751] tracking-widest">{bank.accountNumber}</span>
                    <div className="bg-[#008751]/8 p-1.5 rounded-lg">
                      <History className="text-[#008751] w-3 h-3" />
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-[#008751]/50 tracking-widest uppercase">{bank.accountName}</p>

                  {selectedBank?.accountNumber === bank.accountNumber && (
                    <div className="mt-3 pt-2 border-t border-[#008751]/10 text-center">
                      <span className="text-xs font-bold text-white bg-[#008751] px-4 py-1 rounded-full">
                        ✓ Copied! Make manual transfer.
                      </span>
                    </div>
                  )}
                </button>
              )) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-[#008751]/10 rounded-xl p-8">
                  <p className="text-[#008751]/30 font-bold uppercase tracking-widest text-center text-sm">No accounts available</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#008751]/8 text-center">
              <p className="text-[10px] font-bold tracking-widest text-[#008751]/35 uppercase">
                Use your <strong className="text-[#008751]">Matric Number</strong> as the payment reference.
              </p>
            </div>
          </div>

          {/* Receipt */}
          <div className="relative mx-auto w-full max-w-sm">
             <div className="bg-white text-[#008751] p-6 shadow-[0_4px_30px_rgba(0,135,81,0.06)] border border-[#008751]/10 rounded-2xl">
               <div className="text-center border-b border-[#008751]/10 pb-3 mb-3">
                 <h3 className="font-black text-lg tracking-tight text-[#008751]">PAYMENT RECEIPT</h3>
               </div>
               
               {lastPayment ? (
                 <div className="space-y-2 font-semibold text-sm">
                   <div className="flex justify-between border-b border-[#008751]/5 pb-2">
                     <span className="text-[#008751]/40">Student:</span>
                     <span className="text-[#008751]">{user.name}</span>
                   </div>
                   <div className="flex justify-between border-b border-[#008751]/5 pb-2">
                     <span className="text-[#008751]/40 uppercase">{lastPayment.type} Fee:</span>
                     <span className="font-black text-lg text-[#008751]">₦{lastPayment.amount.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between border-b border-[#008751]/5 pb-2">
                     <span className="text-[#008751]/40">Reference:</span>
                     <span className="font-mono text-xs text-[#008751]">{lastPayment.reference}</span>
                   </div>
                   <div className="flex justify-between border-b border-[#008751]/5 pb-2 items-center">
                     <span className="text-[#008751]/40">Status:</span>
                     <span className={`px-3 py-1 rounded-full text-white font-bold text-xs uppercase ${lastPayment.status === 'success' ? 'bg-[#008751]' : 'bg-amber-500'}`}>
                       {lastPayment.status === 'success' ? <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Active</span> : lastPayment.status}
                     </span>
                   </div>
                   <div className="flex justify-between pt-1">
                     <span className="text-[#008751]/40">Date:</span>
                     <span className="text-[#008751]">{new Date(lastPayment.created_at).toLocaleDateString()}</span>
                   </div>
                 </div>
               ) : (
                 <div className="py-8 text-center text-[#008751]/25 font-bold uppercase tracking-widest text-sm border-2 border-dashed border-[#008751]/10 rounded-xl">
                   No receipts yet
                 </div>
               )}
               
               <div className="mt-4 pt-3 border-t border-[#008751]/10 text-[8px] font-bold uppercase tracking-widest text-[#008751]/25 text-center">
                 Official institutional document • Unauthorized duplication prohibited
               </div>
               
               {lastPayment && (
                 <button 
                   onClick={() => window.print()} 
                   className="mt-4 w-full py-2.5 bg-[#008751]/5 text-[#008751] font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#008751]/10 transition border border-[#008751]/10"
                 >
                   <FileText className="w-4 h-4" /> Download Receipt
                 </button>
               )}
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN: History & Alerts */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Payment History */}
          <div className="bg-white border border-[#008751]/8 rounded-2xl p-5 h-64 flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#008751] mb-3 flex items-center gap-2 border-b border-[#008751]/8 pb-2">
              <ChevronRight className="w-3 h-3" /> History
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loading ? (
                <div className="h-full flex items-center justify-center"><div className="w-5 h-5 border-2 border-[#008751] border-t-transparent rounded-full animate-spin" /></div>
              ) : payments.length > 0 ? payments.map((p) => (
                <div key={p.id} className="bg-slate-50 border border-[#008751]/5 p-3 rounded-lg flex gap-3 hover:bg-[#008751]/3 transition-colors">
                  <div className="w-8 h-8 bg-white border border-[#008751]/10 rounded-lg flex items-center justify-center shrink-0">
                    <ShieldCheck className={`w-4 h-4 ${p.status === 'success' ? 'text-[#008751]' : 'text-amber-500'}`} />
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#008751]">{p.type}</p>
                      <p className="text-xs font-black text-[#008751]">₦{Number(p.amount).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-end mt-1">
                      <p className="text-[8px] font-mono text-[#008751]/30">{p.reference}</p>
                      <p className="text-[8px] font-medium text-[#008751]/25">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-[#008751]/8 rounded-xl">
                  <p className="text-[10px] text-[#008751]/25 font-bold uppercase tracking-widest text-center px-4">No records</p>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white border border-[#008751]/8 rounded-2xl p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#008751] mb-3 flex items-center gap-2 border-b border-[#008751]/8 pb-2">
              <ChevronRight className="w-3 h-3" /> Alerts
            </h2>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-[#008751]/5 mb-3">
              <Mail className="w-4 h-4 text-[#008751]" />
              <span className="text-[10px] font-bold text-[#008751] uppercase tracking-widest">Connection Stable</span>
            </div>
            {hasSuccessfulPayment(payments) && (
              <div className="bg-[#008751]/5 border border-[#008751]/15 rounded-lg p-4">
                <h4 className="text-sm font-black text-[#008751] mb-1 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#008751] animate-pulse" /> Payment Confirmed
                </h4>
                <p className="text-[11px] text-[#008751]/50 leading-relaxed font-medium">
                  Your transaction has been verified. An official receipt has been issued.
                </p>
              </div>
            )}
          </div>

          {/* Admin */}
          <div className="bg-white border border-[#008751]/8 rounded-2xl p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#008751] mb-3 flex items-center gap-2 border-b border-[#008751]/8 pb-2">
              <ChevronRight className="w-3 h-3" /> Admin
            </h2>
            <div className="space-y-2">
              <button disabled className="w-full flex items-center gap-3 bg-slate-50 border border-[#008751]/5 p-3 rounded-lg text-xs font-bold text-[#008751]/25 uppercase tracking-widest cursor-not-allowed">
                <Settings className="w-4 h-4" /> Manage Vaults (Locked)
              </button>
              <button disabled className="w-full flex items-center gap-3 bg-slate-50 border border-[#008751]/5 p-3 rounded-lg text-xs font-bold text-[#008751]/25 uppercase tracking-widest cursor-not-allowed">
                <History className="w-4 h-4" /> Manual Sweeps (Locked)
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

const hasSuccessfulPayment = (payments: Payment[]) => payments.some(p => p.status === 'success');

export default PaymentPortal;
