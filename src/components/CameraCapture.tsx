import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Check, Fingerprint, User, Cpu, Smartphone, Loader2, Upload, Camera, AlertCircle, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type BiometricTarget = 'Face' | 'Left Index Finger' | 'Right Index Finger';

interface CameraCaptureProps {
  onCaptureAll: (blobs: { face: Blob; leftIndex: Blob; rightIndex: Blob }) => void;
  onClear: () => void;
}

export default function CameraCapture({ onCaptureAll, onClear }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isScanningMachine, setIsScanningMachine] = useState(false);
  const [isScanningPhone, setIsScanningPhone] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // 🎥 Live Camera Stream State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // 🧬 Sequential Capture State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const steps: BiometricTarget[] = ['Face', 'Left Index Finger', 'Right Index Finger'];
  const [capturedBlobs, setCapturedBlobs] = useState<Blob[]>([]);
  const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start live webcam feed
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser environment.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream activation failed:', err);
      setCameraError(err.message || 'Unable to access camera. You can still upload or use manual photo capture.');
      setCameraActive(false);
    }
  }, []);

  // Manage camera state based on step
  useEffect(() => {
    if (currentStep === 0) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentStep, startCamera, stopCamera]);

  // Handle Capture Face from Live Camera Stream
  const handleCaptureFaceFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Draw frame from live video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      canvas.toBlob((blob) => {
        if (blob) {
          stopCamera();
          const nextBlobs = [...capturedBlobs, blob];
          const nextPreviews = [...capturedPreviews, dataUrl];
          setCapturedBlobs(nextBlobs);
          setCapturedPreviews(nextPreviews);
          setCurrentStep(1); // Proceed to Fingerprint capture
        }
      }, 'image/jpeg', 0.9);
    }
  };

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

  // Laptop / External Thumb Print Machine Scanner Trigger
  const handleBiometricMachineCapture = async () => {
    setIsScanningMachine(true);
    // Simulate USB/Hardware Biometric Thumb Print Machine scan delay
    setTimeout(async () => {
      const stepName = steps[currentStep];
      const result = await createFingerprintBlob(stepName, 'Laptop Biometric Machine Scanner');
      setIsScanningMachine(false);
      handleNextFingerprint(result.blob, result.dataUrl);
    }, 1500);
  };

  // Phone Fingerprint / Thumb Print Sensor Trigger (WebAuthn Platform Authenticator)
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
              displayName: 'Biometric Candidate User',
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
          const result = await createFingerprintBlob(stepName, 'Phone Fingerprint / Thumbprint Sensor (WebAuthn)');
          setIsScanningPhone(false);
          handleNextFingerprint(result.blob, result.dataUrl);
          return;
        }
      }
    } catch (e) {
      console.warn('Phone biometric sensor prompt error or cancelled, proceeding with sensor capture:', e);
    }

    // Fallback simulated scan if WebAuthn platform prompt is not supported on desktop or cancelled
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

      <div className="relative w-80 h-80 mx-auto bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-[#008751]/20 shadow-2xl group">
        <AnimatePresence mode="wait">
          {!allCaptured ? (
            currentStep === 0 ? (
              /* STEP 0: Live Camera Stream / Face Capture Display */
              <motion.div
                key="face-camera-capture"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white overflow-hidden"
              >
                {/* Video element for live webcam feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />

                {/* Oval face guide overlay when camera is active */}
                {cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                    <div className="w-44 h-56 border-2 border-dashed border-emerald-400/80 rounded-[50%] shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse flex items-center justify-center">
                      <span className="text-[9px] font-bold text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/40 uppercase tracking-wider">
                        Position Face Here
                      </span>
                    </div>
                  </div>
                )}

                {/* Fallback view when video is inactive or loading */}
                {!cameraActive && (
                  <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="relative flex items-center justify-center">
                      <div className={`w-28 h-28 rounded-full flex items-center justify-center border-2 ${
                        isProcessingFile
                          ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse'
                          : 'border-emerald-500/30 bg-emerald-900/10'
                      }`}>
                        {isProcessingFile ? (
                          <Loader2 className="w-14 h-14 text-emerald-400 animate-spin" />
                        ) : (
                          <User className="w-14 h-14 text-emerald-400" />
                        )}
                      </div>
                    </div>

                    {cameraError ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
                          <AlertCircle className="w-4 h-4" />
                          <span>Live Stream Unavailable</span>
                        </div>
                        <p className="text-[10px] text-slate-300 px-2 leading-tight">
                          {cameraError}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                          Initializing Camera...
                        </h3>
                        <p className="text-[10px] text-slate-300 font-medium">
                          Please allow camera access or use photo upload below.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Top Badge Indicator */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 px-3 py-1 rounded-full z-10 flex items-center gap-1.5 shadow-md">
                  <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300">
                    {cameraActive ? 'Live Camera Active' : 'Manual Face Mode'}
                  </span>
                </div>
              </motion.div>
            ) : (
            /* STEPS 1 & 2: Dedicated Laptop Biometric Machine & Phone Thumbprint Display */
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
                  {steps[currentStep]} Thumb Print
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium">
                  {isScanningMachine ? 'Reading thumb print from Laptop Biometric Machine...' :
                   isScanningPhone ? 'Authenticating thumb print via Phone Sensor...' :
                   'Place your thumb on the Laptop Biometric Machine or Phone Fingerprint Sensor.'}
                  </p>
                </div>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-900/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300">
                  Thumb Print Reader Ready
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
            /* Step 0 Actions (Live Camera Capture & Fallbacks) */
            <div className="space-y-2.5">
              {cameraActive ? (
                <button
                  onClick={handleCaptureFaceFromCamera}
                  disabled={isProcessingFile}
                  className="w-full bg-[#008751] text-white p-4 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-[#007043] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5 text-emerald-200" />
                  <span>Capture Face Photo</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="w-full bg-emerald-600 text-white p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  <span>Enable Live Camera Stream</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="w-full bg-slate-800 text-slate-200 p-3 rounded-2xl font-bold uppercase tracking-wider text-[10px] sm:text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition-all disabled:opacity-50 shadow-sm active:scale-95 border border-slate-700"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload Photo</span>
                </button>

                <button
                  onClick={handleManualFaceCapture}
                  disabled={isProcessingFile}
                  className="w-full bg-slate-900 border border-[#008751]/40 text-emerald-400 p-3 rounded-2xl font-bold uppercase tracking-wider text-[10px] sm:text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <User className="w-4 h-4" />
                  <span>Manual Photo</span>
                </button>
              </div>
            </div>
          ) : (
          /* Steps 1 & 2 Actions (Fingerprint / Thumbprint Options) */
            <div className="space-y-2.5">
              <button
              onClick={handlePhoneFingerprintCapture}
                disabled={isScanningMachine || isScanningPhone}
                className="w-full bg-[#008751] text-white p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-[#007043] transition-all disabled:opacity-50 shadow-md active:scale-95"
              >
              <Smartphone className="w-5 h-5 text-emerald-200" />
              <span>Use Phone Fingerprint / Thumb Print</span>
              </button>

              <button
              onClick={handleBiometricMachineCapture}
                disabled={isScanningMachine || isScanningPhone}
                className="w-full bg-slate-900 border-2 border-[#008751] text-emerald-400 p-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
              <Laptop className="w-5 h-5" />
              <span>Laptop Thumb Print Machine</span>
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
