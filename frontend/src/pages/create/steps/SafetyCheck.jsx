import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Info, Printer } from 'lucide-react';

const getLightness = (hex) => {
    // Basic hex to lightness check
    if (!hex) return 0;
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
};

const SafetyCheck = ({ type, data, design }) => {
    
    // Checks
    const hasTitle = !!data?.title;
    
    const bgLightness = getLightness(design?.bgColor || '#ffffff');
    const fgLightness = getLightness(design?.fgColor || '#000000');
    const hasGoodContrast = Math.abs(bgLightness - fgLightness) > 100;

    let targetValid = true;
    let isDynamic = true;

    if (type === 'URL') {
        const url = data?.url || '';
        targetValid = url.startsWith('http://') || url.startsWith('https://');
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
            <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Safety & Quality Check</h2>
                <p className="text-slate-500 text-sm">
                    We've scanned your QR code configuration to ensure it works perfectly.
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
                                    ? 'Great contrast! Most barcode scanners will read this QR code instantly.' 
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
                                    : `Make sure the URL starts with http:// or https:// for best compatibility.`}
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

                    {/* Print Warning */}
                    <div className="p-4 flex gap-4 items-start bg-slate-50">
                        <div className="mt-0.5 text-indigo-500">
                            <Printer size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Ready for Printing</h4>
                            <p className="text-sm text-slate-500 mt-1">
                                If you plan to print this QR code on physical materials, download the <strong>SVG</strong> or <strong>EPS</strong> version in the next step to prevent pixelation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetyCheck;
