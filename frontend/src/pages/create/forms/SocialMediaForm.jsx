import React from 'react';
import {
    Share2, Facebook, Instagram, Twitter, Linkedin, Youtube,
    MessageCircle, Globe, Plus, X
} from 'lucide-react';

const socialPlatforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600', placeholder: 'https://facebook.com/...' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600', placeholder: '@username or URL' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-slate-800', placeholder: 'https://twitter.com/...' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', placeholder: 'https://linkedin.com/in/...' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600', placeholder: 'https://youtube.com/...' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', placeholder: '+91 98765 43210' },
    { id: 'website', name: 'Website', icon: Globe, color: 'text-indigo-600', placeholder: 'https://yourwebsite.com' },
];

const SocialMediaForm = ({ data, onChange }) => {
    const links = data?.socialLinks || [];

    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    const addSocialLink = (platformId) => {
        const platform = socialPlatforms.find(p => p.id === platformId);
        if (!platform || links.find(l => l.platform === platformId)) return;

        const newLinks = [...links, { platform: platformId, url: '' }];
        onChange({ ...data, socialLinks: newLinks });
    };

    const removeSocialLink = (platformId) => {
        const newLinks = links.filter(l => l.platform !== platformId);
        onChange({ ...data, socialLinks: newLinks });
    };

    const updateSocialLink = (platformId, url) => {
        const newLinks = links.map(l =>
            l.platform === platformId ? { ...l, url } : l
        );
        onChange({ ...data, socialLinks: newLinks });
    };

    const availablePlatforms = socialPlatforms.filter(
        p => !links.find(l => l.platform === p.id)
    );

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Social Media Links
            </h3>
            <p className="text-sm text-slate-500 mb-6">
                Create a page with all your social media links in one place.
            </p>

            <div className="space-y-4">
                {/* Page Title */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Page Title
                    </label>
                    <input
                        type="text"
                        value={data?.pageTitle || ''}
                        onChange={(e) => updateField('pageTitle', e.target.value)}
                        placeholder="Connect With Me"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Added Social Links */}
                {links.length > 0 && (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">
                            Your Social Links
                        </label>
                        {links.map((link) => {
                            const platform = socialPlatforms.find(p => p.id === link.platform);
                            if (!platform) return null;
                            const Icon = platform.icon;

                            return (
                                <div key={link.platform} className="flex items-center gap-2">
                                    <div className={`p-2 bg-slate-50 rounded-lg ${platform.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={link.url}
                                        onChange={(e) => updateSocialLink(link.platform, e.target.value)}
                                        placeholder={platform.placeholder}
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                    />
                                    <button
                                        onClick={() => removeSocialLink(link.platform)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Platform Buttons */}
                {availablePlatforms.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Add Social Platform
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availablePlatforms.map((platform) => {
                                const Icon = platform.icon;
                                return (
                                    <button
                                        key={platform.id}
                                        onClick={() => addSocialLink(platform.id)}
                                        className={`flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium text-slate-600`}
                                    >
                                        <Icon className={`w-4 h-4 ${platform.color}`} />
                                        {platform.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description (Optional)
                    </label>
                    <textarea
                        value={data?.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Follow me on social media for updates..."
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default SocialMediaForm;
