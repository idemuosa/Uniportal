import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCcw, Check, AlertCircle, Fingerprint, User, Hand } from 'lucide-react';
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  // 🧬 Sequential Capture State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const steps: BiometricTarget[] = ['Face', 'Left Index Finger', 'Right Index Finger'];
  const [capturedBlobs, setCapturedBlobs] = useState<Blob[]>([]);
  const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);

  const startCamera = useCallback(async () => {
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
      setError('Could not access camera. Please ensure you have granted permission.');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const performCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        canvas.toBlob((blob) => {
          if (blob) {
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
              stopCamera();
            } else {
              setCurrentStep(prev => prev + 1);
            }
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleCaptureClick = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      performCapture();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const restartSystem = () => {
    setCurrentStep(0);
    setCapturedBlobs([]);
    setCapturedPreviews([]);
    onClear();
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const allCaptured = capturedBlobs.length === 3;

  return (
    <div className="w-full space-y-6">
      {/* 🚀 STEP INDICATOR */}
      <div className="flex justify-between items-center bg-neutral-900/50 p-4 rounded-3xl border border-[#008751]/5 shadow-inner">
        {steps.map((step, i) => (
          <div key={step} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              i === currentStep ? 'bg-slate-50 text-black scale-110 shadow-xl' : 
              i < currentStep ? 'bg-emerald-500 text-[#008751]' : 'bg-[#008751]/3 text-[#008751]/15'
            }`}>
              {i < currentStep ? <Check className="w-5 h-5" /> : (i === 0 ? <User className="w-5 h-5" /> : <Hand className="w-5 h-5" />)}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tighter transition-opacity ${i === currentStep ? 'opacity-100 text-[#008751]' : 'opacity-20'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>

      <div className="relative w-40 h-40 mx-auto bg-neutral-950 rounded-full overflow-hidden border-4 border-[#008751]/8 shadow-2xl group">
        <AnimatePresence mode="wait">
          {!allCaptured ? (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              {error ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#008751] space-y-4">
                  <AlertCircle className="w-12 h-12 text-rose-500" />
                  <p className="text-sm font-black uppercase tracking-widest">{error}</p>
                  <button onClick={startCamera} className="px-8 py-3 bg-slate-50 text-neutral-950 rounded-2xl font-black uppercase text-xs tracking-tighter hover:bg-neutral-100 transition-all">
                    Reset System
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  
                  {/* Target Guide */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-[60px] border-black/40" />
                    {currentStep === 0 ? (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-52 border-2 border-[#008751]/15 rounded-full flex items-center justify-center animate-pulse">
                         <div className="w-full h-full border-[1.5px] border-emerald-500/30 rounded-full" />
                      </div>
                    ) : (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-dashed border-[#008751]/15 rounded-2xl flex items-center justify-center">
                         <Hand className="w-12 h-12 text-[#008751]/10" />
                      </div>
                    )}
                  </div>

                  {/* Labels */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#008751]/5 backdrop-blur-3xl px-4 py-1.5 rounded-full border border-[#008751]/8 whitespace-nowrap">
                    <span className="text-[8px] font-black text-[#008751] uppercase tracking-[0.2em] italic">
                      Capturing: {steps[currentStep]}
                    </span>
                  </div>

                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-slate-50 backdrop-blur-sm z-50">
                        <span className="text-9xl font-black text-[#008751] italic">{countdown}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showFlash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-50 z-[60]" />}
                  </AnimatePresence>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-50 backdrop-blur-xl rounded-full border border-[#008751]/8 flex items-center gap-2 whitespace-nowrap">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[7px] font-black text-[#008751] uppercase tracking-widest text-[8px]">Live Biometric Thread</span>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative flex bg-neutral-900">
               {capturedPreviews.map((src, i) => (
                 <div key={i} className="relative group flex-1 border-r border-[#008751]/5 overflow-hidden last:border-r-0">
                   <img src={src} alt={steps[i]} className="w-full h-full object-cover scale-x-[-1] grayscale contrast-125 group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute bottom-4 left-4 bg-slate-50 backdrop-blur p-2 rounded-lg">
                      <span className="text-[8px] font-black text-[#008751] uppercase tracking-widest">{steps[i]} Verified</span>
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/10">
                      <Check className="w-8 h-8 text-[#008751]" />
                   </div>
                 </div>
               ))}
               <div className="absolute top-6 right-6 px-6 py-2 bg-emerald-500 text-emerald-950 rounded-full text-[10px] font-black uppercase tracking-[0.4em]">Full Identity Verified</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4">
        {!allCaptured ? (
          <button
            onClick={handleCaptureClick}
            disabled={!stream || isInitializing || countdown !== null}
            className="w-full flex-1 bg-slate-50 text-neutral-950 p-4 rounded-[1.5rem] font-black uppercase tracking-tighter flex items-center justify-center gap-4 hover:bg-neutral-100 transition-all disabled:opacity-50 shadow-2xl active:scale-95 group/btn"
          >
            <div className="p-2 bg-neutral-950 rounded-lg text-[#008751] group-hover/btn:rotate-12 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            {countdown !== null ? `Securing In ${countdown}...` : `Capture ${steps[currentStep]} Now`}
          </button>
        ) : (
          <button onClick={restartSystem} className="w-full flex-1 bg-[#008751]/3 border-2 border-[#008751]/8 text-[#008751] p-4 rounded-[1.5rem] font-black uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-[#008751]/5 transition-all shadow-xl active:scale-95">
            <RefreshCcw className="w-5 h-5" />
            Restart Scans
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}



