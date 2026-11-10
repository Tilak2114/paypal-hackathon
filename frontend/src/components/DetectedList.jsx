// frontend/src/components/DetectedList.jsx
import React, { useState } from 'react';

export default function DetectedList({ subscriptions, onConfirm, loading }) {
  const [items, setItems] = useState(() => 
    subscriptions.map((s) => ({
      ...s,
      selected: s.confidence_score >= 0.85
    }))
  );

  const [editingItem, setEditingItem] = useState(null);

  const toggleSelect = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const selectedCount = items.filter((i) => i.selected).length;
  const totalMonthly = items
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + (i.billing_cycle === 'yearly' ? i.amount / 12 : i.amount), 0);

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setItems((prev) => prev.map((item) => (item.id === editingItem.id ? editingItem : item)));
    setEditingItem(null);
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Summary */}
      <div 
        className="rounded-3xl p-6 sm:p-8 space-y-3"
        style={{
          background: 'var(--card-surface)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-mint">
              AI Audit Complete
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              We found <span className="text-mint">{items.length} subscriptions</span> costing ${totalMonthly.toFixed(2)}/mo
            </h2>
            <p className="text-xs text-mute mt-1">
              Select the ones you wish to track in your Churn Guard renewal alarm dashboard.
            </p>
          </div>
          <div className="bg-bg/80 border border-line/40 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-mute uppercase">Selected Spend</span>
              <p className="font-display font-black text-xl text-mint">${totalMonthly.toFixed(2)}/mo</p>
            </div>
          </div>
        </div>

        {/* AI Insight Strip */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-coral/15 to-mint/10 border border-coral/30 flex items-center gap-3 text-xs">
          <span className="text-lg">⚡</span>
          <div className="text-white/90">
            <strong>Immediate Insights:</strong> 2 audio streaming overlaps detected (Spotify + Apple Music) & 1 free trial ending in 2 days (PixelPro).
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="space-y-3">
        {items.map((sub) => {
          const isHigh = sub.confidence_score >= 0.85;
          return (
            <div
              key={sub.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                sub.selected
                  ? 'bg-card-surface border-mint/40 shadow-[0_4px_20px_rgba(0,210,255,0.08)]'
                  : 'bg-bg2/40 border-line/30 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={sub.selected}
                  onChange={() => toggleSelect(sub.id)}
                  id={`check-${sub.id}`}
                  className="w-5 h-5 rounded border-line text-mint focus:ring-mint focus:ring-offset-0 bg-bg cursor-pointer"
                  aria-label={`Select ${sub.name}`}
                />

                {/* Logo Avatar */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-black text-slate-950 text-lg flex-shrink-0"
                  style={{ backgroundColor: sub.color || '#00d2ff' }}
                >
                  {sub.name.charAt(0)}
                </div>

                {/* Details */}
                <div className="truncate">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label htmlFor={`check-${sub.id}`} className="font-display font-bold text-white text-base tracking-tight cursor-pointer">
                      {sub.name}
                    </label>

                    {/* Confidence badge */}
                    {isHigh ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint/15 text-mint border border-mint/30">
                        {Math.round(sub.confidence_score * 100)}% match
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-coral/20 text-coral border border-coral/30">
                        Needs review ({Math.round(sub.confidence_score * 100)}%)
                      </span>
                    )}

                    {sub.flag === 'trial_ending' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-coral/20 text-coral">
                        Trial ending
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-mute mt-0.5 flex items-center gap-2">
                    <span className="text-white font-semibold">${sub.amount.toFixed(2)}/{sub.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span>
                    <span>•</span>
                    <span>Next charge: {sub.next_charge_date}</span>
                    <span>•</span>
                    <span className="capitalize">{sub.category}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setEditingItem({ ...sub })}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-mute hover:text-white border border-line/40 hover:border-line cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Drawer Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleEditSave}
            className="w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-4"
            style={{ background: 'var(--modal-bg)', border: '1px solid var(--card-border)' }}
          >
            <h3 className="font-display font-bold text-lg text-white">Edit Subscription</h3>
            <div>
              <label className="text-xs font-semibold text-mute block mb-1">Name</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-mute block mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={editingItem.amount}
                onChange={(e) => setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-line text-white text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-full text-xs text-mute hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full font-bold text-xs bg-mint text-navy shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Final Confirm Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={() => onConfirm(items.filter((i) => i.selected))}
          disabled={loading || selectedCount === 0}
          className="w-full py-4 px-8 rounded-full font-bold text-sm text-navy bg-mint transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
              <span>Saving tracked subscriptions...</span>
            </>
          ) : (
            <>
              <span>Confirm & Activate Churn Guard ({selectedCount} Selected)</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
