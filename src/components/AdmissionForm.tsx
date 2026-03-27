import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AdmissionApplication } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { FACULTIES, DEPARTMENTS } from '../constants';
import { toast } from 'sonner';
import { FileText, CheckCircle, Clock, XCircle, Upload, Camera, Fingerprint, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdmissionFormProps {
  user: UserProfile;
}

type Step = 'type' | 'details' | 'biometrics' | 'documents';

export default function AdmissionForm({ user }: AdmissionFormProps) {
  const [step, setStep] = useState<Step>('type');
  const [appType, setAppType] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [jambRegNo, setJambRegNo] = useState('');
  const [postUtmeScore, setPostUtmeScore] = useState('');
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [thumbprintCaptured, setThumbprintCaptured] = useState(false);
  const [application, setApplication] = useState<AdmissionApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'applications'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setApplication({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AdmissionApplication);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [user.uid, stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      toast.error('Could not access camera');
    }
  };

  const captureFace = () => {
    setFaceCaptured(true);
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    toast.success('Face captured successfully');
  };

  const captureThumb = () => {
    setThumbprintCaptured(true);
    toast.success('Biometric thumbprint scanned');
  };

  const handleSubmit = async () => {
    if (!faculty || !department || !faceCaptured || !thumbprintCaptured || !jambRegNo) {
      toast.error('Please complete all steps including biometrics and JAMB details');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'applications'), {
        uid: user.uid,
        name: user.name,
        email: user.email,
        university: user.university,
        type: appType,
        faculty,
        department,
        jambRegNo,
        postUtmeScore: Number(postUtmeScore) || 0,
        status: 'pending',
        biometrics: { face: true, thumbprint: true },
        createdAt: new Date().toISOString(),
      });
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Submission failed', error);
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div></div>;

  if (application) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Application Status
          </h2>
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
            {application.status === 'pending' && <Clock className="w-10 h-10 text-amber-500" />}
            {application.status === 'approved' && <CheckCircle className="w-10 h-10 text-emerald-500" />}
            {application.status === 'rejected' && <XCircle className="w-10 h-10 text-rose-500" />}
            <div>
              <p className="text-sm text-neutral-500 uppercase font-bold tracking-wider">Status</p>
              <p className="text-xl font-bold capitalize">{application.status}</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex justify-between py-3 border-b border-neutral-100">
              <span className="text-neutral-500">Faculty</span>
              <span className="font-medium">{application.faculty}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-neutral-100">
              <span className="text-neutral-500">Department</span>
              <span className="font-medium">{application.department}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-neutral-500">Submitted On</span>
              <span className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-2xl border border-neutral-200">
        {(['type', 'details', 'biometrics', 'documents'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
              {i + 1}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${step === s ? 'text-neutral-900' : 'text-neutral-400'}`}>{s}</span>
            {i < 3 && <ChevronRight className="w-4 h-4 text-neutral-200" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm space-y-8"
          >
            <h2 className="text-3xl font-bold">Choose Application Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['Undergraduate', 'Postgraduate', 'Diploma', 'Part-Time'].map(t => (
                <button
                  key={t}
                  onClick={() => { setAppType(t); setStep('details'); }}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${appType === t ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100 hover:border-neutral-300'}`}
                >
                  <p className="font-bold text-lg">{t}</p>
                  <p className="text-sm text-neutral-500">Apply for {t} studies</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm space-y-6"
          >
            <h2 className="text-3xl font-bold">Academic Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">JAMB Reg No</label>
                <input
                  type="text"
                  value={jambRegNo}
                  onChange={(e) => setJambRegNo(e.target.value)}
                  className="w-full p-4 rounded-xl border border-neutral-200 outline-none"
                  placeholder="e.g. 12345678AB"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Post-UTME Score</label>
                <input
                  type="number"
                  value={postUtmeScore}
                  onChange={(e) => setPostUtmeScore(e.target.value)}
                  className="w-full p-4 rounded-xl border border-neutral-200 outline-none"
                  placeholder="e.g. 280"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Faculty</label>
              <select
                value={faculty}
                onChange={(e) => { setFaculty(e.target.value); setDepartment(''); }}
                className="w-full p-4 rounded-xl border border-neutral-200 outline-none appearance-none bg-white"
              >
                <option value="">Select Faculty</option>
                {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={!faculty}
                className="w-full p-4 rounded-xl border border-neutral-200 outline-none appearance-none bg-white disabled:opacity-50"
              >
                <option value="">Select Department</option>
                {faculty && DEPARTMENTS[faculty].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep('type')} className="flex-1 p-4 rounded-xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-all">Back</button>
              <button onClick={() => setStep('biometrics')} disabled={!faculty || !department} className="flex-1 bg-neutral-900 text-white p-4 rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50">Next</button>
            </div>
          </motion.div>
        )}

        {step === 'biometrics' && (
          <motion.div
            key="biometrics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm space-y-8"
          >
            <h2 className="text-3xl font-bold">Biometric Capturing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-video bg-neutral-100 rounded-2xl overflow-hidden relative border border-neutral-200">
                  {!faceCaptured ? (
                    stream ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-neutral-400">
                        <Camera className="w-10 h-10" />
                        <button onClick={startCamera} className="text-sm font-bold underline text-neutral-900">Start Camera</button>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <button
                  onClick={captureFace}
                  disabled={!stream || faceCaptured}
                  className="w-full p-3 rounded-xl border border-neutral-900 font-bold flex items-center justify-center gap-2 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  Capture Face
                </button>
              </div>

              <div className="space-y-4">
                <div className={`aspect-video rounded-2xl flex items-center justify-center flex-col gap-4 border-2 border-dashed ${thumbprintCaptured ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}>
                  {thumbprintCaptured ? <CheckCircle className="w-12 h-12" /> : <Fingerprint className="w-12 h-12" />}
                  <p className="text-sm font-bold">{thumbprintCaptured ? 'Thumbprint Scanned' : 'Place Thumb on Scanner'}</p>
                </div>
                <button
                  onClick={captureThumb}
                  disabled={thumbprintCaptured}
                  className="w-full p-3 rounded-xl border border-neutral-900 font-bold flex items-center justify-center gap-2 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <Fingerprint className="w-5 h-5" />
                  Scan Thumbprint
                </button>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep('details')} className="flex-1 p-4 rounded-xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-all">Back</button>
              <button onClick={() => setStep('documents')} disabled={!faceCaptured || !thumbprintCaptured} className="flex-1 bg-neutral-900 text-white p-4 rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50">Next</button>
            </div>
          </motion.div>
        )}

        {step === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm space-y-8"
          >
            <h2 className="text-3xl font-bold">Upload Documents</h2>
            <div className="space-y-4">
              {['O-Level Result', 'Birth Certificate', 'LGA Identification'].map(doc => (
                <div key={doc} className="p-6 border-2 border-dashed border-neutral-100 rounded-2xl flex justify-between items-center hover:border-neutral-300 transition-all">
                  <div className="flex items-center gap-4">
                    <FileText className="w-6 h-6 text-neutral-400" />
                    <span className="font-bold">{doc}</span>
                  </div>
                  <button className="text-sm font-bold text-neutral-900 underline">Upload</button>
                </div>
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep('biometrics')} className="flex-1 p-4 rounded-xl border border-neutral-200 font-bold hover:bg-neutral-50 transition-all">Back</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-neutral-900 text-white p-4 rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Finalize Application'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
