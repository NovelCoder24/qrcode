import React from 'react';
import { Facebook, User, FileText } from 'lucide-react';

const FacebookForm = ({ data, onChange }) => {
    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-600" />
                Facebook Page
            </h3>
            <p className="text-sm text-slate-500 mb-6">
                Link directly to your Facebook profile or page.
            </p>

            <div className="space-y-4">
                {/* Page/Profile URL */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Facebook URL *
                    </label>
                    <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                        <input
                            type="url"
                            value={data?.facebookUrl || ''}
                            onChange={(e) => updateField('facebookUrl', e.target.value)}
                            placeholder="https://facebook.com/yourpage"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Enter your Facebook profile or page URL
                    </p>
                </div>

                {/* Page Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Page/Profile Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={data?.pageName || ''}
                            onChange={(e) => updateField('pageName', e.target.value)}
                            placeholder="Your Business Name"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description (Optional)
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea
                            value={data?.description || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Follow us for updates..."
                            rows={2}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacebookForm;
