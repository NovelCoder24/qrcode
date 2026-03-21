import React from 'react';
import { Instagram, User, FileText } from 'lucide-react';

const InstagramForm = ({ data, onChange }) => {
    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-600" />
                Instagram Profile
            </h3>
            <p className="text-sm text-slate-500 mb-6">
                Link directly to your Instagram profile.
            </p>

            <div className="space-y-4">
                {/* Username */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Instagram Username *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                        <input
                            type="text"
                            value={data?.username || ''}
                            onChange={(e) => updateField('username', e.target.value.replace('@', ''))}
                            placeholder="yourusername"
                            className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Enter your Instagram username without the @ symbol
                    </p>
                </div>

                {/* Profile URL (auto-generated preview) */}
                {data?.username && (
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-pink-100">
                        <p className="text-xs font-medium text-slate-500 mb-1">Profile URL</p>
                        <p className="text-sm text-pink-600 font-medium">
                            instagram.com/{data.username}
                        </p>
                    </div>
                )}

                {/* Display Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Display Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={data?.displayName || ''}
                            onChange={(e) => updateField('displayName', e.target.value)}
                            placeholder="Your Name or Brand"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bio (Optional)
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea
                            value={data?.bio || ''}
                            onChange={(e) => updateField('bio', e.target.value)}
                            placeholder="Follow for daily updates..."
                            rows={2}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstagramForm;
