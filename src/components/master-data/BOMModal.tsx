import React, { useState, useEffect } from 'react';
import { X, Boxes, Plus, Trash2, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BOM, BOMLine } from '../../types';

interface BOMModalProps {
  isOpen: boolean;
  bom?: BOM | null;
  onClose: () => void;
}

export const BOMModal: React.FC<BOMModalProps> = ({ isOpen, bom, onClose }) => {
  const { language, products, rawMaterials, locations, saveBOM, currentUser } = useApp();
  const isAr = language === 'ar';

  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [productId, setProductId] = useState('');
  const [version, setVersion] = useState('1.0');
  const [status, setStatus] = useState<'DRAFT' | 'APPROVED' | 'INACTIVE'>('APPROVED');
  const [lines, setLines] = useState<BOMLine[]>([]);

  useEffect(() => {
    if (bom) {
      setCode(bom.code);
      setNameAr(bom.nameAr);
      setNameEn(bom.nameEn);
      setProductId(bom.productId);
      setVersion(bom.version);
      setStatus(bom.status);
      setLines(bom.lines.map(l => ({ ...l })));
    } else {
      const defaultProd = products[0];
      setCode(`BOM-PIPE-${Math.floor(100 + Math.random() * 900)}`);
      setNameAr(defaultProd ? `قائمة تشغيل ${defaultProd.nameAr}` : 'قائمة مواد جديدة');
      setNameEn(defaultProd ? `BOM for ${defaultProd.nameEn}` : 'New Bill of Materials');
      setProductId(defaultProd ? defaultProd.id : '');
      setVersion('1.0');
      setStatus('APPROVED');

      // Prepopulate 1 sample line if available
      if (rawMaterials.length > 0) {
        const rm = rawMaterials[0];
        setLines([
          {
            id: `line-${Date.now()}-1`,
            rawMaterialId: rm.id,
            rawMaterialCode: rm.code,
            rawMaterialName: rm.nameAr,
            quantity: 1.111,
            uom: rm.defaultUOM,
            sequence: 1,
            productionStage: locations[0]?.stageName || 'مرحلة 1',
            mandatory: true
          }
        ]);
      } else {
        setLines([]);
      }
    }
  }, [bom, isOpen, products, rawMaterials, locations]);

  if (!isOpen) return null;

  const handleProductChange = (prodId: string) => {
    setProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod && !bom) {
      setNameAr(`قائمة تشغيل ${prod.nameAr}`);
      setNameEn(`BOM for ${prod.nameEn}`);
      setCode(`BOM-${prod.code}`);
    }
  };

  const handleAddLine = () => {
    const rm = rawMaterials[0];
    if (!rm) return;
    const newLine: BOMLine = {
      id: `line-${Date.now()}-${lines.length + 1}`,
      rawMaterialId: rm.id,
      rawMaterialCode: rm.code,
      rawMaterialName: rm.nameAr,
      quantity: 1.0,
      uom: rm.defaultUOM,
      sequence: lines.length + 1,
      productionStage: locations[0]?.stageName || 'مرحلة 1',
      mandatory: true
    };
    setLines(prev => [...prev, newLine]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineMaterialChange = (idx: number, rmId: string) => {
    const rm = rawMaterials.find(r => r.id === rmId);
    if (!rm) return;
    setLines(prev =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              rawMaterialId: rm.id,
              rawMaterialCode: rm.code,
              rawMaterialName: rm.nameAr,
              uom: rm.defaultUOM
            }
          : l
      )
    );
  };

  const handleLineQtyChange = (idx: number, qty: number) => {
    setLines(prev =>
      prev.map((l, i) => (i === idx ? { ...l, quantity: qty } : l))
    );
  };

  const handleLineStageChange = (idx: number, stage: string) => {
    setLines(prev =>
      prev.map((l, i) => (i === idx ? { ...l, productionStage: stage } : l))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === productId) || products[0];
    if (!prod) return;

    const finalBom: BOM = {
      id: bom?.id || `bom-${Date.now()}`,
      code: code.trim(),
      productId: prod.id,
      productCode: prod.code,
      productName: prod.nameAr,
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      version: version.trim() || '1.0',
      effectiveFrom: bom?.effectiveFrom || new Date().toISOString().split('T')[0],
      status,
      approvalStatus: 'APPROVED',
      approvedBy: currentUser?.fullName || 'System Admin',
      approvedDate: new Date().toISOString().split('T')[0],
      lines: lines.map((l, index) => ({
        ...l,
        sequence: index + 1
      }))
    };

    saveBOM(finalBom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {bom
                  ? isAr ? 'تعديل قائمة المواد (BOM)' : 'Edit Bill of Materials'
                  : isAr ? 'إنشاء قائمة مواد صناعية جديدة (BOM)' : 'Create New Bill of Materials'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'تحديد نسب استهلاك الخامات لكل وحدة منتج تام معتمدة لأمر الإنتاج' : 'Specify raw material consumption rates per finished goods unit'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'كود قائمة المواد (BOM Code) *' : 'BOM Code *'}
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="مثال: BOM-PIPE-50MM"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'المنتج التام المرتبط *' : 'Finished Product *'}
              </label>
              <select
                value={productId}
                onChange={e => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {isAr ? p.nameAr : p.nameEn} ({p.defaultUOM})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'اسم قائمة المواد *' : 'BOM Name *'}
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'رقم الإصدار' : 'Version'}
              </label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Component Lines Table */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>{isAr ? 'بنود ومكونات الخامات المطلوبة' : 'Component Raw Materials'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">
                  {lines.length}
                </span>
              </h4>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة خامة' : 'Add Material'}</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">{isAr ? 'المادة الخام' : 'Raw Material'}</th>
                    <th className="p-2.5 w-36">{isAr ? 'الكمية المطلوبة لكل وحدة' : 'Qty / Finished Unit'}</th>
                    <th className="p-2.5 w-36">{isAr ? 'مرحلة الإنتاج' : 'Production Stage'}</th>
                    <th className="p-2.5 w-12 text-center">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => (
                    <tr key={line.id || idx} className="hover:bg-slate-50/60">
                      <td className="p-2">
                        <select
                          value={line.rawMaterialId}
                          onChange={e => handleLineMaterialChange(idx, e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                        >
                          {rawMaterials.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.code} - {isAr ? r.nameAr : r.nameEn} ({r.defaultUOM})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            required
                            value={line.quantity}
                            onChange={e => handleLineQtyChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded border border-slate-200 font-mono font-bold text-blue-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <span className="text-slate-500 font-mono text-[11px] shrink-0">{line.uom}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={line.productionStage || ''}
                          onChange={e => handleLineStageChange(idx, e.target.value)}
                          placeholder="مرحلة 1"
                          className="w-full px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        {isAr ? 'لا توجد خامات مضافة بعد، اضغط "إضافة خامة"' : 'No materials added yet. Click "Add Material"'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={lines.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'اعتماد وحفظ قائمة BOM' : 'Save BOM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
