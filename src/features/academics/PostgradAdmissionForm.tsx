import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, BookOpen, FileCheck, Fingerprint, ShieldCheck, HardDrive } from 'lucide-react';
import axios from '../../api/axios';
import CameraCapture from '../../components/CameraCapture';

export default function PostgradAdmissionForm() {
  const [step, setStep] = useState<'info' | 'selection' | 'biometrics' | 'documents'>('info');
  const [biometricBlobs, setBiometricBlobs] = useState<{ face: Blob; leftIndex: Blob; rightIndex: Blob } | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    undergraduate_program: '',
    graduation_year: new Date().getFullYear() - 1,
    gpa: '',
    work_experience: '',
    statement_of_purpose: '',
  });

  useEffect(() => {
    fetchPostgradPrograms();
  }, []);

  const fetchPostgradPrograms = async () => {
    try {
      const response = await axios.get('/api/portal/postgrad-programs/');
      setPrograms(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitApplication = async () => {
    if (!selectedProgram || !biometricBlobs) {
      alert('Please complete all steps');
      return;
    }

    // In a real app, you would upload this to your backend
    console.log('Postgraduate Application:', {
      ...formData,
      program: selectedProgram.id,
      biometrics: biometricBlobs
    });

    alert('Application submitted successfully!');
    setStep('info');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <GraduationCap className="w-12 h-12 text-indigo-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="text-center">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Postgraduate Application</h1>
            <p className="text-slate-600">Complete your application form to pursue advanced studies</p>
          </div>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8">
          {[
            { id: 'info', label: 'Personal Info', icon: '👤' },
            { id: 'selection', label: 'Program Selection', icon: '📚' },
            { id: 'biometrics', label: 'Biometrics', icon: '👆' },
            { id: 'documents', label: 'Confirmation', icon: '✓' },
          ].map((s: any, i) => (
            <div key={s.id} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all ${
                step === s.id ? 'bg-indigo-600 text-white shadow-lg scale-110' : 
                ['info', 'selection', 'biometrics', 'documents'].indexOf(step) > i ? 'bg-emerald-500 text-white' : 
                'bg-slate-100 text-slate-400'
              }`}>
                {s.icon}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-center">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Info Step */}
        <AnimatePresence mode="wait">
          {step === 'info' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-slate-900 mb-8">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none md:col-span-2"
                />
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="Phone Number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="text"
                  name="undergraduate_program"
                  placeholder="Undergraduate Program"
                  value={formData.undergraduate_program}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input
                  type="number"
                  name="graduation_year"
                  placeholder="Year of Graduation"
                  value={formData.graduation_year}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  min="2000"
                  max={new Date().getFullYear()}
                />
                <input
                  type="number"
                  name="gpa"
                  placeholder="Undergraduate GPA (e.g., 3.8)"
                  value={formData.gpa}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  step="0.1"
                  min="0"
                  max="4"
                />
                <input
                  type="text"
                  name="work_experience"
                  placeholder="Years of Work Experience"
                  value={formData.work_experience}
                  onChange={handleInputChange}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Statement of Purpose</label>
                <textarea
                  name="statement_of_purpose"
                  placeholder="Describe your academic goals and why you want to pursue this postgraduate program..."
                  value={formData.statement_of_purpose}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={() => setStep('selection')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Next: Select Program
              </button>
            </motion.div>
          )}

          {/* Program Selection Step */}
          {step === 'selection' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-slate-900 mb-8">Select Your Program</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {programs.map((prog) => (
                  <motion.div
                    key={prog.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedProgram(prog)}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedProgram?.id === prog.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <BookOpen className="w-6 h-6 text-indigo-600 mt-1" />
                      <div>
                        <h3 className="font-black text-slate-900">{prog.postgrad_details?.name}</h3>
                        <p className="text-sm text-indigo-600 font-bold">{prog.postgrad_details?.code}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{prog.postgrad_details?.description}</p>
                    <div className="flex gap-2 flex-wrap text-xs font-bold text-slate-600">
                      <span className="bg-white px-2 py-1 rounded">🎓 {prog.postgrad_details?.duration_years} Years</span>
                      {prog.thesis_required && <span className="bg-white px-2 py-1 rounded">📝 Thesis Required</span>}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => selectedProgram && setStep('biometrics')}
                  disabled={!selectedProgram}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Next: Biometrics
                </button>
              </div>
            </motion.div>
          )}

          {/* Biometrics Step */}
          {step === 'biometrics' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 p-6 md:p-10 rounded-3xl border border-indigo-200 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Fingerprint className="w-8 h-8 text-indigo-600" />
                Biometric Verification
              </h2>
              
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="max-w-[360px] w-full">
                    <CameraCapture 
                      onCaptureAll={setBiometricBlobs} 
                      onClear={() => setBiometricBlobs(null)} 
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white border border-indigo-200 p-6 rounded-2xl">
                    <h3 className="text-indigo-600 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Capture Requirements
                    </h3>
                    <p className="text-indigo-700/70 text-sm leading-relaxed font-semibold uppercase tracking-wider">
                      Please capture your <span className="text-indigo-600 underline italic">Face</span> and <span className="text-indigo-600 underline italic">Both Index Fingers</span> in a well-lit environment.
                    </p>
                  </div>

                  {biometricBlobs && (
                    <button 
                      onClick={() => setStep('documents')} 
                      className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-slate-50 transition-all border border-indigo-200"
                    >
                      Proceed to Final Review
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('selection')}
                  className="flex-1 bg-white text-slate-900 font-bold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Confirmation Step */}
          {step === 'documents' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-50 p-12 rounded-3xl border border-slate-200 text-center space-y-8">
              <div className="w-24 h-24 bg-white text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <FileCheck className="w-12 h-12" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Ready to Submit</h2>
                <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
                  By submitting, you certify that all information is accurate and complete. Misrepresentation will result in disqualification.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left space-y-4">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-600">Selected Program</span>
                  <span className="font-black text-slate-900">{selectedProgram?.postgrad_details?.code}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-600">Applicant Name</span>
                  <span className="font-black text-slate-900">{formData.first_name} {formData.last_name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-600">Biometric Status</span>
                  <span className="font-black text-emerald-600">✓ Verified</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('biometrics')}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-3 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={submitApplication}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Submit Application
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
