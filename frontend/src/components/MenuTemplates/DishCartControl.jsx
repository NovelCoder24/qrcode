import React from 'react';
import { Plus, Minus } from 'lucide-react';

export function DishCartControl({
  qty = 0,
  onAdd,
  onIncrement,
  onDecrement,
  dishName = 'Item',
  variant = 'light',
}) {
  const handleStop = (e, cb) => {
    e.stopPropagation();
    if (cb) cb();
  };

  const stylesByVariant = {
    light: {
      addBtn:
        'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs',
      stepperWrap:
        'bg-emerald-600 text-white border border-emerald-600 shadow-sm',
      stepperBtn: 'hover:bg-emerald-700 text-white',
    },
    playful: {
      addBtn:
        'bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 shadow-xs',
      stepperWrap:
        'bg-rose-500 text-white border-2 border-rose-500 shadow-sm',
      stepperBtn: 'hover:bg-rose-600 text-white',
    },
    dark: {
      addBtn:
        'bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#d4af37] border border-[#d4af37]/40',
      stepperWrap:
        'bg-[#d4af37] text-[#0d0a0b] border border-[#d4af37] shadow-md',
      stepperBtn: 'hover:bg-black/10 text-[#0d0a0b]',
    },
    lighthouse: {
      addBtn:
        'bg-[#2C2B29] hover:bg-[#1a1918] text-[#FBF9F6] border border-[#2C2B29]',
      stepperWrap:
        'bg-[#2C2B29] text-[#FBF9F6] border border-[#2C2B29] shadow-sm',
      stepperBtn: 'hover:bg-white/15 text-[#FBF9F6]',
    },
  };

  const theme = stylesByVariant[variant] || stylesByVariant.light;

  if (qty <= 0) {
    return (
      <button
        type="button"
        onClick={(e) => handleStop(e, onAdd || onIncrement)}
        aria-label={`Add ${dishName} to order`}
        className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95 cursor-pointer select-none shrink-0 ${theme.addBtn}`}
      >
        <span>+ Add</span>
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center rounded-full text-xs font-bold tabular-nums overflow-hidden shrink-0 select-none ${theme.stepperWrap}`}
    >
      <button
        type="button"
        onClick={(e) => handleStop(e, onDecrement)}
        aria-label={`Decrease quantity of ${dishName}`}
        className={`px-2.5 py-1.5 flex items-center justify-center transition-colors cursor-pointer ${theme.stepperBtn}`}
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
      <span className="px-2 min-w-[1.5rem] text-center font-extrabold text-xs">
        {qty}
      </span>
      <button
        type="button"
        onClick={(e) => handleStop(e, onIncrement)}
        aria-label={`Increase quantity of ${dishName}`}
        className={`px-2.5 py-1.5 flex items-center justify-center transition-colors cursor-pointer ${theme.stepperBtn}`}
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}

export default DishCartControl;
