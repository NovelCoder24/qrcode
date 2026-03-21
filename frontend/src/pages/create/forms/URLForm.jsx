import React, { useState } from 'react';

const URLForm = ({ data, onChange }) => {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Website URL</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Submit URL
                    </label>
                    <input
                        type="url"
                        value={data?.url || ''}
                        onChange={(e) => onChange({ ...data, url: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        Paste the web address you want people to visit.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default URLForm;
