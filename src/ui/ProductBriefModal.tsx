import React, { useState } from 'react';
import { ProductBrief } from '../../shared/contracts';
import { X, Sliders, Check } from 'lucide-react';

interface ProductBriefModalProps {
  isOpen: boolean;
  productBrief: ProductBrief;
  onSave: (brief: ProductBrief) => void;
  onClose: () => void;
}

export const ProductBriefModal: React.FC<ProductBriefModalProps> = ({
  isOpen,
  productBrief,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<ProductBrief>({ ...productBrief });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[#30363d] bg-[#0d1117] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#f0883e]" />
            <h3 className="text-sm font-bold text-white">Product &amp; Buyer Persona Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white p-1 rounded-md hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white">Product Name</label>
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0883e]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white">Product One-Liner</label>
            <input
              type="text"
              value={form.oneLiner}
              onChange={(e) => setForm({ ...form, oneLiner: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0883e]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white">
              Target Buyer Persona / Role
            </label>
            <input
              type="text"
              value={form.targetBuyerRole}
              onChange={(e) => setForm({ ...form, targetBuyerRole: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0883e]"
              required
            />
            <p className="text-[11px] text-[#8b949e]">
              Used by the engine to classify target buyers vs non-buyer routing contacts.
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white">Value Proposition</label>
            <textarea
              rows={3}
              value={form.valueProposition}
              onChange={(e) => setForm({ ...form, valueProposition: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0883e]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#f0883e] hover:bg-[#d97706] text-black rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Save &amp; Recalculate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
