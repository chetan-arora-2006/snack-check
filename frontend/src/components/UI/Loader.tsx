import React, { useState, useEffect } from 'react';

interface LoaderProps {
  imageSrc?: string | null;
}

export const Loader: React.FC<LoaderProps> = ({ imageSrc }) => {
  const [step, setStep] = useState(0);
  const steps = [
    "Reading ingredients list...",
    "Extracting nutritional facts...",
    "Scanning for allergens and high-risk additives...",
    "Calculating health grade & rating...",
    "Compiling healthier snack recommendations..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center">
      {/* Scanner Wrapper */}
      <div className="relative w-64 h-64 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl mb-8 flex items-center justify-center">
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt="Scanning label" 
            className="w-full h-full object-cover opacity-40 filter blur-[0.5px]"
          />
        ) : (
          <div className="text-slate-700 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 animate-spin mb-4" />
            <p className="text-sm font-medium">Processing Image...</p>
          </div>
        )}

        {/* Laser Line Overlay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-[scan_2s_ease-in-out_infinite]" />
        
        {/* Corner Brackets */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br" />
      </div>

      <div className="flex items-center gap-3 justify-center mb-2">
        <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-lg font-semibold text-emerald-400">Analyzing Snack</span>
      </div>
      
      {/* Animated changing text message */}
      <p className="text-slate-400 text-sm h-6 transition-all duration-500 animate-pulse">
        {steps[step]}
      </p>

      {/* Tailwind scan animation definition */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
