import React from 'react';
import { User, Mail, Phone, Building2, Globe, MapPin } from 'lucide-react';

const VCardForm = ({ data, onChange }) => {
    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Contact Card (vCard)</h3>
            <p className="text-sm text-slate-500 mb-6">
                Create a digital business card that can be saved directly to contacts.
            </p>

            <div className="space-y-4">
                {/* Name Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            First Name *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={data?.firstName || ''}
                                onChange={(e) => updateField('firstName', e.target.value)}
                                placeholder="John"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            value={data?.lastName || ''}
                            onChange={(e) => updateField('lastName', e.target.value)}
                            placeholder="Doe"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Organization */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Company / Organization
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={data?.organization || ''}
                            onChange={(e) => updateField('organization', e.target.value)}
                            placeholder="Acme Inc."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Job Title */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Job Title
                    </label>
                    <input
                        type="text"
                        value={data?.jobTitle || ''}
                        onChange={(e) => updateField('jobTitle', e.target.value)}
                        placeholder="Software Engineer"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="tel"
                                value={data?.phone || ''}
                                onChange={(e) => updateField('phone', e.target.value)}
                                placeholder="+1 234 567 8900"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                value={data?.email || ''}
                                onChange={(e) => updateField('email', e.target.value)}
                                placeholder="john@example.com"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Website */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Website
                    </label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="url"
                            value={data?.website || ''}
                            onChange={(e) => updateField('website', e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Address
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea
                            value={data?.address || ''}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="123 Main St, City, Country"
                            rows={2}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VCardForm;
