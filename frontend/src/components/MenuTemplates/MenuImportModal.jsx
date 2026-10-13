import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
} from 'lucide-react';

export default function MenuImportModal({
  isOpen,
  onClose,
  extractedData,
  uploadedThumbnails = [],
  onApply,
}) {
  if (!isOpen || !extractedData) return null;

  const [mode, setMode] = useState('replace'); // 'replace' | 'append'
  const [autoFillPhotos, setAutoFillPhotos] = useState(true);
  const [includeAiDescriptions, setIncludeAiDescriptions] = useState(true);
  const [previewThumbnail, setPreviewThumbnail] = useState(uploadedThumbnails[0] || null);

  // Editable local copy of extracted categories for instant review/polish
  const [categories, setCategories] = useState(
    JSON.parse(JSON.stringify(extractedData?.categories || []))
  );

  React.useEffect(() => {
    if (extractedData?.categories) {
      setCategories(JSON.parse(JSON.stringify(extractedData.categories || [])));
    }
  }, [extractedData]);

  React.useEffect(() => {
    if (uploadedThumbnails && uploadedThumbnails.length > 0) {
      setPreviewThumbnail(uploadedThumbnails[0]);
    }
  }, [uploadedThumbnails]);

  const totalDishes = (categories || []).reduce((sum, c) => sum + (c?.items?.length || 0), 0);
  const lowConfidenceDishes = (categories || []).flatMap((c) =>
    (c?.items || []).filter((i) => (i?.confidence ?? 1) < 0.85)
  );

  const handleUpdateItem = (catIdx, itemIdx, field, value) => {
    setCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[catIdx].items[itemIdx][field] = value;
      return next;
    });
  };

  const handleRemoveItem = (catIdx, itemIdx) => {
    setCategories((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[catIdx].items.splice(itemIdx, 1);
      return next.filter((c) => c.items.length > 0);
    });
  };

  const handleApplyClick = () => {
    // Process final categories based on checkboxes
    const processedCategories = categories.map((cat) => ({
      ...cat,
      items: (cat.items || []).map((item) => {
        const finalItem = { ...item };
        if (!autoFillPhotos) {
          delete finalItem.img;
        }
        if (!includeAiDescriptions && item.description_source === 'ai') {
          finalItem.description = '';
        }
        return finalItem;
      }),
    }));

    onApply({
      categories: processedCategories,
      currency: extractedData.currency || '₹',
      restaurantName: extractedData.restaurantName || '',
      mode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  🎉 Extracted {categories.length} Categories & {totalDishes} Dishes
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Currency: {extractedData.currency || '₹'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and audit your menu items before applying to your digital QR menu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amber Confidence Alert Banner */}
        {lowConfidenceDishes.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong className="font-semibold">{lowConfidenceDishes.length} items need checking:</strong> smudged text or unusual price formatting detected. Check items highlighted in amber below.
              </span>
            </div>
          </div>
        )}

        {/* Controls Strip (Checkboxes + Mode Toggle) */}
        <div className="px-6 py-3.5 bg-indigo-50/40 border-b border-indigo-100/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoFillPhotos}
                onChange={(e) => setAutoFillPhotos(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <span>Auto-fill dish photos (Unsplash Catalog)</span>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAiDescriptions}
                onChange={(e) => setIncludeAiDescriptions(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <span>Include AI-written descriptions</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">
                Allergy Safe
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setMode('replace')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                mode === 'replace'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Replace Menu
            </button>
            <button
              type="button"
              onClick={() => setMode('append')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                mode === 'append'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Append to Existing
            </button>
          </div>
        </div>

        {/* Body: Split View (Extracted Items List + Optional Side-by-side Page Preview) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Extracted Categories Column */}
          <div className={uploadedThumbnails.length > 0 ? 'lg:col-span-8 space-y-6' : 'lg:col-span-12 space-y-6'}>
            {categories.map((cat, cIdx) => (
              <div key={cat.id || cIdx} className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                    {cat.name} ({cat.items?.length || 0})
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {cat.items?.map((item, iIdx) => {
                    const isLowConfidence = (item.confidence ?? 1) < 0.85;
                    return (
                      <div
                        key={item.id || iIdx}
                        className={`p-3 rounded-xl border transition-all ${
                          isLowConfidence
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {autoFillPhotos && item.img && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(cIdx, iIdx, 'name', e.target.value)}
                                className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded outline-none flex-1 truncate"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs font-bold text-slate-400">{extractedData.currency || '₹'}</span>
                                <input
                                  type="text"
                                  value={item.price}
                                  onChange={(e) => handleUpdateItem(cIdx, iIdx, 'price', e.target.value)}
                                  className="w-16 text-right font-black text-sm text-indigo-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded outline-none tabular-nums"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.description || ''}
                                placeholder="Add description..."
                                onChange={(e) => handleUpdateItem(cIdx, iIdx, 'description', e.target.value)}
                                className="text-xs text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded outline-none w-full truncate"
                              />
                              {item.description_source === 'ai' && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold shrink-0">
                                  AI-written
                                </span>
                              )}
                              {isLowConfidence && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold shrink-0 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Check Price
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(cIdx, iIdx)}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                                title="Remove dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-Side Original Photo Preview Column */}
          {uploadedThumbnails.length > 0 && (
            <div className="lg:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 flex flex-col max-h-[70vh]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-600" /> Original Page Photo
                </span>
                <span className="text-[11px] text-slate-400">{uploadedThumbnails.length} pages</span>
              </div>

              {previewThumbnail && (
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-black/5 flex items-center justify-center relative min-h-[220px]">
                  <img
                    src={previewThumbnail}
                    alt="Menu Page"
                    className="w-full h-full object-contain max-h-[450px]"
                  />
                </div>
              )}

              {uploadedThumbnails.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {uploadedThumbnails.map((thumb, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewThumbnail(thumb)}
                      className={`w-14 h-18 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                        previewThumbnail === thumb ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={thumb} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyClick}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Apply {totalDishes} Dishes to Menu Form
          </button>
        </div>
      </div>
    </div>
  );
}
