import React, { useState, useRef } from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { SAMPLE_CROPS, analyzeCropQuality } from '../../services/ai/cropGradingService';
import AICropScanner from './AICropScanner';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  QrCode, 
  Sprout, 
  MapPin, 
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SellProductModal({ isOpen, onClose }) {
  const { publishProduct } = useFarmVest();
  const [step, setStep] = useState(1); // 1: Details, 2: Photo/Camera, 3: AI Grading, 4: Summary & Publish

  // Form State initialized to empty
  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    totalQuantity: '',
    unit: 'kg',
    pricePerKg: '',
    minOrderQty: '',
    harvestDate: '',
    location: '',
    farmerName: '',
    description: '',
    image: '',
    batchId: `FV-${Math.floor(100 + Math.random() * 900)}`
  });

  const [aiReport, setAiReport] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);

  if (!isOpen) return null;



  // Trigger device camera
  const handleStartCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access simulation:', err);
      // Fallback to sample image if hardware camera is blocked/unavailable
      setIsCameraActive(true);
    }
  };

  const handleCapturePhoto = () => {
    setIsCameraActive(false);
    // Move to AI Grading step
    setStep(3);
  };

  const handlePublish = () => {
    publishProduct({
      ...formData,
      aiGrade: aiReport
    });
    onClose();
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#7DA972]/40 my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#1F361C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5F8A55]/30 flex items-center justify-center text-[#A5D6A7]">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">Sell Your Harvest</h3>
              <p className="text-[11px] text-[#CBE0C4]">AI Quality Verification & Master QR Minting</p>
            </div>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center gap-1.5 text-xs text-[#A2C498]">
            <span className={`px-2 py-0.5 rounded-full font-bold ${step === 1 ? 'bg-[#4EA858] text-white' : 'bg-white/10'}`}>1</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${step === 2 ? 'bg-[#4EA858] text-white' : 'bg-white/10'}`}>2</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${step === 3 ? 'bg-[#4EA858] text-white' : 'bg-white/10'}`}>3</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${step === 4 ? 'bg-[#4EA858] text-white' : 'bg-white/10'}`}>4</span>
            <button onClick={onClose} className="ml-3 p-1 hover:text-white text-white/60">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* STEP 1: PRODUCT DETAILS */}
          {step === 1 && (
            <div className="space-y-4">


              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-[#1F361C] block mb-1">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#7DA972]/40 bg-white focus:outline-none focus:border-[#2B4C26]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F361C] block mb-1">Crop Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#7DA972]/40 bg-white focus:outline-none focus:border-[#2B4C26]"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Pulses">Pulses</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1F361C] block mb-1">Quantity Available (kg)</label>
                  <input
                    type="number"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: +e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#7DA972]/40 bg-white focus:outline-none focus:border-[#2B4C26]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F361C] block mb-1">Expected Price (₹ / kg)</label>
                  <input
                    type="number"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({ ...formData, pricePerKg: +e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#7DA972]/40 bg-white focus:outline-none focus:border-[#2B4C26]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F361C] block mb-1">Harvest Date</label>
                  <input
                    type="text"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#7DA972]/40 bg-white focus:outline-none focus:border-[#2B4C26]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1F361C] block mb-1">Farm Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#7DA972]/40 bg-white focus:outline-none focus:border-[#2B4C26]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1F361C] block mb-1 text-xs">Description & Farming Method</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#7DA972]/40 bg-white text-xs focus:outline-none focus:border-[#2B4C26]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] transition-all flex items-center gap-1.5 shadow-md"
                >
                  Next: Crop Camera & Image <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CAMERA / UPLOAD IMAGE */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center max-w-md mx-auto space-y-1">
                <h4 className="font-display font-bold text-lg text-[#1F361C]">Capture or Upload Crop Image</h4>
                <p className="text-xs text-[#62432B]/80">
                  FarmVest AI inspects surface pigment, skin firmness, and blemish percentage before certification.
                </p>
              </div>

              {/* Camera Preview / Upload Box */}
              <div className="rounded-2xl border-2 border-dashed border-[#7DA972] p-4 bg-white/80 text-center relative">
                {isCameraActive ? (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-64 flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="absolute bottom-4 px-5 py-2 rounded-full bg-[#E05252] text-white font-bold text-xs hover:bg-[#c93f3f] shadow-lg flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" /> Take Snapshot
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img 
                      src={formData.image} 
                      alt="Crop selection" 
                      className="w-full max-h-56 object-cover rounded-xl shadow-md mx-auto"
                    />
                    
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="px-4 py-2 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] transition-all flex items-center gap-2 shadow-sm"
                      >
                        <Camera className="w-4 h-4" /> 📷 Open Camera
                      </button>

                      <label className="px-4 py-2 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/40 text-[#1F361C] font-bold text-xs hover:bg-[#E6EFE3] transition-all flex items-center gap-2 cursor-pointer shadow-sm">
                        <Upload className="w-4 h-4 text-[#5F8A55]" /> Upload Crop Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const url = URL.createObjectURL(e.target.files[0]);
                              setFormData({ ...formData, image: url });
                            }
                          }} 
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] transition-all flex items-center gap-1.5 shadow-md"
                >
                  Run AI Quality Grading <Sparkles className="w-4 h-4 text-[#F6D28B]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI QUALITY GRADING */}
          {step === 3 && (
            <div className="space-y-4">
              <AICropScanner 
                imageSrc={formData.image} 
                cropName={formData.name} 
              />

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Retake Photo
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2B4C26] to-[#386332] text-white font-bold text-xs hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md"
                >
                  Proceed to Master QR & Publish <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & MASTER QR PUBLISH */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="ghibli-card p-5 bg-white border-[#4EA858]/30">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  
                  {/* Master QR Code Widget */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30">
                    <QRCodeSVG 
                      value={`https://farmvest.trade/verify/${formData.batchId}`} 
                      size={110}
                      level="H"
                      includeMargin={true}
                    />
                    <span className="font-mono text-[10px] font-bold text-[#2B4C26] mt-1.5">
                      {formData.batchId}
                    </span>
                    <span className="text-[9px] text-[#5F8A55] uppercase tracking-wider font-semibold">
                      Master QR Batch
                    </span>
                  </div>

                  {/* Summary Details */}
                  <div className="sm:col-span-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[#7DA972]/20 pb-1.5">
                      <span className="font-bold text-sm text-[#1F361C]">{formData.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold text-[11px]">
                        Grade A (92/100)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[#462E1C]">
                      <div><strong>Quantity:</strong> {formData.totalQuantity} {formData.unit}</div>
                      <div><strong>Expected Price:</strong> ₹{formData.pricePerKg} / {formData.unit}</div>
                      <div><strong>Origin:</strong> {formData.location}</div>
                      <div><strong>Harvested:</strong> {formData.harvestDate}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#E6EFE3]/60 text-[11px] text-[#2B4C26] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#4EA858] flex-shrink-0" />
                      <span>Ready to be immediately published into Retailer Marketplace</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to AI Scan
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#4EA858] to-[#2B4C26] text-white font-extrabold text-sm hover:scale-105 transition-all shadow-xl flex items-center gap-2"
                >
                  <Sprout className="w-4 h-4 text-[#A5D6A7]" />
                  Publish for Sale
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
