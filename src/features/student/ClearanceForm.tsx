import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserProfile, ClearanceRecord, ClearanceStatus } from '../../types';
import { FileUp, CheckCircle2, Clock, AlertCircle, FileText, Landmark, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ClearanceFormProps {
  user: UserProfile;
}

export default function ClearanceForm({ user }: ClearanceFormProps) {
  const [clearance, setClearance] = useState<ClearanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const fetchClearance = async () => {
      try {
        const response = await api.get('/academics/clearances/');
        if (response.data.length > 0) {
          const c = response.data[0];
          setClearance({
            id: c.id,
            uid: c.user,
            status: c.status,
            affidavitUrl: c.affidavit_url,
            lgaOriginUrl: c.lga_origin_url,
            ageDeclarationUrl: c.age_declaration_url,
            updatedAt: c.updated_at
          } as ClearanceRecord);
        }
      } catch (error) {
        console.error('Failed to fetch clearance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClearance();
  }, [user.uid]);

  const handleFileUpload = async (type: 'affidavit' | 'lga' | 'age') => {
    setUploading(type);
    
    // Simulate upload delay (assets still mock-uploaded for now)
    await new Promise(resolve => setTimeout(resolve, 1500));
    const dummyUrl = `https://generated-doc-url.com/${type}_${user.uid}.pdf`;
    
    try {
      const payload: any = {
        status: 'uploaded'
      };
      if (type === 'affidavit') payload.affidavit_url = dummyUrl;
      if (type === 'lga') payload.lga_origin_url = dummyUrl;
      if (type === 'age') payload.age_declaration_url = dummyUrl;
      
      await api.post('/academics/clearances/', payload);
      
      toast.success(`${type.toUpperCase()} document uploaded successfully!`);
      // Refresh
      window.location.reload();
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Clock className="animate-spin text-emerald-500" /></div>;

  const docs = [
    { id: 'affidavit', label: 'Court Affidavit', icon: <FileText />, url: clearance?.affidavitUrl },
    { id: 'lga', label: 'LGA Origin Certificate', icon: <Landmark />, url: clearance?.lgaOriginUrl },
    { id: 'age', label: 'Age Declaration', icon: <UserCheck />, url: clearance?.ageDeclarationUrl },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 backdrop-blur-xl p-10 rounded-[3.5rem] border border-[#008751]/8 shadow-md">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-xl font-black text-[#008751] uppercase tracking-tight italic flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-[#008751]/5">
                <FileUp className="w-6 h-6 text-[#008751]" />
              </div>
              Mandatory Document Clearance
            </h3>
            <p className="text-emerald-500/50 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Session 2025/2026 Verification</p>
          </div>
          
          <div className={`px-5 py-2.5 rounded-2xl flex items-center gap-3 border ${
            clearance?.status === 'verified' ? 'bg-emerald-500/20 border-emerald-500/40' :
            clearance?.status === 'uploaded' ? 'bg-amber-500/20 border-amber-500/40' :
            'bg-[#008751]/3 border-[#008751]/8'
          }`}>
             <div className={`w-2 h-2 rounded-full animate-pulse ${
               clearance?.status === 'verified' ? 'bg-emerald-400' :
               clearance?.status === 'uploaded' ? 'bg-amber-400' : 'bg-white/20'
             }`} />
             <span className={`text-[10px] font-black uppercase tracking-widest ${
               clearance?.status === 'verified' ? 'text-[#008751]' :
               clearance?.status === 'uploaded' ? 'text-amber-400' : 'text-[#008751]/35'
             }`}>
               {clearance?.status ? clearance.status.toUpperCase() : 'NOT STARTED'}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-[#008751]/3 border border-[#008751]/8 rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-6 group hover:bg-emerald-500/5 transition-all">
              <div className={`p-5 rounded-2xl transition-colors ${doc.url ? 'bg-emerald-500/20 text-[#008751]' : 'bg-[#008751]/3 text-[#008751]/15'}`}>
                {React.cloneElement(doc.icon as React.ReactElement, { className: 'w-8 h-8' })}
              </div>
              <div>
                <p className="text-sm font-black text-[#008751] italic uppercase tracking-tight">{doc.label}</p>
                <p className="text-[8px] text-[#008751]/25 uppercase font-black tracking-widest mt-1">Required for Registry</p>
              </div>
              
              {doc.url ? (
                 <div className="flex flex-col items-center gap-3">
                   <div className="flex items-center gap-2 text-[#008751] font-black text-[9px] uppercase tracking-widest">
                     <CheckCircle2 className="w-4 h-4" /> Uploaded
                   </div>
                   <button 
                     onClick={() => handleFileUpload(doc.id as any)}
                     disabled={uploading === doc.id}
                     className="text-[8px] text-[#008751]/35 hover:text-[#008751] uppercase font-black tracking-widest underline decoration-2 underline-offset-4"
                   >
                     {uploading === doc.id ? 'Refining...' : 'Replace File'}
                   </button>
                 </div>
              ) : (
                <button 
                  onClick={() => handleFileUpload(doc.id as any)}
                  disabled={!!uploading}
                  className="w-full bg-slate-50 text-[#008751] py-4 rounded-2xl font-black text-[10px] hover:bg-emerald-400 transition-all shadow-xl active:scale-95 uppercase tracking-widest italic flex items-center justify-center gap-3"
                >
                  {uploading === doc.id ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileUp className="w-4 h-4" />
                  )}
                  {uploading === doc.id ? 'Uploading...' : 'Upload Now'}
                </button>
              )}
            </div>
          ))}
        </div>

        {clearance?.status === 'uploaded' && (
          <div className="mt-10 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center gap-5">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
            <p className="text-[10px] text-amber-100/60 font-bold leading-relaxed uppercase tracking-wider">
              Documents are currently under review by the university registrar. You will be notified once manual verification is complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



