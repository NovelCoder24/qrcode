import React from 'react';
import AccordionItem from '../../../components/UI/AccordionItem';
import { Frame, Grid, Box, Image, MousePointer2 } from 'lucide-react';
import { uploadFile } from '../../../api/axios';
import PhoneMockup from '../../../components/Create/PhoneMockup';

const DesignStudio = ({ type, data, design, onChange }) => {

    const handleColorChange = (key, value) => {
        onChange({ ...design, [key]: value });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await uploadFile(file);
            onChange({ ...design, logoUrl: res.url });
        } catch (error) {
            console.error("Logo upload failed", error);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Design Your QR Code</h2>
                <p className="text-slate-500 text-sm">
                    Customize the colors, shape, and logo of your QR code to match your brand.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Left Side: Controls */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    {/* 1. Frame */}
                    <AccordionItem title="Frame" icon={Frame}>
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">Select a frame style for your QR code.</p>
                            <div className="grid grid-cols-3 gap-3">
                                {['none', 'simple', 'rounded', 'banner'].map(style => (
                                    <button
                                        key={style}
                                        onClick={() => onChange({ ...design, frame: style })}
                                        className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 capitalize transition-colors
                                            ${design?.frame === style ? 'border-slate-900 bg-slate-50 text-slate-900 font-medium shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}
                                        `}
                                    >
                                        <span className="text-xs">{style}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </AccordionItem>

                    {/* 2. QR Code Pattern (Dots & Colors) */}
                    <AccordionItem title="QR Code Pattern" icon={Grid} defaultOpen={true}>
                        <div className="space-y-6">
                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">Primary Color</label>
                                    <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-xl">
                                        <input
                                            type="color"
                                            value={design?.fgColor || '#000000'}
                                            onChange={(e) => handleColorChange('fgColor', e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                        />
                                        <span className="text-sm text-slate-600 font-mono uppercase">{design?.fgColor || '#000000'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">Background Color</label>
                                    <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-xl">
                                        <input
                                            type="color"
                                            value={design?.bgColor || '#ffffff'}
                                            onChange={(e) => handleColorChange('bgColor', e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                        />
                                        <span className="text-sm text-slate-600 font-mono uppercase">{design?.bgColor || '#ffffff'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Gradient Toggle & Setup */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-800">Enable Gradient</label>
                                    <button
                                        onClick={() => onChange({ ...design, gradientType: design?.gradientType && design.gradientType !== 'none' ? 'none' : 'linear' })}
                                        className={`w-11 h-6 rounded-full relative transition-colors ${design?.gradientType && design.gradientType !== 'none' ? 'bg-slate-900' : 'bg-slate-300'}`}
                                    >
                                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${design?.gradientType && design.gradientType !== 'none' ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                                
                                {design?.gradientType && design.gradientType !== 'none' && (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 mt-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-2">Secondary Color</label>
                                            <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-xl bg-white">
                                                <input
                                                    type="color"
                                                    value={design?.fgColor2 || '#4F46E5'}
                                                    onChange={(e) => handleColorChange('fgColor2', e.target.value)}
                                                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                                />
                                                <span className="text-sm text-slate-600 font-mono uppercase">{design?.fgColor2 || '#4F46E5'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-2">Gradient Type</label>
                                            <div className="flex gap-2">
                                                {['linear', 'radial'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => onChange({ ...design, gradientType: type })}
                                                        className={`flex-1 py-2 text-xs border rounded-xl capitalize transition-colors
                                                            ${design?.gradientType === type ? 'border-slate-900 bg-slate-900 text-white font-medium' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}
                                                        `}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dot Style */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Pattern Style</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['square', 'dots', 'rounded', 'extra-rounded', 'classy'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => onChange({ ...design, qrStyle: style })}
                                            className={`py-2.5 text-xs border rounded-xl capitalize font-medium transition-colors
                                                ${design?.qrStyle === style ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                                            `}
                                        >
                                            {style.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AccordionItem>

                    {/* 3. QR Code Corners */}
                    <AccordionItem title="QR Code Corners" icon={Box}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Corner Color</label>
                                <div className="flex items-center gap-2 border border-slate-200 p-2 rounded-xl w-1/2">
                                    <input
                                        type="color"
                                        value={design?.eyeColor || '#000000'}
                                        onChange={(e) => handleColorChange('eyeColor', e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                    />
                                    <span className="text-sm text-slate-600 font-mono uppercase">{design?.eyeColor || '#000000'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Corner Shape</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['square', 'dot', 'extra-rounded'].map(shape => (
                                        <button
                                            key={shape}
                                            onClick={() => onChange({ ...design, eyeShape: shape })}
                                            className={`py-2.5 text-xs border rounded-xl capitalize font-medium transition-colors
                                                ${design?.eyeShape === shape ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                                            `}
                                        >
                                            {shape.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AccordionItem>

                    {/* 4. Add Logo */}
                    <AccordionItem title="Add Logo" icon={Image}>
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">Upload a logo to display in the center.</p>

                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                                {design?.logoUrl ? (
                                    <div className="flex items-center gap-4">
                                        <img src={design.logoUrl} alt="Logo" className="w-16 h-16 object-contain bg-white border border-slate-200 p-2 rounded-lg" />
                                        <button onClick={() => onChange({ ...design, logoUrl: null })} className="text-sm text-red-600 font-medium hover:text-red-700">Remove Logo</button>
                                    </div>
                                ) : (
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 transition-colors" />
                                )}
                            </div>
                        </div>
                    </AccordionItem>
                </div>

                {/* Right Side: Preview */}
                <div className="lg:col-span-5">
                    <div className="sticky top-24 w-full flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <h3 className="text-sm font-semibold text-slate-700 mb-6 uppercase tracking-wider">Live Preview</h3>
                        <PhoneMockup
                            type={type}
                            data={data}
                            design={design}
                            step={3}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignStudio;
