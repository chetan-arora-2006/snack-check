import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader } from './UI/Loader';
import { Card } from './UI/Card';
import type { ScanDB, ScanReport } from '../schemas/scan';
import { 
  Upload, 
  Camera, 
  X, 
  ShieldAlert, 
  CheckCircle, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  Info,
  Search,
  BookOpen
} from 'lucide-react';

export const Scanner: React.FC = () => {
  const { apiFetch, user, activeMemberId } = useAuth();
  
  // Tabs and scan states
  const [scanTab, setScanTab] = useState<'image' | 'barcode'>('image');
  const [barcodeInput, setBarcodeInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeName = activeMemberId && user?.family_members
    ? user.family_members.find(m => m.id === activeMemberId)?.name
    : "Primary Profile (You)";

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Camera Handlers
  const startCamera = async () => {
    setError(null);
    setImage(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      setError("Could not access camera. Please upload an image or check permissions.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Submit image scan to backend
  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setLogged(false);
    try {
      const payload = { image_base64: image };
      const endpoint = `/api/scan/upload${activeMemberId ? `?member_id=${activeMemberId}` : ''}`;
      const response: ScanDB = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setReport(response.result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze label image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit barcode lookup to backend
  const handleBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    setLoading(true);
    setError(null);
    setLogged(false);
    try {
      const endpoint = `/api/scan/barcode/${barcodeInput.trim()}${activeMemberId ? `?member_id=${activeMemberId}` : ''}`;
      const response: ScanDB = await apiFetch(endpoint);
      setReport(response.result);
    } catch (err: any) {
      setError(err.message || "Product barcode not found. Try photographing the ingredient label!");
    } finally {
      setLoading(false);
    }
  };

  // Log Consumed Snack
  const handleLogSnack = async () => {
    if (!report) return;
    try {
      await apiFetch('/api/consumption/log', {
        method: 'POST',
        body: JSON.stringify({
          product_name: report.product_name,
          calories: report.nutrients.calories || 0,
          sugars: report.nutrients.sugars || 0,
          sodium: report.nutrients.sodium || 0,
          member_id: activeMemberId
        })
      });
      setLogged(true);
      alert(`Logged ${report.product_name} consumed into today's budget!`);
    } catch (e: any) {
      console.error(e);
      alert("Failed to log consumption.");
    }
  };

  const resetScanner = () => {
    setImage(null);
    setReport(null);
    setError(null);
    setBarcodeInput("");
    setLogged(false);
    stopCamera();
  };

  // Circular score gauge variables
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const getStrokeDashoffset = (score: number) => {
    return circumference - (score / 100) * circumference;
  };

  // Cross-reference allergens with user profile allergies
  const getProfileAllergenMatches = (reportAllergens: string[]) => {
    // If active member profile, cross reference active member details
    let activeAllergies: string[] = [];
    if (activeMemberId && user?.family_members) {
      const member = user.family_members.find(m => m.id === activeMemberId);
      if (member) activeAllergies = member.allergies;
    } else if (user) {
      activeAllergies = user.allergies;
    }

    return reportAllergens.filter(allergen => 
      activeAllergies.some(userAllergy => 
        allergen.toLowerCase().includes(userAllergy.toLowerCase()) || 
        userAllergy.toLowerCase().includes(allergen.toLowerCase())
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Dynamic Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 bg-white dark:bg-slate-900/30 p-5 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Snack Scanner</h2>
          <p className="text-slate-400 text-sm mt-1">Upload a label, snap a photo, or lookup barcodes for immediate AI scoring.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs px-4 py-2.5 rounded-2xl font-bold flex items-center gap-1.5 self-start md:self-auto shadow-md">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Scanning for: <span className="underline">{activeName}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm p-4 rounded-2xl shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && <Loader imageSrc={image} />}

      {/* Tabs Option */}
      {!loading && !report && (
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => { setScanTab('image'); stopCamera(); }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              scanTab === 'image' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900/40'
            }`}
          >
            Image / Camera Scan
          </button>
          <button
            onClick={() => { setScanTab('barcode'); stopCamera(); }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              scanTab === 'barcode' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900/40'
            }`}
          >
            Barcode Lookup
          </button>
        </div>
      )}

      {/* Input panel (Image / Camera Scan) */}
      {!loading && !report && scanTab === 'image' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* File drag-drop / Camera preview */}
          <Card className="flex flex-col items-center justify-center p-8 border border-slate-200 dark:border-slate-800 min-h-[320px] relative">
            {cameraActive ? (
              <div className="w-full h-full flex flex-col items-center gap-4">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full max-h-64 object-cover rounded-2xl border border-slate-850"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={capturePhoto}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-sm transition-all"
                  >
                    Take Photo
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="px-6 py-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-100 font-semibold rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : image ? (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="relative w-64 h-64 rounded-2xl overflow-hidden border border-slate-850">
                  <img src={image} alt="Upload preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/65 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-950 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleAnalyze}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
                  >
                    Analyze Image
                  </button>
                  <button 
                    onClick={() => setImage(null)}
                    className="px-6 py-3 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-100 font-semibold rounded-xl text-sm transition-all"
                  >
                    Retake
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="w-full flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-slate-700 rounded-3xl p-8 cursor-pointer transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/60 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform duration-200 mb-4 border border-slate-200 dark:border-slate-850">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-200">Drag & drop your label here</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Supports JPG, PNG (Max 5MB)</p>
                <span className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl text-xs transition-colors">
                  Browse Files
                </span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            )}
          </Card>

          {/* Quick Info & Tips */}
          <div className="space-y-6 flex flex-col justify-center">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Use Your Camera</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Don't have a file? Take a photo of the product package or ingredient list on the back of the snack instantly.</p>
                <button 
                  onClick={startCamera}
                  disabled={cameraActive}
                  className="mt-3 px-4 py-2 border border-emerald-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-emerald-50 dark:hover:bg-slate-900 text-xs font-semibold text-emerald-600 dark:text-emerald-400 rounded-xl transition-all cursor-pointer"
                >
                  Launch Camera
                </button>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">What the AI looks for</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Our engine scans the ingredient listings for chemical preservatives, artificial colorings, and added sugars, cross-referencing nutritional scales to rank overall healthiness.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input panel (Barcode Search lookup) */}
      {!loading && !report && scanTab === 'barcode' && (
        <Card className="p-8 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/60 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-850 mb-6">
            <BookOpen className="w-7 h-7" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Search Product Barcode</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm text-center max-w-md mb-6 leading-relaxed">
            Enter a product barcode number. We query the global Open Food Facts API and evaluate the nutritional properties via Gemini.
          </p>

          <form onSubmit={handleBarcodeSearch} className="w-full max-w-md flex gap-2">
            <input
              type="text"
              required
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="e.g. 0025000045431 or 5060460220084"
              className="flex-1 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!barcodeInput.trim()}
              className="px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Lookup
            </button>
          </form>
        </Card>
      )}

      {/* AI Evaluation Report display */}
      {!loading && report && (
        <div className="space-y-8 animate-in zoom-in-95 duration-350">
          
          {/* Re-scan buttons */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Evaluation Report</h3>
            <button 
              onClick={resetScanner}
              className="flex items-center gap-2 px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 rounded-xl text-xs font-semibold text-emerald-400 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Scan Another Product
            </button>
          </div>

          {/* Allergen Warning Banner */}
          {getProfileAllergenMatches(report.warnings.allergens).length > 0 && (
            <div className="flex gap-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 p-5 rounded-3xl items-start shadow-xl shadow-rose-950/5">
              <ShieldAlert className="w-6 h-6 text-rose-550 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-base">Allergy Conflict Warning!</h4>
                <p className="text-sm text-rose-455 mt-1">
                  This product contains ingredients matching this profile allergy list: <strong>{getProfileAllergenMatches(report.warnings.allergens).join(', ')}</strong>. Consuming this snack is not recommended.
                </p>
              </div>
            </div>
          )}

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Card: Score Ring & Basic Description */}
            <Card className="flex flex-col items-center text-center p-8 border border-slate-800 relative">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold absolute top-4 left-6">
                Health Grading
              </span>

              {/* Radial circle score */}
              <div className="relative w-44 h-44 flex items-center justify-center my-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="88" 
                    cy="88" 
                    r={radius} 
                    stroke="rgba(255,255,255,0.03)" 
                    strokeWidth="10" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="88" 
                    cy="88" 
                    r={radius} 
                    stroke={report.grade_color} 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray={circumference}
                    strokeDashoffset={getStrokeDashoffset(report.health_rating)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center score text */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{report.health_grade}</span>
                  <span className="text-xs text-slate-500 font-semibold mt-1">Score {report.health_rating}/100</span>
                </div>
              </div>

              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{report.product_name}</h4>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">{report.summary}</p>
              
              {/* Log Consumption Button */}
              <button
                onClick={handleLogSnack}
                disabled={logged}
                className={`w-full flex items-center justify-center gap-2 mt-6 px-5 py-3.5 font-bold rounded-2xl active:scale-95 transition-all duration-200 text-sm shadow-md cursor-pointer ${
                  logged 
                    ? 'bg-slate-900 border border-slate-800 text-emerald-600 dark:text-emerald-405 cursor-default opacity-80' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/10'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {logged ? "Logged in Daily Budget!" : "Log Snack Consumed"}
              </button>
            </Card>

            {/* Right Card: Nutritional grid */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Nutrient Values <span className="text-[10px] text-slate-500 font-normal lowercase">(per 100g)</span></h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Calories', val: report.nutrients.calories, unit: 'kcal', warning: false },
                    { label: 'Sugars', val: report.nutrients.sugars, unit: 'g', warning: report.warnings.high_sugar, tag: 'High Sugar!' },
                    { label: 'Total Fat', val: report.nutrients.fat, unit: 'g', warning: false },
                    { label: 'Sat. Fat', val: report.nutrients.saturated_fat, unit: 'g', warning: report.warnings.high_saturated_fat, tag: 'High Sat. Fat!' },
                    { label: 'Protein', val: report.nutrients.protein, unit: 'g', warning: false },
                    { label: 'Sodium', val: report.nutrients.sodium, unit: 'mg', warning: report.warnings.high_sodium, tag: 'High Sodium!' },
                    { label: 'Fiber', val: report.nutrients.fiber, unit: 'g', warning: false, positive: true }
                  ].map((nut, i) => {
                    if (nut.val === null) return null;
                    return (
                      <div key={i} className={`p-3.5 rounded-2xl border transition-all ${
                        nut.warning 
                          ? 'bg-rose-500/5 border-rose-500/20 text-rose-450' 
                          : nut.positive 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-slate-900/40 border-slate-850 text-slate-300'
                      }`}>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{nut.label}</p>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                          {nut.val} <span className="text-xs font-semibold text-slate-500">{nut.unit}</span>
                        </p>
                        {nut.warning && (
                          <span className="inline-block text-[9px] font-bold bg-rose-500/10 text-rose-450 border border-rose-500/25 px-1.5 py-0.5 rounded-full mt-2">
                            {nut.tag}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Additives & Allergens warnings */}
              {(report.warnings.additives.length > 0 || report.warnings.allergens.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Allergens Warning List */}
                  {report.warnings.allergens.length > 0 && (
                    <Card className="border border-slate-800">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Allergen Declarations</h4>
                      <div className="flex flex-wrap gap-2">
                        {report.warnings.allergens.map((allergen, idx) => {
                          const isConflicting = getProfileAllergenMatches([allergen]).length > 0;
                          return (
                            <span 
                              key={idx}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                                isConflicting 
                                  ? 'bg-rose-500/10 border-rose-500/25 text-rose-450 shadow-md shadow-rose-950/5' 
                                  : 'bg-slate-900/40 border-slate-850 text-slate-300'
                              }`}
                            >
                              {allergen}
                            </span>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Additive Hazard List */}
                  {report.warnings.additives.length > 0 && (
                    <Card className="border border-slate-800">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Food Additives</h4>
                      <div className="space-y-3">
                        {report.warnings.additives.map((add, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              add.hazard === 'High' 
                                ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' 
                                : add.hazard === 'Moderate'
                                  ? 'bg-yellow-500/10 text-yellow-450 border border-yellow-500/20'
                                  : 'bg-slate-900 text-slate-400'
                            }`}>
                              {add.hazard}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-200">{add.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{add.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Ingredients analysis */}
              <Card className="border border-slate-800">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Ingredient Quality Check</h4>
                <div className="space-y-4">
                  {report.ingredients_analysis.beneficial.length > 0 && (
                    <div className="flex gap-3">
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex-shrink-0 self-start">Beneficial</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{report.ingredients_analysis.beneficial.join(', ')}</p>
                    </div>
                  )}
                  {report.ingredients_analysis.neutral.length > 0 && (
                    <div className="flex gap-3">
                      <span className="text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full flex-shrink-0 self-start">Neutral</span>
                      <p className="text-xs text-slate-400 leading-relaxed">{report.ingredients_analysis.neutral.join(', ')}</p>
                    </div>
                  )}
                  {report.ingredients_analysis.avoid.length > 0 && (
                    <div className="flex gap-3">
                      <span className="text-[10px] font-bold bg-rose-500/10 text-rose-455 border border-rose-500/20 px-2 py-0.5 rounded-full flex-shrink-0 self-start">Avoid</span>
                      <p className="text-xs text-slate-400 leading-relaxed">{report.ingredients_analysis.avoid.join(', ')}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Healthy Swaps / Alternatives */}
              {report.healthier_alternatives.length > 0 && (
                <Card className="border border-slate-800">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Healthier Swaps Recommendation</h4>
                  <div className="space-y-4">
                    {report.healthier_alternatives.map((alt, idx) => (
                      <div key={idx} className="flex gap-3 items-start border-l-2 border-emerald-500 pl-3">
                        <div>
                          <p className="text-xs font-bold text-slate-200">{alt.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{alt.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
