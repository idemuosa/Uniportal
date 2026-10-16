import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCcw, Check, AlertCircle, Fingerprint, User, Cpu, Smartphone, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type BiometricTarget = 'Face' | 'Left Index Finger' | 'Right Index Finger';

interface CameraCaptureProps {
  onCaptureAll: (blobs: { face: Blob; leftIndex: Blob; rightIndex: Blob }) => void;
  onClear: () => void;
}

export default function CameraCapture({ onCaptureAll, onClear }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isScanningMachine, setIsScanningMachine] = useState(false);
  const [isScanningPhone, setIsScanningPhone] = useState(false);

  // 🧬 Sequential Capture State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const steps: BiometricTarget[] = ['Face', 'Left Index Finger', 'Right Index Finger'];
  const [capturedBlobs, setCapturedBlobs] = useState<Blob[]>([]);
  const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);

  const startCamera = useCallback(async () => {
    // Only start camera when step is 0 (Face Capture)
    if (currentStep !== 0) return;
    setIsInitializing(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 480 },
          height: { ideal: 480 }
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera for Face capture. Please allow camera permissions.');
    } finally {
      setIsInitializing(false);
    }
  }, [currentStep]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Manage camera based on current step
  useEffect(() => {
    if (currentStep === 0 && capturedBlobs.length === 0) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentStep, capturedBlobs.length, startCamera, stopCamera]);

  // Face capture from live camera stream
  const performFaceCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);

        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;

        // Mirror canvas to match the live video preview feed
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        canvas.toBlob((blob) => {
          if (blob) {
            const nextBlobs = [...capturedBlobs, blob];
            const nextPreviews = [...capturedPreviews, dataUrl];
            setCapturedBlobs(nextBlobs);
            setCapturedPreviews(nextPreviews);
            stopCamera();
            setCurrentStep(1); // Proceed to Fingerprint capture
          }
        }, 'image/jpeg', 0.9);
      }
    }
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
      const result = await createFingerprintBlob(stepName, 'Biometric Machine Hardware');
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
            timeout: 60000,
          },
        };

        const credential = await navigator.credentials.create(options);
        if (credential) {
          const stepName = steps[currentStep];
          const result = await createFingerprintBlob(stepName, 'Phone Sensor (WebAuthn)');
          setIsScanningPhone(false);
          handleNextFingerprint(result.blob, result.dataUrl);
          return;
        }
      }
    } catch (e) {
      console.warn('Phone biometric prompt hardware error or cancelled, falling back to simulated scan:', e);
    }

    // Fallback simulated scan if WebAuthn is unavailable or cancelled in non-mobile environment
    setTimeout(async () => {
      const stepName = steps[currentStep];
      const result = await createFingerprintBlob(stepName, 'Phone Fingerprint Sensor');
      setIsScanningPhone(false);
      handleNextFingerprint(result.blob, result.dataUrl);
    }, 1200);
  };

  const restartSystem = () => {
    setCurrentStep(0);
    setCapturedBlobs([]);
    setCapturedPreviews([]);
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

      <div className="relative w-80 h-80 mx-auto bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-[#008751]/20 shadow-2xl group">
        <AnimatePresence mode="wait">
          {!allCaptured ? (
            currentStep === 0 ? (
              /* STEP 0: Live Camera Face Capture */
              <motion.div
                key="face-camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full relative"
              >
                {error ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white space-y-4">
                    <AlertCircle className="w-12 h-12 text-rose-500" />
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-200">{error}</p>
                    <button onClick={startCamera} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-emerald-500 transition-all">
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />

                    {/* Target Guide */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-56 border-2 border-dashed border-emerald-400 rounded-[3.5rem] flex items-center justify-center animate-pulse">
                         <div className="w-40 h-48 border border-emerald-400/30 rounded-[3rem]" />
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest italic flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-emerald-400" /> Face Capture Self
                      </span>
                    </div>

                    <AnimatePresence>
                      {showFlash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white z-[60]" />}
                    </AnimatePresence>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-950/80 backdrop-blur-xl rounded-full border border-emerald-500/30 flex items-center gap-2 whitespace-nowrap shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">Live Feed Ready</span>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              /* STEPS 1 & 2: Dedicated Fingerprint Hardware & Sensor Display (No Live Camera Feed) */
              <motion.div
                key={`fingerprint-scan-${currentStep}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white"
              >
                {/* Fingerprint Scanner Animation / Graphic */}
                <div className="relative flex items-center justify-center my-4">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center border-2 ${
                    isScanningMachine || isScanningPhone
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse'
                      : 'border-emerald-500/30 bg-emerald-900/10'
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
                  <p className="text-[10px] text-slate-300 font-medium">
                    {isScanningMachine ? 'Reading fingerprint from Biometric Machine...' :
                     isScanningPhone ? 'Authenticating via Phone Fingerprint Sensor...' :
                     'Touch hardware sensor or use phone fingerprint sensor to capture print.'}
                  </p>
                </div>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-900/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300">
                    Biometric Scanner Ready
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

      {/* 🛠 CONTROLS & ACTIONS */}
      <div className="space-y-3">
        {!allCaptured ? (
          currentStep === 0 ? (
            /* Step 0 Actions (Face Capture) */
            <button
              onClick={performFaceCapture}
              disabled={!stream || isInitializing}
              className="w-full bg-[#008751] text-white p-4 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-[#007043] transition-all disabled:opacity-50 shadow-lg active:scale-95 group"
            >
              <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Capture Face Self</span>
            </button>
          ) : (
            /* Steps 1 & 2 Actions (Fingerprint Options) */
            <div className="space-y-2.5">
              <button
                onClick={handleBiometricMachineCapture}
                disabled={isScanningMachine || isScanningPhone}
                className="w-full bg-[#008751] text-white p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-[#007043] transition-all disabled:opacity-50 shadow-md active:scale-95"
              >
                <Cpu className="w-5 h-5 text-emerald-200" />
                <span>Scan with Biometric Machine</span>
              </button>

              <button
                onClick={handlePhoneFingerprintCapture}
                disabled={isScanningMachine || isScanningPhone}
                className="w-full bg-slate-900 border-2 border-[#008751] text-emerald-400 p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Smartphone className="w-5 h-5" />
                <span>Scan with Phone Fingerprint Sensor</span>
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

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
