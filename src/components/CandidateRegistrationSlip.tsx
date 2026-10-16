import React from 'react';
import { Printer, CheckCircle, ShieldCheck, User, GraduationCap, Building2, Calendar, FileText, X } from 'lucide-react';

export interface CandidateData {
  candidateId?: string;
  name: string;
  email: string;
  role?: string;
  registrationDate?: string;
  faculty?: string;
  department?: string;
  programType?: string;
  jambRegNo?: string;
  jambScore?: number;
  phoneNumber?: string;
  gender?: string;
  status?: string;
}

interface CandidateRegistrationSlipProps {
  candidate: CandidateData;
  onClose?: () => void;
}

export default function CandidateRegistrationSlip({ candidate, onClose }: CandidateRegistrationSlipProps) {
  const regId = candidate.candidateId || `LUK-REG-${Math.floor(100000 + Math.random() * 900000)}`;
  const regDate = candidate.registrationDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      {/* Container */}
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-[#008751]/10 my-8">

        {/* Action Header - Hidden during print */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">Candidate Registration Slip (PDF Printout)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-[#008751] hover:bg-[#006e41] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-candidate-slip" className="p-8 md:p-12 space-y-8 bg-white text-slate-900">

          {/* Document Print CSS Styles */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-candidate-slip, #printable-candidate-slip * {
                visibility: visible;
              }
              #printable-candidate-slip {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* Institutional Header */}
          <div className="border-b-2 border-[#008751] pb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#008751] text-white flex items-center justify-center font-black text-2xl shadow-md">
                LUK
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-[#008751] uppercase tracking-tight">
                  Federal University Lukke
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Office of the Registrar • Academic Registry Division
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Official Candidate Registration & Enrollment Slip
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-[#008751] border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest mb-1">
                {candidate.status || 'Verified Candidate'}
              </span>
              <p className="text-[11px] font-bold text-slate-600 font-mono">Ref: {regId}</p>
              <p className="text-[10px] text-slate-400">Date: {regDate}</p>
            </div>
          </div>

          {/* Candidate Profile Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Photo & Security Badge */}
            <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-center">
              <div className="w-28 h-32 bg-slate-200 border-2 border-[#008751]/20 rounded-xl flex flex-col items-center justify-center text-slate-400">
                <User className="w-12 h-12 stroke-[1.5]" />
                <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-slate-500">Candidate Photo</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-[#008751] text-xs font-black uppercase">
                  <ShieldCheck className="w-4 h-4" /> Biometric Verified
                </div>
                <p className="text-[9px] text-slate-400 font-medium">Digital Registry Check Complete</p>
              </div>
            </div>

            {/* Candidate Information List */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-sm font-black text-[#008751] uppercase tracking-widest border-b border-slate-100 pb-2">
                Candidate Details
              </h2>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                  <span className="font-bold text-slate-800 text-sm">{candidate.name}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                  <span className="font-semibold text-slate-700">{candidate.email}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate ID / Reg No</span>
                  <span className="font-mono font-bold text-[#008751]">{regId}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Category</span>
                  <span className="font-semibold text-slate-700 uppercase">{candidate.role || candidate.programType || 'Applicant Candidate'}</span>
                </div>

                {candidate.faculty && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty</span>
                    <span className="font-semibold text-slate-700">{candidate.faculty}</span>
                  </div>
                )}

                {candidate.department && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</span>
                    <span className="font-semibold text-slate-700">{candidate.department}</span>
                  </div>
                )}

                {candidate.jambRegNo && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">JAMB Reg Number</span>
                    <span className="font-mono font-semibold text-slate-700">{candidate.jambRegNo}</span>
                  </div>
                )}

                {candidate.jambScore ? (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">JAMB Aggregate Score</span>
                    <span className="font-bold text-[#008751]">{candidate.jambScore} Marks</span>
                  </div>
                ) : null}

                {candidate.gender && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                    <span className="font-semibold text-slate-700">{candidate.gender}</span>
                  </div>
                )}

                {candidate.phoneNumber && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                    <span className="font-semibold text-slate-700">{candidate.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Barcode & Verification Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start text-xs font-bold text-slate-700">
                <CheckCircle className="w-4 h-4 text-[#008751]" />
                <span>Authentic Institutional Document</span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium max-w-sm">
                This document serves as candidate proof of registration. Keep it safe for screening, clearance, and orientation.
              </p>
            </div>

            {/* Simulated Barcode */}
            <div className="flex flex-col items-center">
              <div className="flex gap-1 h-10 items-center px-4 bg-slate-100 rounded border border-slate-200">
                {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2].map((w, i) => (
                  <div key={i} className={`h-8 bg-slate-800 rounded-sm`} style={{ width: `${w * 2}px` }} />
                ))}
              </div>
              <span className="text-[8px] font-mono font-bold text-slate-400 tracking-widest mt-1">
                *{regId}*
              </span>
            </div>
          </div>

          {/* Official Signatures */}
          <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-600">
            <div>
              <div className="border-b border-slate-300 pb-1 mb-1 font-serif italic text-slate-500">
                Candidate Signature
              </div>
              <p className="text-[10px] font-normal text-slate-400">Date: {regDate}</p>
            </div>
            <div>
              <div className="border-b border-slate-300 pb-1 mb-1 font-serif italic text-[#008751]">
                Prof. A. O. Registrar
              </div>
              <p className="text-[10px] font-normal text-slate-400">Registrar & Academic Affairs</p>
            </div>
          </div>

        </div>

        {/* Footer Actions - Hidden during print */}
        <div className="no-print bg-slate-50 px-8 py-5 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-500 font-medium">
            Clicking <strong className="text-[#008751]">Print / Save as PDF</strong> will generate the official PDF document.
          </p>
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-[#008751] hover:bg-[#006e41] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" /> Save as PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
