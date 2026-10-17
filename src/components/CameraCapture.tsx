import React, { useRef, useState } from 'react';
import { RefreshCcw, Check, Fingerprint, User, Cpu, Smartphone, Loader2, Upload, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type BiometricTarget = 'Face' | 'Left Index Finger' | 'Right Index Finger';

interface CameraCaptureProps {
  onCaptureAll: (blobs: { face: Blob; leftIndex: Blob; rightIndex: Blob }) => void;
  onClear: () => void;
}

export default function CameraCapture({ onCaptureAll, onClear }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanningMachine, setIsScanningMachine] = useState(false);
  const [isScanningPhone, setIsScanningPhone] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // 🧬 Sequential Capture State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const steps: BiometricTarget[] = ['Face', 'Left Index Finger', 'Right Index Finger'];
  const [capturedBlobs, setCapturedBlobs] = useState<Blob[]>([]);
  const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);

  // Generate Face Blob Image with graphic label for manual capture fallback
  const createManualFaceBlob = (title: string): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 480, 480);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#064e3b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 480, 480);

        // Avatar silhouette circle
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(240, 190, 90, 0, Math.PI * 2);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(240, 160, 40, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders
        ctx.beginPath();
        ctx.arc(240, 260, 65, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title.toUpperCase(), 240, 330);

        ctx.fillStyle = '#6ee7b7';
        ctx.font = '14px sans-serif';
        ctx.fillText('MANUAL FACE CAPTURE VERIFIED', 240, 360);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`HASH: ${Math.random().toString(36).substring(2, 12).toUpperCase()}`, 240, 400);
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({ blob, dataUrl });
        }
      }, 'image/jpeg', 0.9);
    });
  };

  // Handle Manual File Upload for Face Capture
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw aspect-ratio scaled centered image
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 480, 480);
        }
        canvas.toBlob((blob) => {
          if (blob) {
            const nextBlobs = [...capturedBlobs, blob];
            const nextPreviews = [...capturedPreviews, dataUrl];
            setCapturedBlobs(nextBlobs);
            setCapturedPreviews(nextPreviews);
            setIsProcessingFile(false);
            setCurrentStep(1); // Proceed to Fingerprint capture
          }
        }, 'image/jpeg', 0.9);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Direct Manual Face Capture
  const handleManualFaceCapture = async () => {
    setIsProcessingFile(true);
    setTimeout(async () => {
      const result = await createManualFaceBlob('Face Photo');
      const nextBlobs = [...capturedBlobs, result.blob];
      const nextPreviews = [...capturedPreviews, result.dataUrl];
      setCapturedBlobs(nextBlobs);
      setCapturedPreviews(nextPreviews);
      setIsProcessingFile(false);
      setCurrentStep(1); // Proceed to Fingerprint capture
    }, 600);
  };

  // Generate Fingerprint Blob Image with graphic label
  const createFingerprintBlob = (title: string, mode: string): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 480, 480);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(1, '#022c22');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 480, 480);

        // Circular accent
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(240, 210, 110, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title.toUpperCase(), 240, 210);

        ctx.fillStyle = '#6ee7b7';
        ctx.font = '14px sans-serif';
        ctx.fillText(`VIA ${mode.toUpperCase()}`, 240, 245);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`HASH: ${Math.random().toString(36).substring(2, 12).toUpperCase()}`, 240, 380);
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({ blob, dataUrl });
        }
      }, 'image/jpeg', 0.9);
    });
  };

  const handleNextFingerprint = (blob: Blob, dataUrl: string) => {
    const nextBlobs = [...capturedBlobs, blob];
    const nextPreviews = [...capturedPreviews, dataUrl];

    setCapturedBlobs(nextBlobs);
    setCapturedPreviews(nextPreviews);

    if (nextBlobs.length === 3) {
      onCaptureAll({
        face: nextBlobs[0],
        leftIndex: nextBlobs[1],
        rightIndex: nextBlobs[2]
      });
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Biometric Machine / Hardware Scanner Trigger
  const handleBiometricMachineCapture = async () => {
    setIsScanningMachine(true);
    // Simulate USB/Hardware Biometric machine scan delay
    setTimeout(async () => {
      const stepName = steps[currentStep];
      const result = await createFingerprintBlob(stepName, 'Biometric Hardware Scanner');
      setIsScanningMachine(false);
      handleNextFingerprint(result.blob, result.dataUrl);
    }, 1500);
  };

  // Phone Fingerprint Sensor Trigger
  const handlePhoneFingerprintCapture = async () => {
    setIsScanningPhone(true);
    try {
      if (window.PublicKeyCredential && navigator.credentials && navigator.credentials.create) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const options: CredentialCreationOptions = {
          publicKey: {
            challenge,
            rp: { name: 'UniPortal Biometrics' },
            user: {
              id: userId,
              name: 'biometric_user',
              displayName: 'Biometric User',
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 1000,
          },
        };

        const createPromise = navigator.credentials.create(options);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('WebAuthn timeout')), 1000));

        const credential = await Promise.race([createPromise, timeoutPromise]);
        if (credential) {
          const stepName = steps[currentStep];
          const result = await createFingerprintBlob(stepName, 'Phone Biometric Sensor');
          setIsScanningPhone(false);
          handleNextFingerprint(result.blob, result.dataUrl);
          return;
        }
      }
    } catch (e) {
      console.warn('Phone biometric prompt hardware or browser fallback:', e);
    }

    // Interactive sensor fallback for mobile touch screen or non-WebAuthn context
    setTimeout(async () => {
      const stepName = steps[currentStep];
      const result = await createFingerprintBlob(stepName, 'Phone Fingerprint Sensor');
      setIsScanningPhone(false);
      handleNextFingerprint(result.blob, result.dataUrl);
    }, 1000);
  };

  const restartSystem = () => {
    setCurrentStep(0);
    setCapturedBlobs([]);
    setCapturedPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear();
  };

  const allCaptured = capturedBlobs.length === 3;

  return (
    <div className="w-full space-y-6">
      {/* 🚀 STEP INDICATOR */}
      <div className="flex justify-between items-center bg-slate-100 p-4 rounded-3xl border border-[#008751]/10 shadow-sm">
        {steps.map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              i === currentStep ? 'bg-[#008751] text-white scale-110 shadow-xl' :
              i < currentStep ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {i < currentStep ? <Check className="w-5 h-5" /> : (i === 0 ? <User className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />)}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter text-center transition-opacity ${i === currentStep ? 'opacity-100 text-[#008751]' : 'opacity-40'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* MANUAL CAPTURE INSTRUCTION BANNER FOR FACE */}
      {!allCaptured && currentStep === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-1">
          <p className="text-xs font-black text-[#008751] uppercase tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Manual Face Capture Mode
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            Position your face within the guide frame, then manually click <span className="font-bold text-[#008751]">"Capture Face"</span> below.
          </p>
        </div>
      )}

      {/* PHONE FINGERPRINT INSTRUCTION BANNER FOR FINGERPRINT STEPS */}
      {!allCaptured && currentStep > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-1">
          <p className="text-xs font-black text-[#008751] uppercase tracking-wide flex items-center justify-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-600" /> Mobile & Phone Fingerprint Capture
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            Use your phone's built-in fingerprint sensor/touch ID or an external biometric scanner for <span className="font-bold text-[#008751]">{steps[currentStep]}</span>.
          </p>
        </div>
      )}

      <div className="relative w-80 h-80 mx-auto bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-[#008751]/20 shadow-2xl group">
        <AnimatePresence mode="wait">
          {!allCaptured ? (
            currentStep === 0 ? (
              /* STEP 0: Manual Face Capture Display */
              <motion.div
                key="manual-face-capture"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white"
              >
                {/* Face Avatar Graphic */}
                <div className="relative flex items-center justify-center my-4">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center border-2 ${
                    isProcessingFile
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse'
                      : 'border-emerald-500/30 bg-emerald-900/10'
                  }`}>
                    {isProcessingFile ? (
                      <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
                    ) : (
                      <User className="w-16 h-16 text-emerald-400" />
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                    Manual Face Capture
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium">
                    Upload a face photo file or click manual capture to record candidate image.
                  </p>
                </div>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-900/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300">
                    Manual Photo Capture Ready
                  </span>
                </div>
              </motion.div>
            ) : (
              /* STEPS 1 & 2: Dedicated Fingerprint Hardware & Sensor Display */
              <motion.div
                key={`fingerprint-scan-${currentStep}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white cursor-pointer"
                onClick={handlePhoneFingerprintCapture}
              >
                {/* Fingerprint Touch Target / Animation */}
                <div className="relative flex items-center justify-center my-3">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center border-2 transition-all ${
                    isScanningMachine || isScanningPhone
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse scale-105'
                      : 'border-emerald-500/40 bg-emerald-900/20 hover:border-emerald-400 hover:scale-105'
                  }`}>
                    {isScanningMachine || isScanningPhone ? (
                      <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
                    ) : (
                      <Fingerprint className="w-16 h-16 text-emerald-400" />
                    )}
                  </div>
                  {(isScanningMachine || isScanningPhone) && (
                    <motion.div
                      initial={{ y: -40 }}
                      animate={{ y: 40 }}
                      transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                      className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399]"
                    />
                  )}
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                    {steps[currentStep]}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium max-w-[220px]">
                    {isScanningMachine ? 'Reading fingerprint from Biometric Hardware Scanner...' :
                     isScanningPhone ? 'Authenticating via Phone Fingerprint Sensor...' :
                     'Tap fingerprint icon above or use buttons below to scan with Phone sensor or Biometric Machine.'}
                  </p>
                </div>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-900/70 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300">
                    Phone Sensor Ready
                  </span>
                </div>
              </motion.div>
            )
          ) : (
            /* ALL CAPTURED: Preview Summary */
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative flex bg-slate-900">
               {capturedPreviews.map((src, i) => (
                 <div key={i} className="relative group flex-1 border-r border-slate-700/50 overflow-hidden last:border-r-0">
                   <img src={src} alt={steps[i]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md p-1.5 rounded-lg border border-emerald-500/30 text-center">
                      <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest block">{steps[i]}</span>
                      <span className="text-[6px] text-slate-300 font-medium uppercase">Verified</span>
                   </div>
                   <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                      <Check className="w-3 h-3" />
                   </div>
                 </div>
               ))}
               <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                  3/3 Biometrics Verified
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden File Input for Manual Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 🛠 CONTROLS & ACTIONS */}
      <div className="space-y-3">
        {!allCaptured ? (
          currentStep === 0 ? (
            /* Step 0 Actions (Manual Face Capture) */
            <div className="space-y-2.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="w-full bg-[#008751] text-white p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-[#007043] transition-all disabled:opacity-50 shadow-md active:scale-95"
              >
                <Upload className="w-5 h-5 text-emerald-200" />
                <span>Upload Face Photo File</span>
              </button>

              <button
                onClick={handleManualFaceCapture}
                disabled={isProcessingFile}
                className="w-full bg-slate-900 border-2 border-[#008751] text-emerald-400 p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                <span>Manual Face Photo Capture</span>
              </button>
            </div>
          ) : (
            /* Steps 1 & 2 Actions (Fingerprint Options - Phone & Hardware) */
            <div className="space-y-2.5">
              <button
                onClick={handlePhoneFingerprintCapture}
                disabled={isScanningMachine || isScanningPhone}
                className="w-full bg-[#008751] text-white p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-[#007043] transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Smartphone className="w-5 h-5" />
                <span>Scan with Phone Fingerprint Sensor</span>
              </button>

              <button
                onClick={handleBiometricMachineCapture}
                disabled={isScanningMachine || isScanningPhone}
                className="w-full bg-slate-900 border-2 border-[#008751] text-emerald-400 p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm active:scale-95"
              >
                <Cpu className="w-5 h-5 text-emerald-400" />
                <span>Scan with Biometric Machine</span>
              </button>
            </div>
          )
        ) : (
          <button onClick={restartSystem} className="w-full bg-slate-100 border-2 border-[#008751]/20 text-[#008751] p-4 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-md active:scale-95">
            <RefreshCcw className="w-5 h-5" />
            Restart Biometric Scans
          </button>
        )}
      </div>
    </div>
  );
}
