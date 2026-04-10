import React, { useState, useEffect } from 'react';
import { UserProfile, AdmissionApplication } from '../../types';
import api from '../../api/axios';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FACULTIES, DEPARTMENTS } from '../../constants';
import { toast } from 'sonner';
import { FileText, CheckCircle, Clock, XCircle, Upload, AlertCircle, ArrowRight, User, GraduationCap, ShieldCheck, MapPin, Phone, HeartPulse, HardDrive, Fingerprint, Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CameraCapture from '../../components/CameraCapture';

interface AdmissionFormProps {
  user: UserProfile;
}

type Step = 'program' | 'biodata' | 'kin' | 'academic' | 'biometrics' | 'documents';

const OLEVEL_SUBJECTS = ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature in English', 'CRK/IRK', 'Agricultural Science', 'Geography', 'Further Mathematics', 'Civic Education'];
const GRADES = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'];

export default function AdmissionForm({ user }: AdmissionFormProps) {
  const [step, setStep] = useState<Step>('program');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<AdmissionApplication | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: '',
    faculty: '',
    department: '',
    gender: 'Male' as 'Male' | 'Female',
    dateOfBirth: '',
    phoneNumber: '',
    stateOfOrigin: '',
    lga: '',
    permanentAddress: '',
    bloodGroup: '',
    genotype: '',
    nokName: '',
    nokPhone: '',
    nokRelation: '',
    nokAddress: '',
    jambRegNo: '',
    jambScore: 0,
    jambSubjects: [
      { subject: '', score: 0 },
      { subject: '', score: 0 },
      { subject: '', score: 0 },
      { subject: '', score: 0 },
    ],
    olevelResults: [
      { subject: '', grade: '' },
      { subject: '', grade: '' },
      { subject: '', grade: '' },
      { subject: '', grade: '' },
      { subject: '', grade: '' },
    ],
    age: 18,
    locationCity: ''
  });

  // Biometric Blobs
  const [biometricBlobs, setBiometricBlobs] = useState<{ face: Blob; leftIndex: Blob; rightIndex: Blob } | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await api.get('/academics/applications/');
        if (response.data.length > 0) {
          setApplication(response.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch application:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleSubmit = async () => {
    if (!biometricBlobs) {
      toast.error('Biometric data required');
      setStep('biometrics');
      return;
    }

    setSubmitting(true);
    try {
      // Keep Firebase for uploads for now as backend might not support binary yet
      const uploadBiometric = async (blob: Blob, path: string) => {
        const fileRef = ref(storage, `applications/${user.uid}/${path}.jpg`);
        await uploadBytes(fileRef, blob);
        return getDownloadURL(fileRef);
      };

      const [faceUrl, leftIndexFingerUrl, rightIndexFingerUrl] = await Promise.all([
        uploadBiometric(biometricBlobs.face, 'face'),
        uploadBiometric(biometricBlobs.leftIndex, 'left_index'),
        uploadBiometric(biometricBlobs.rightIndex, 'right_index'),
      ]);

      // Resolve Faculty/Department IDs
      const portalRes = await api.get('/portal/faculties/');
      const faculty = portalRes.data.find((f: any) => f.name === formData.faculty);
      const department = faculty?.departments?.find((d: any) => d.name === formData.department);

      const payload = {
        type: formData.type,
        faculty: faculty?.id,
        department: department?.id,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
        phone_number: formData.phoneNumber,
        state_of_origin: formData.stateOfOrigin,
        lga: formData.lga,
        permanent_address: formData.permanentAddress,
        nok_name: formData.nokName,
        nok_phone: formData.nokPhone,
        nok_relation: formData.nokRelation,
        jamb_reg_no: formData.jambRegNo,
        jamb_score: formData.jambScore,
        face_url: faceUrl,
        left_index_finger_url: leftIndexFingerUrl,
        right_index_finger_url: rightIndexFingerUrl,
        status: 'pending',
      };

      await api.post('/academics/applications/', payload);

      toast.success('Professional Application Submitted');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Submission failed. Check network.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" /></div>;

  if (application) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-[#008751]/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-8000/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
          <div className="relative z-10 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
               <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-[#008751] tracking-tighter uppercase">Application</h2>
            <div className="flex items-center justify-center gap-4">
              <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                application.status === 'pending' ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                application.status === 'approved' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-rose-100 text-rose-600 border border-rose-200'
              }`}>
                Status: {application.status}
              </span>
            </div>
            <p className="text-[#008751]/40 text-xs font-medium max-w-sm mx-auto leading-relaxed italic">
              Your application is currently being analyzed by the Central Admission Committee. Credentials and biometrics are under verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stepItems = [
    { id: 'program', label: 'Degree', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'biodata', label: 'Bio Data', icon: <User className="w-4 h-4" /> },
    { id: 'kin', label: 'Next of Kin', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'academic', label: 'Records', icon: <FileText className="w-4 h-4" /> },
    { id: 'biometrics', label: 'Biometrics', icon: <Fingerprint className="w-4 h-4" /> },
    { id: 'documents', label: 'Finalize', icon: <HardDrive className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* PROGRESS TRACKER */}
      <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2.5rem] border border-[#008751]/10">
        {stepItems.map((s, i) => (
          <div key={s.id} className="flex flex-col items-center gap-2 flex-1 relative">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${
              step === s.id ? 'bg-[#008751] text-white scale-110 shadow-lg' :
              stepItems.findIndex(x => x.id === step) > i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
            }`}>
              {stepItems.findIndex(x => x.id === step) > i ? <CheckCircle className="w-5 h-5" /> : s.icon}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-tighter ${step === s.id ? 'text-[#008751] opacity-100' : 'text-[#008751]/40 opacity-40'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'program' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-50 p-12 rounded-[3.5rem] border border-[#008751]/10">
            <h2 className="text-2xl font-black text-[#008751] uppercase tracking-tighter italic mb-8">Select Admission Stream</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Undergraduate Full-Time', 'Direct Entry (200L)', 'Postgraduate (Masters)', 'Distance Learning (CDL)'].map(t => (
                <button
                  key={t}
                  onClick={() => { setFormData({ ...formData, type: t }); setStep('biodata'); }}
                  className="p-8 border-2 border-slate-50 rounded-3xl text-left hover:border-[#008751] hover:bg-white transition-all group"
                >
                  <p className="text-[#008751] text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-40 group-hover:opacity-100">Standard Program</p>
                  <p className="text-lg font-black text-[#008751] uppercase tracking-tighter italic">{t}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'biodata' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-slate-50 p-10 rounded-[3.5rem] border border-[#008751]/10 space-y-8">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-white rounded-xl text-[#008751]"><User className="w-6 h-6" /></div>
               <h2 className="text-2xl font-black text-[#008751] tracking-tighter uppercase italic">Biological Identity</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest pl-2">Faculty of Choice</label>
                <select 
                  value={formData.faculty} 
                  onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold text-[#008751] focus:ring-2 ring-green-500 outline-none"
                >
                   <option value="">-- Choose Faculty --</option>
                   {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest pl-2">Department</label>
                <select 
                  value={formData.department} 
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold text-[#008751] focus:ring-2 ring-green-500 outline-none"
                >
                   <option value="">-- Choose Department --</option>
                   {DEPARTMENTS[formData.faculty as keyof typeof DEPARTMENTS]?.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest pl-2">Medical Gender</label>
                <div className="flex gap-4">
                  {['Male', 'Female'].map(g => (
                    <button key={g} onClick={() => setFormData({ ...formData, gender: g as any })} className={`flex-1 p-4 rounded-2xl font-black text-xs transition-all ${formData.gender === g ? 'bg-white text-[#008751] border border-[#008751]/15' : 'bg-slate-50 text-[#008751]/40 border border-[#008751]/10'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest pl-2">Date of Birth</label>
                <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold text-[#008751] focus:ring-2 ring-green-500 outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest pl-2">Mobile Terminal</label>
                <input placeholder="+234..." value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold text-[#008751] focus:ring-2 ring-green-500 outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest pl-2">State of Origin</label>
                <input placeholder="E.g. Edo State" value={formData.stateOfOrigin} onChange={e => setFormData({ ...formData, stateOfOrigin: e.target.value })} className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold text-[#008751] focus:ring-2 ring-green-500 outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest pl-2">City / Location</label>
                <input placeholder="E.g. Benin City" value={formData.locationCity} onChange={e => setFormData({ ...formData, locationCity: e.target.value })} className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold text-[#008751] focus:ring-2 ring-green-500 outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest pl-2">Biological Age</label>
                <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: Number(e.target.value) })} className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold text-[#008751] focus:ring-2 ring-green-500 outline-none" />
              </div>
            </div>

            <button onClick={() => setStep('kin')} className="w-full md:w-fit bg-[#008751] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-tighter italic text-sm hover:scale-105 active:scale-95 transition-all">
              Proceed to Registry Data
            </button>
          </motion.div>
        )}

        {step === 'kin' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-slate-50 p-10 rounded-[3.5rem] border border-[#008751]/10 space-y-8">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><ShieldCheck className="w-6 h-6" /></div>
               <h2 className="text-2xl font-black text-[#008751] tracking-tighter uppercase italic">Emergency Contact (Next of Kin)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input placeholder="Full Name of Kin" value={formData.nokName} onChange={e => setFormData({...formData, nokName: e.target.value})} className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold" />
              <input placeholder="Kin Relation" value={formData.nokRelation} onChange={e => setFormData({...formData, nokRelation: e.target.value})} className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold" />
              <input placeholder="Kin Phone Number" value={formData.nokPhone} onChange={e => setFormData({...formData, nokPhone: e.target.value})} className="w-full bg-slate-50 border border-[#008751]/10 p-4 rounded-2xl font-bold" />
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setStep('biodata')} className="flex-1 bg-slate-100 text-[#008751]/60 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Back</button>
              <button onClick={() => setStep('academic')} className="flex-[2] bg-[#008751] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Next Step</button>
            </div>
          </motion.div>
        )}

        {step === 'academic' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-slate-50 p-10 rounded-[3.5rem] border border-[#008751]/10 space-y-10">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><GraduationCap className="w-6 h-6" /></div>
               <h2 className="text-2xl font-black text-[#008751] tracking-tighter uppercase italic">Academic Records</h2>
            </div>

            {/* JAMB SECTION */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                 <h3 className="text-xs font-black text-[#008751] uppercase tracking-widest italic">JAMB Utme Verification</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input placeholder="JAMB Registration Number" value={formData.jambRegNo} onChange={e => setFormData({...formData, jambRegNo: e.target.value})} className="w-full bg-slate-50 border-2 border-[#008751]/10 p-4 rounded-2xl font-black text-xs" />
                 <input placeholder="Total Aggregate Score" type="number" value={formData.jambScore} onChange={e => setFormData({...formData, jambScore: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-indigo-100 p-4 rounded-2xl font-black text-xs text-[#008751]" />
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.jambSubjects.map((js, idx) => (
                    <div key={idx} className="space-y-2">
                       <input placeholder={`Subject ${idx+1}`} value={js.subject} onChange={e => {
                         const next = [...formData.jambSubjects];
                         next[idx].subject = e.target.value;
                         setFormData({...formData, jambSubjects: next});
                       }} className="w-full bg-slate-50 border border-[#008751]/10 p-3 rounded-xl text-[10px] font-bold" />
                       <input placeholder="Score" type="number" value={js.score} onChange={e => {
                         const next = [...formData.jambSubjects];
                         next[idx].score = Number(e.target.value);
                         setFormData({...formData, jambSubjects: next});
                       }} className="w-full bg-slate-100 p-3 rounded-xl text-[10px] font-bold" />
                    </div>
                  ))}
               </div>
            </div>

            {/* O-LEVEL SECTION */}
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-white rounded-full" />
                 <h3 className="text-xs font-black text-[#008751] uppercase tracking-widest italic">Secondary School (SSCE) Results</h3>
               </div>

               <div className="grid grid-cols-1 gap-2">
                  {formData.olevelResults.map((ol, idx) => (
                    <div key={idx} className="flex gap-2">
                       <select value={ol.subject} onChange={e => {
                         const next = [...formData.olevelResults];
                         next[idx].subject = e.target.value;
                         setFormData({...formData, olevelResults: next});
                       }} className="flex-1 bg-slate-50 border border-[#008751]/10 p-3 rounded-xl text-[10px] font-bold">
                          <option value="">Select Subject</option>
                          {OLEVEL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                       <select value={ol.grade} onChange={e => {
                         const next = [...formData.olevelResults];
                         next[idx].grade = e.target.value;
                         setFormData({...formData, olevelResults: next});
                       }} className="w-24 bg-slate-100 border border-[#008751]/15 p-3 rounded-xl text-[10px] font-black">
                          <option value="">Grade</option>
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                    </div>
                  ))}
                  <button onClick={() => setFormData({...formData, olevelResults: [...formData.olevelResults, { subject: '', grade: '' }]})} className="text-[10px] font-black text-[#008751] uppercase tracking-widest pt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Add More Subjects
                  </button>
               </div>
            </div>

            <button onClick={() => setStep('biometrics')} className="w-full bg-white text-[#008751] py-6 rounded-3xl font-black uppercase text-sm tracking-widest hover:bg-white transition-all border border-[#008751]/10">
               Initialize Biometrics
            </button>
          </motion.div>
        )}

        {step === 'biometrics' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#008751] p-10 rounded-[3.5rem] border border-[#008751]/8 space-y-8">
            <div className="flex items-center gap-4 text-white">
               <div className="p-3 bg-[#008751]/5 rounded-xl"><Fingerprint className="w-6 h-6" /></div>
               <h2 className="text-2xl font-black tracking-tighter uppercase italic">Secure Biometric Sequencing</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 flex justify-center">
                <div className="max-w-[280px] w-full">
                  <CameraCapture 
                    onCaptureAll={setBiometricBlobs} 
                    onClear={() => setBiometricBlobs(null)} 
                  />
                </div>
              </div>
              
              <div className="md:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-[#008751]/8">
                  <h3 className="text-[#008751] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Integrity Verification
                  </h3>
                  <p className="text-white/70 text-[10px] leading-relaxed font-bold uppercase tracking-wider">
                    Please ensure you are in a well-lit environment. Our Digital Registry requires a clear Capture of your 
                    <span className="text-[#008751] mx-1 underline italic">Face</span> and 
                    <span className="text-[#008751] mx-1 underline italic">Both Index Fingers</span>.
                  </p>
                </div>

                {biometricBlobs && (
                  <button 
                    onClick={() => setStep('documents')} 
                    className="w-full bg-white text-[#008751] py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all border border-[#008751]/10"
                  >
                    Continue to Finalization
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'documents' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 p-12 rounded-[4rem] border border-[#008751]/15 text-center space-y-8">
             <div className="w-24 h-24 bg-white text-[#008751] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-12 h-12" />
             </div>
             <div className="space-y-4">
                <h2 className="text-4xl font-black text-[#008751] tracking-tighter uppercase italic">Final Attestation</h2>
                <p className="text-[#008751]/40 text-xs font-semibold max-w-lg mx-auto leading-relaxed">
                  By clicking submit, you certify that all information provided (Bio-Data, Academic Records, and Triple Biometrics) is accurate. 
                  Misrepresentation will result in immediate disqualification.
                </p>
             </div>

             <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-[#008751]/10 space-y-4">
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-2xl border border-[#008751]/15">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><HardDrive className="w-5 h-5" /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#008751]/45">Triple Biometric Thread</span>
                   </div>
                   <CheckCircle className="text-emerald-500 w-5 h-5" />
                </div>
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-2xl border border-[#008751]/15">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-white text-[#008751] rounded-lg"><GraduationCap className="w-5 h-5" /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#008751]/45">Academic Records Verified</span>
                   </div>
                   <CheckCircle className="text-[#008751] w-5 h-5" />
                </div>
             </div>

             <button
               onClick={handleSubmit}
               disabled={submitting}
               className="w-full bg-[#008751] text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
             >
               {submitting ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   Processing Registry Upload...
                 </>
               ) : (
                 <>
                   Final Submission <ArrowRight className="w-6 h-6" />
                 </>
               )}
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



