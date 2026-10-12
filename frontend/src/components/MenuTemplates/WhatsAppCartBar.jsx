import React, { useState, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
} from 'lucide-react';
import {
  formatCurrencyAmount,
  normalizeWhatsAppPhone,
  buildWhatsAppOrderUrl,
} from '../../utils/whatsappCart';

export function WhatsAppCartBar({
  cartSummary,
  currencySymbol = '₹',
  restaurantName = '',
  whatsappNumber = '',
  initialTableNumber = '',
  onIncrementKey,
  onDecrementKey,
  onClearCart,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tableNumber, setTableNumber] = useState(initialTableNumber || '');
  const [customerNote, setCustomerNote] = useState('');

  useEffect(() => {
    if (initialTableNumber && !tableNumber) {
      setTableNumber(initialTableNumber);
    }
  }, [initialTableNumber]);

  const normalizedPhone = normalizeWhatsAppPhone(whatsappNumber);
  if (!cartSummary || cartSummary.totalCount <= 0 || !normalizedPhone) {
    return null;
  }

  const formattedTotal = formatCurrencyAmount(
    cartSummary.totalAmount,
    currencySymbol
  );

  const waUrl = buildWhatsAppOrderUrl({
    phone: normalizedPhone,
    restaurantName,
    currencySymbol,
    items: cartSummary.items,
    totalAmount: cartSummary.totalAmount,
    tableNumber,
    customerNote,
  });

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 pointer-events-none">
      <div className="max-w-[410px] mx-auto pointer-events-auto">
        <div className="bg-slate-950/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white">
          {/* Expandable Cart Drawer */}
          {isExpanded && (
            <div className="p-4 border-b border-white/10 space-y-3 max-h-[55vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Your Order ({cartSummary.totalCount}{' '}
                    {cartSummary.totalCount === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    if (onClearCart) onClearCart();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>

              {/* Itemized List */}
              <div className="divide-y divide-white/10">
                {cartSummary.items.map((item) => (
                  <div
                    key={item.key}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400 tabular-nums">
                        {formatCurrencyAmount(item.unitPrice, currencySymbol)}{' '}
                        each •{' '}
                        <span className="text-emerald-400 font-semibold">
                          {formatCurrencyAmount(item.lineTotal, currencySymbol)}
                        </span>
                      </p>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-white/10 border border-white/15 text-xs font-bold tabular-nums">
                      <button
                        type="button"
                        onClick={() => onDecrementKey && onDecrementKey(item.key, item)}
                        aria-label={`Remove one ${item.name}`}
                        className="px-2.5 py-1 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 min-w-[1.5rem] text-center">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncrementKey && onIncrementKey(item.key, item)}
                        aria-label={`Add one more ${item.name}`}
                        className="px-2.5 py-1 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optional Table # & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Table # (e.g. Table 4)"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                />
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Cooking note (optional)"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          {/* Compact Summary Strip + Sticky WhatsApp Button */}
          <div className="p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1.5">
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer truncate max-w-[78%]"
              >
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] tabular-nums shrink-0">
                  {cartSummary.totalCount}{' '}
                  {cartSummary.totalCount === 1 ? 'item' : 'items'}
                </span>
                <span className="truncate text-slate-300">
                  {cartSummary.items
                    .map((i) => `${i.qty}x ${i.name}`)
                    .join(', ')}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 shrink-0 cursor-pointer"
              >
                {isExpanded ? 'Hide Details' : 'Add Table / Note'}
              </button>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-slate-950 font-extrabold text-sm sm:text-base tracking-tight flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all text-center tabular-nums"
            >
              <span>🟢 Send Order on WhatsApp ({formattedTotal})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppCartBar;
