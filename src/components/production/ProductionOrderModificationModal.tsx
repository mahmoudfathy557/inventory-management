import React, { useState, useEffect } from 'react';
import { X, GitCommit, Save, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionOrder, BOM } from '../../types';
import { formatNumber } from '../../utils/formatters';

interface ProductionOrderModificationModalProps {
  isOpen: boolean;
  order: ProductionOrder | null;
  onClose: () => void;
}

export const ProductionOrderModificationModal: React.FC<ProductionOrderModificationModalProps> = ({
  isOpen,
  order,
  onClose
}) => {
  const { language, boms, machines, locations, modifyProductionOrder, currentUser } = useApp();
  const isAr = language === 'ar';

  const [plannedQuantity, setPlannedQuantity] = useState(0);
  const [selectedBomId, setSelectedBomId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [productionStage, setProductionStage] = useState('');
  const [reason, setReason] = useState('');
  const [materialQuantities, setMaterialQuantities] = useState<{ [matId: string]: number }>({});

  useEffect(() => {
    if (order) {
      setPlannedQuantity(order.plannedQuantity);
      setSelectedBomId(order.bomId);
      setSelectedMachineId(order.machineId || '');
      setProductionStage(order.productionStage || 'التشغيل الصناعي');
      setReason('');

      const initialMatQty: { [matId: string]: number } = {};
      (order.materials || []).forEach(m => {
        initialMatQty[m.rawMaterialId] = m.plannedQty;
      });
      setMaterialQuantities(initialMatQty);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const currentVersion = order.version || 1;
  const nextVersion = currentVersion + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const chosenBom = boms.find(b => b.id === selectedBomId) || { code: order.bomCode, version: order.bomVersion };
    const chosenMachine = machines.find(m => m.id === selectedMachineId);

    // Update material lines with adjusted quantities
    const updatedMaterials = (order.materials || []).map(m => {
      const updatedPlanned = materialQuantities[m.rawMaterialId] !== undefined
        ? materialQuantities[m.rawMaterialId]
        : m.plannedQty;
      return {
        ...m,
        plannedQty: updatedPlanned
      };
    });

    modifyProductionOrder(
      order.id,
      {
        plannedQuantity,
        bomId: selectedBomId,
        bomCode: chosenBom.code,
        bomVersion: chosenBom.version,
        machineId: chosenMachine?.id,
        machineName: chosenMachine ? (isAr ? chosenMachine.nameAr : chosenMachine.nameEn) : undefined,
        productionStage,
        materials: updatedMaterials
      },
      reason.trim()
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <GitCommit className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'طلب تعديل أمر الإنتاج (Section 18)' : 'Production Order Modification'}
              </h3>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                v{currentVersion} ➔ v{nextVersion}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'إصدار نسخة تعديل جديدة معتمدة دون الكتابة فوق النسخة الأصلية وحفظ سجل التغييرات الكامل'
                : 'Issue an approved new version (Section 18) without overwriting original records.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Order Info Badge */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500">{isAr ? 'أمر الإنتاج:' : 'Order No:'} </span>
              <span className="font-mono font-bold text-blue-700">{order.orderNumber}</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="font-semibold text-slate-800">{order.productName}</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">{order.productionDate}</span>
          </div>

          {/* Planned Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الكمية المخططة الجديدة:' : 'New Planned Quantity:'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={plannedQuantity}
                  onChange={e => setPlannedQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <span className="text-slate-500 font-mono shrink-0">{order.uom}</span>
              </div>
            </div>

            {/* BOM Formula Selection */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'قائمة المواد والمعادلة (BOM):' : 'BOM / Formula:'}
              </label>
              <select
                value={selectedBomId}
                onChange={e => setSelectedBomId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              >
                {boms.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.code} (v{b.version}) - {isAr ? b.nameAr : b.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Machine & Production Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الماكينة / خط الإنتاج:' : 'Machine / Line:'}
              </label>
              <select
                value={selectedMachineId}
                onChange={e => setSelectedMachineId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              >
                <option value="">{isAr ? '-- غير محدد --' : '-- None --'}</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {isAr ? m.nameAr : m.nameEn} ({m.productionStage})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'مرحلة الإنتاج:' : 'Production Stage:'}
              </label>
              <input
                type="text"
                value={productionStage}
                onChange={e => setProductionStage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Raw Material Quantities Adjustment */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
              <span>{isAr ? 'تعديل كميات الخامات المخططة:' : 'Adjust Raw Material Quantities:'}</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {isAr ? 'يمكن تغيير حصة أي خامة للتشغيل' : 'Optionally tune material requirements'}
              </span>
            </div>
            <div className="p-2 divide-y divide-slate-100">
              {(order.materials || []).map(m => (
                <div key={m.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{m.rawMaterialName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.rawMaterialCode}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">{isAr ? 'الكمية:' : 'Qty:'}</span>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      value={materialQuantities[m.rawMaterialId] !== undefined ? materialQuantities[m.rawMaterialId] : m.plannedQty}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setMaterialQuantities(prev => ({ ...prev, [m.rawMaterialId]: val }));
                      }}
                      className="w-28 px-2 py-1 rounded border border-slate-200 font-mono font-bold text-blue-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <span className="text-slate-500 font-mono text-[11px] shrink-0">{m.uom}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modification Reason (Mandatory per Section 18) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'سبب التعديل ومبرر الإصدار (إلزامي للتدقيق):' : 'Reason for Modification (Mandatory for Audit):'}
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={isAr ? 'مثال: تعديل كمية الأمر بناءً على طلب العميل وزيادة مادة التثبيت الحراري' : 'e.g. Customer order increase or temperature formula change'}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Action buttons */}
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
              disabled={!reason.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? `اعتماد وحفظ النسخة v${nextVersion}` : `Save as Version v${nextVersion}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
