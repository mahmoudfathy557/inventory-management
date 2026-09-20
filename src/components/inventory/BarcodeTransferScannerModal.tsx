import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  CameraOff,
  Scan,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRightLeft,
  Volume2,
  VolumeX,
  Zap,
  RotateCw,
  Search,
  Package,
  Boxes,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { RawMaterial, Product } from '../../types';

interface ScannedTransferItem {
  item: RawMaterial | Product;
  quantity: number;
  scanCount: number;
  lastScannedTime: string;
}

interface BarcodeTransferScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTransfer: (transferData: {
    fromWarehouseId: string;
    toWarehouseId: string;
    toLocationId: string;
    items: ScannedTransferItem[];
    reference: string;
    notes: string;
  }) => void;
}

export const BarcodeTransferScannerModal: React.FC<BarcodeTransferScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyTransfer
}) => {
  const { language, rawMaterials, products, warehouses, locations } = useApp();
  const isAr = language === 'ar';

  // Camera & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanMultiplier, setScanMultiplier] = useState<number>(10); // default 10 units/kg per scan
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Scanner Feedback & Last Detected Code
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastScannedItemName, setLastScannedItemName] = useState<string | null>(null);
  const [scanSuccessFlash, setScanSuccessFlash] = useState(false);
  const lastScanTimestampRef = useRef<number>(0);

  // Transfer Configuration State
  const [fromWhId, setFromWhId] = useState(warehouses[0]?.id || 'wh-raw');
  const [toWhId, setToWhId] = useState(warehouses[1]?.id || 'wh-wip');
  const [toLocId, setToLocId] = useState(locations[0]?.id || 'loc-stage-1');
  const [reference, setReference] = useState('مسح باركود شحنة التحويل');
  const [notes, setNotes] = useState('تحويل مخزني تلقائي عبر ماسح الباركود والكاميرا');

  // Scanned Items List
  const [scannedItems, setScannedItems] = useState<ScannedTransferItem[]>([]);
  const [manualCodeInput, setManualCodeInput] = useState('');

  // All valid scannable items catalog
  const allCatalogItems = [...rawMaterials, ...products];

  // Play audio chime on scan
  const playScanBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 pitch
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // High chime
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      }
    } catch {
      // Ignore audio synthesis errors
    }

    if (navigator.vibrate) {
      try {
        navigator.vibrate(60);
      } catch {}
    }
  };

  // Start Camera Stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(isAr ? 'الكاميرا غير مدعومة في هذا المتصفح' : 'Camera API not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? (isAr ? 'تم رفض إذن الوصول للكاميرا. يرجى تفعيل إذن الكاميرا من المتصفح، أو استخدام المحاكي اليدوي أدناه.' : 'Camera permission denied. Enable camera access or use the manual barcode simulator.')
          : (isAr ? 'تعذر تشغيل الكاميرا في هذه البيئة. يمكنك استخدام محاكي الباركود أدناه.' : 'Unable to access camera in this environment. You can use the barcode simulator.')
      );
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  // Toggle Flashlight / Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (err) {
        console.warn('Torch constraint error', err);
      }
    }
  };

  // Flip Front/Back Camera
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Handle scanned raw string or barcode SKU
  const processScannedCode = (rawCode: string) => {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) return;

    // Throttle to avoid repeated multi-scans of the same item within 800ms
    const now = Date.now();
    if (cleanCode === lastScannedCode && now - lastScanTimestampRef.current < 900) {
      return;
    }

    lastScanTimestampRef.current = now;

    // Find matching item by SKU code, ID, or partial name
    const found = allCatalogItems.find(
      i => i.code.toUpperCase() === cleanCode ||
           i.id.toUpperCase() === cleanCode ||
           cleanCode.includes(i.code.toUpperCase()) ||
           i.nameAr.includes(cleanCode) ||
           i.nameEn.toUpperCase().includes(cleanCode)
    );

    if (found) {
      playScanBeep();
      setLastScannedCode(found.code);
      setLastScannedItemName(isAr ? found.nameAr : found.nameEn);
      setScanSuccessFlash(true);
      setTimeout(() => setScanSuccessFlash(false), 700);

      // Increment scanned item count
      setScannedItems(prev => {
        const existingIdx = prev.findIndex(item => item.item.id === found.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + scanMultiplier,
            scanCount: updated[existingIdx].scanCount + 1,
            lastScannedTime: new Date().toLocaleTimeString()
          };
          return updated;
        } else {
          return [
            {
              item: found,
              quantity: scanMultiplier,
              scanCount: 1,
              lastScannedTime: new Date().toLocaleTimeString()
            },
            ...prev
          ];
        }
      });
    } else {
      setLastScannedCode(cleanCode);
      setLastScannedItemName(isAr ? 'صنف غير مسجل في الدليل' : 'Unknown Item SKU');
    }
  };

  // Continuous Barcode Detector Loop with Native API or Canvas fallback
  useEffect(() => {
    let animationFrameId: number;
    let detector: any = null;

    if (window && (window as any).BarcodeDetector) {
      try {
        detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'data_matrix']
        });
      } catch {
        detector = null;
      }
    }

    const scanFrame = async () => {
      if (cameraActive && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;

        // Try Native BarcodeDetector API if supported
        if (detector) {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const detectedRaw = barcodes[0].rawValue;
              if (detectedRaw) {
                processScannedCode(detectedRaw);
              }
            }
          } catch {}
        }
      }

      if (cameraActive) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    if (cameraActive) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [cameraActive, allCatalogItems, scanMultiplier, lastScannedCode]);

  // Launch camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Adjust Item Quantity manually in the scanned table
  const handleUpdateQty = (itemId: string, delta: number) => {
    setScannedItems(prev =>
      prev
        .map(item => {
          if (item.item.id === itemId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setScannedItems(prev => prev.filter(i => i.item.id !== itemId));
  };

  const handleClearAll = () => {
    setScannedItems([]);
    setLastScannedCode(null);
    setLastScannedItemName(null);
  };

  // Submit and apply the entire batch transfer
  const handleApplyTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedItems.length === 0) return;

    onApplyTransfer({
      fromWarehouseId: fromWhId,
      toWarehouseId: toWhId,
      toLocationId: toLocId,
      items: scannedItems,
      reference,
      notes
    });

    onClose();
  };

  // Financial calculations
  const totalTransferredQty = scannedItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalTransferredValue = scannedItems.reduce(
    (acc, i) => acc + i.quantity * (i.item.movingAverageCost || 100),
    0
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  {isAr ? 'ماسح الباركود الذكي للتحويل المخزني' : 'Smart Barcode Transfer Scanner'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/30 text-sky-200 border border-sky-400/30 font-semibold">
                  Camera API
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'قراءة ملصقات الأصناف والـ SKU بالكاميرا وزيادة كميات التحويل تلقائياً'
                  : 'Scan product SKU barcode labels to auto-increment transfer quantities'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={soundEnabled ? (isAr ? 'كتم الصوت' : 'Mute beep') : (isAr ? 'تفعيل الصوت' : 'Enable beep')}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns on Desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Camera Viewfinder & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-3 flex flex-col">
            {/* Viewfinder Container */}
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center group">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* High-Tech Scan Reticle & Animated Laser */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    {/* Viewfinder Frame Corners */}
                    <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-sky-400/40 rounded-2xl flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-lg" />

                      {/* Sweeping Laser Line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-lg shadow-sky-400/80 animate-bounce" />

                      {/* Center Target Dot */}
                      <div className="w-2 h-2 rounded-full bg-sky-400 shadow-md shadow-sky-400" />
                    </div>
                  </div>

                  {/* Scan Flash Feedback Effect */}
                  {scanSuccessFlash && (
                    <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-xs flex items-center justify-center transition-all animate-pulse">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isAr ? 'تم مسح الباركود بنجاح!' : 'SKU Scanned!'}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-3">
                  <CameraOff className="w-10 h-10 mx-auto text-slate-500" />
                  <p className="text-xs">{cameraError || (isAr ? 'الكاميرا متوقفة' : 'Camera is offline')}</p>
                  <button
                    onClick={() => startCamera()}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 mx-auto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تشغيل الكاميرا' : 'Start Camera'}</span>
                  </button>
                </div>
              )}

              {/* Viewfinder Overlay Controls */}
              {cameraActive && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                  {hasTorch && (
                    <button
                      onClick={toggleTorch}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition ${
                        torchOn ? 'bg-amber-500 text-slate-900' : 'bg-slate-900/70 text-white hover:bg-slate-900'
                      }`}
                      title={isAr ? 'الفلاش' : 'Flashlight'}
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={toggleCameraFacing}
                    className="p-1.5 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900 backdrop-blur-md transition"
                    title={isAr ? 'تبديل الكاميرا' : 'Flip Camera'}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Scan Incremental Multiplier Controls */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {isAr ? 'معدل الزيادة لكل مسحة باركود:' : 'Increment per scan:'}
                </span>
                <span className="font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded text-[11px]">
                  +{scanMultiplier} {isAr ? 'كجم / وحدة' : 'KG/Units'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 5, 10, 25].map(step => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setScanMultiplier(step)}
                    className={`py-1 rounded-lg text-xs font-bold transition font-mono ${
                      scanMultiplier === step
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    +{step}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual SKU Input / Barcode Simulator for Testing */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700 text-xs flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'إدخال أو محاكاة مسح الباركود:' : 'Manual Barcode / SKU Entry:'}</span>
                </label>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={e => setManualCodeInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      processScannedCode(manualCodeInput);
                      setManualCodeInput('');
                    }
                  }}
                  placeholder={isAr ? 'اكتب كود الصنف مثل: RAW-HDPE-01' : 'e.g. RAW-HDPE-01'}
                  className="flex-1 p-2 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    processScannedCode(manualCodeInput);
                    setManualCodeInput('');
                  }}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold"
                >
                  {isAr ? 'مسح' : 'Scan'}
                </button>
              </div>

              {/* Quick Sample SKU Pills */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'أصناف سريعة للاختبار بنقرة واحدة:' : 'Quick SKU simulation pills:'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {allCatalogItems.slice(0, 4).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => processScannedCode(item.code)}
                      className="px-2 py-1 rounded bg-white hover:bg-sky-50 border border-slate-200 text-[10px] font-mono text-slate-700 hover:text-sky-700 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                      <span>{item.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Scanned Manifest, Location Settings & Final Posting (7 Cols) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            {/* Warehouses Selection Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  {isAr ? 'من مستودع (المصدر):' : 'From Warehouse (Source):'}
                </label>
                <select
                  value={fromWhId}
                  onChange={e => setFromWhId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {isAr ? w.nameAr : w.nameEn} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  {isAr ? 'إلى مستودع / موقع (الوجهة):' : 'To Warehouse (Destination):'}
                </label>
                <select
                  value={toWhId}
                  onChange={e => setToWhId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {isAr ? w.nameAr : w.nameEn} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scanned Items Manifest Table */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-2xs min-h-[220px]">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-slate-900">
                    {isAr ? 'الأصناف الممسوحة في شحنة التحويل' : 'Scanned Transfer Items Manifest'}
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-sky-100 text-sky-800 font-bold font-mono text-[10px]">
                    {scannedItems.length}
                  </span>
                </div>

                {scannedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-600 hover:text-rose-800 font-medium text-[11px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isAr ? 'مسح القائمة' : 'Clear All'}</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[260px] text-xs">
                {scannedItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Scan className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                    <p className="font-medium">
                      {isAr ? 'لم يتم مسح أي أصناف بعد' : 'No items scanned yet'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isAr
                        ? 'وجّه الكاميرا نحو باركود الصنف أو استخدم المحاكي لإضافة كميات التحويل'
                        : 'Point camera at product barcode or use simulator to add items'}
                    </p>
                  </div>
                ) : (
                  scannedItems.map(({ item, quantity, scanCount, lastScannedTime }) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      {/* Item info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 truncate">
                            {isAr ? item.nameAr : item.nameEn}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {item.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                          <span>{scanCount} {isAr ? 'مسحات' : 'scans'}</span>
                          <span>•</span>
                          <span>{isAr ? 'متوسط: ' : 'MAC: '} {formatCurrency(item.movingAverageCost || 100, language)}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-slate-400">{lastScannedTime}</span>
                        </div>
                      </div>

                      {/* Quantity Stepper Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, -scanMultiplier)}
                            className="px-2 py-1 hover:bg-slate-100 text-slate-600 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1 font-mono font-bold text-slate-900 bg-slate-50 min-w-[60px] text-center">
                            {formatNumber(quantity, language)} {item.defaultUOM || 'KG'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, scanMultiplier)}
                            className="px-2 py-1 hover:bg-slate-100 text-slate-600 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total Valuation & Quantities Summary */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs shadow-md">
              <div>
                <span className="text-slate-400 block text-[11px]">
                  {isAr ? 'إجمالي الكمية المحولة عبر الباركود:' : 'Total Scanned Quantity:'}
                </span>
                <span className="font-bold text-sm font-mono text-sky-400">
                  {formatNumber(totalTransferredQty, language)} كجم
                </span>
              </div>
              <div className="text-left">
                <span className="text-slate-400 block text-[11px]">
                  {isAr ? 'إجمالي القيمة المنقولة:' : 'Total Transferred Value:'}
                </span>
                <span className="font-bold text-sm font-mono text-emerald-400">
                  {formatCurrency(totalTransferredValue, language)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={scannedItems.length === 0}
                onClick={handleApplyTransferSubmit}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition ${
                  scannedItems.length > 0
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>
                  {isAr
                    ? `ترحيل إذن التحويل (${scannedItems.length} أصناف)`
                    : `Post Transfer (${scannedItems.length} items)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
