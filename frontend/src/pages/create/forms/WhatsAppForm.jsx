import React from 'react';
import { MessageCircle, Phone, FileText } from 'lucide-react';

const WhatsAppForm = ({ data, onChange }) => {
    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    // Generate WhatsApp link preview
    const getWhatsAppLink = () => {
        if (!data?.phoneNumber) return '';
        const cleanNumber = data.phoneNumber.replace(/\D/g, '');
        const message = data.prefillMessage ? `?text=${encodeURIComponent(data.prefillMessage)}` : '';
        return `wa.me/${cleanNumber}${message}`;
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                WhatsApp Chat
            </h3>
            <p className="text-sm text-slate-500 mb-6">
                Let customers start a WhatsApp conversation with you instantly.
            </p>

            <div className="space-y-4">
                {/* Phone Number */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        WhatsApp Number *
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="tel"
                            value={data?.phoneNumber || ''}
                            onChange={(e) => updateField('phoneNumber', e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Include country code (e.g., +91 for India)
                    </p>
                </div>

                {/* Link Preview */}
                {data?.phoneNumber && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs font-medium text-slate-500 mb-1">WhatsApp Link</p>
                        <p className="text-sm text-green-600 font-medium break-all">
                            {getWhatsAppLink()}
                        </p>
                    </div>
                )}

                {/* Pre-filled Message */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Pre-filled Message (Optional)
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea
                            value={data?.prefillMessage || ''}
                            onChange={(e) => updateField('prefillMessage', e.target.value)}
                            placeholder="Hi! I scanned your QR code and would like to..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        This message will be pre-filled when users open the chat
                    </p>
                </div>

                {/* Business Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Business/Contact Name
                    </label>
                    <input
                        type="text"
                        value={data?.contactName || ''}
                        onChange={(e) => updateField('contactName', e.target.value)}
                        placeholder="Your Business Name"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
};

export default WhatsAppForm;
