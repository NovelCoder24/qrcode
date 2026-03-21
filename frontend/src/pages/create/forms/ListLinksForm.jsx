import React from 'react';
import { Plus, Trash2, GripVertical, Link } from 'lucide-react';

const ListLinksForm = ({ data, onChange }) => {
    const links = data?.links || [{ title: '', url: '' }];

    const addLink = () => {
        onChange({ ...data, links: [...links, { title: '', url: '' }] });
    };

    const removeLink = (index) => {
        if (links.length === 1) return;
        const newLinks = links.filter((_, i) => i !== index);
        onChange({ ...data, links: newLinks });
    };

    const updateLink = (index, field, value) => {
        const newLinks = [...links];
        newLinks[index] = { ...newLinks[index], [field]: value };
        onChange({ ...data, links: newLinks });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">List of Links</h3>
            <p className="text-sm text-slate-500 mb-6">
                Add multiple links that users can choose from when they scan your QR code.
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
                        onChange={(e) => onChange({ ...data, pageTitle: e.target.value })}
                        placeholder="My Links"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Links List */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                        Links
                    </label>
                    {links.map((link, index) => (
                        <div key={index} className="flex items-start gap-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-slate-300 mt-2">
                                <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    value={link.title}
                                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                                    placeholder="Link Title"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                />
                                <div className="relative">
                                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => removeLink(index)}
                                disabled={links.length === 1}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add Link Button */}
                <button
                    onClick={addLink}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Another Link
                </button>
            </div>
        </div>
    );
};

export default ListLinksForm;
