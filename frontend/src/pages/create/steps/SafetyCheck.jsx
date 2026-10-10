import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Info, Printer, Navigation, MapPin } from 'lucide-react';

const getLightness = (hex) => {
    if (!hex) return 0;
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
};

const SafetyCheck = ({ type, data, design, onChange }) => {
    const hasTitle = !!data?.title;

    const bgLightness = getLightness(design?.bgColor || '#ffffff');
    const fgLightness = getLightness(design?.fgColor || '#000000');
    const hasGoodContrast = Math.abs(bgLightness - fgLightness) > 100;

    let targetValid = true;
    if (type === 'URL') {
        const url = data?.url || '';
        targetValid = url.startsWith('http://') || url.startsWith('https://');
    }

    const placement = data?.placement || { city: '', region: '', country: 'India', country_code: 'IN', label: '' };

    const updatePlacement = (field, value) => {
        onChange?.({
            ...data,
            placement: {
                ...placement,
                country: placement.country || 'India',
                country_code: placement.country_code || 'IN',
                [field]: value
            }
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
            <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Safety & Location Configuration</h2>
                <p className="text-slate-500 text-sm">
                    Verify scan quality and configure how location analytics are captured for this QR code.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Pre-flight Checklist</span>
                    <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full">All Systems Go</span>
                </div>

                <div className="divide-y divide-slate-100">
                    {/* Contrast Check */}
                    <div className="p-4 flex gap-4 items-start">
                        <div className={`mt-0.5 ${hasGoodContrast ? 'text-green-500' : 'text-amber-500'}`}>
                            {hasGoodContrast ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Color Contrast</h4>
                            <p className="text-sm text-slate-500 mt-1">
                                {hasGoodContrast
                                    ? 'Great contrast. Most barcode scanners will read this QR code instantly.'
                                    : 'Low contrast detected. Some older phones might struggle to scan this. Consider making the primary color darker.'}
                            </p>
                        </div>
                    </div>

                    {/* Target Validation */}
                    <div className="p-4 flex gap-4 items-start">
                        <div className={`mt-0.5 ${targetValid ? 'text-green-500' : 'text-red-500'}`}>
                            {targetValid ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Destination Valid</h4>
                            <p className="text-sm text-slate-500 mt-1">
                                {targetValid
                                    ? `Target data for ${type} is formatted correctly.`
                                    : 'Make sure the URL starts with http:// or https:// for best compatibility.'}
                            </p>
                        </div>
                    </div>

                    {/* Title & Metadata */}
                    <div className="p-4 flex gap-4 items-start">
                        <div className={`mt-0.5 ${hasTitle ? 'text-green-500' : 'text-blue-500'}`}>
                            {hasTitle ? <CheckCircle2 size={20} /> : <Info size={20} />}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Organization</h4>
                            <p className="text-sm text-slate-500 mt-1">
                                {hasTitle
                                    ? 'Title set. This will be easy to find in your dashboard later.'
                                    : 'No custom title set. We will automatically generate a generic title for your dashboard.'}
                            </p>
                        </div>
                    </div>

                    {/* Physical Venue Placement Metadata (Highest ROI, Zero Friction) */}
                    <div className="p-4 flex gap-4 items-start bg-emerald-50/40">
                        <div className="mt-0.5 text-emerald-600">
                            <MapPin size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-900">Physical Venue Placement (Optional — Recommended for Fixed QRs)</h4>
                                <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">0ms Friction</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Mobile 4G/5G carriers (Jio, Airtel, Vi) route traffic through regional gateway hubs like Mumbai or Delhi. If this QR code stays at a fixed physical venue (café table, retail counter, event booth), enter its city below for 100% location accuracy with zero delay.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                <div>
                                    <label htmlFor="placement-city" className="block text-xs font-medium text-slate-700 mb-1">City</label>
                                    <input
                                        id="placement-city"
                                        type="text"
                                        placeholder="e.g. Pune"
                                        value={placement.city || ''}
                                        onChange={(e) => updatePlacement('city', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="placement-region" className="block text-xs font-medium text-slate-700 mb-1">State / Region</label>
                                    <input
                                        id="placement-region"
                                        type="text"
                                        placeholder="e.g. Maharashtra"
                                        value={placement.region || ''}
                                        onChange={(e) => updatePlacement('region', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="placement-label" className="block text-xs font-medium text-slate-700 mb-1">Venue Label</label>
                                    <input
                                        id="placement-label"
                                        type="text"
                                        placeholder="e.g. FC Road, Table 4"
                                        value={placement.label || ''}
                                        onChange={(e) => updatePlacement('label', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Opt-In GPS Consent Interstitial Toggle */}
                    <div className="p-4 flex gap-4 items-start bg-indigo-50/50 transition-colors">
                        <div className="mt-0.5 text-indigo-600">
                            <Navigation size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-900">Opt-In GPS Consent Prompt (Enrichment Sample)</h4>
                                <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle Opt-In GPS Consent Prompt">
                                    <input
                                        type="checkbox"
                                        checked={!!data?.gpsLocationEnabled}
                                        onChange={(e) => onChange?.({ ...data, gpsLocationEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                <strong>Trade-off notice:</strong> Adds a tap-to-consent screen before redirecting (adds up to 2.2s and a browser permission prompt; typically 10–25% of scanners opt in, and it is automatically skipped in Instagram/WhatsApp in-app browsers). Only city and region are stored for DPDP compliance.
                            </p>
                        </div>
                    </div>

                    {/* Print Warning */}
                    <div className="p-4 flex gap-4 items-start bg-slate-50">
                        <div className="mt-0.5 text-indigo-500">
                            <Printer size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Ready for Printing</h4>
                            <p className="text-sm text-slate-500 mt-1">
                                If you plan to print this QR code on physical materials, download the <strong>SVG</strong> or <strong>PDF</strong> version in the next step to prevent pixelation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetyCheck;
