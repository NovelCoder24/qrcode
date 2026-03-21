import React from 'react';
import { Building2, Phone, Mail, Globe, MapPin, Clock, FileText } from 'lucide-react';

const BusinessForm = ({ data, onChange }) => {
    const updateField = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Business Page</h3>
            <p className="text-sm text-slate-500 mb-6">
                Create a complete business profile page with all your information.
            </p>

            <div className="space-y-4">
                {/* Business Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Business Name *
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={data?.businessName || ''}
                            onChange={(e) => updateField('businessName', e.target.value)}
                            placeholder="Your Business Name"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Industry/Category */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Industry / Category
                    </label>
                    <select
                        value={data?.industry || ''}
                        onChange={(e) => updateField('industry', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                        <option value="">Select an industry</option>
                        <option value="restaurant">Restaurant & Food</option>
                        <option value="retail">Retail & Shopping</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="technology">Technology</option>
                        <option value="finance">Finance & Banking</option>
                        <option value="real-estate">Real Estate</option>
                        <option value="hospitality">Hospitality & Travel</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Business Description
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea
                            value={data?.description || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Tell customers about your business..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
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
                                placeholder="+91 98765 43210"
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
                                placeholder="contact@business.com"
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
                            placeholder="https://yourbusiness.com"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Business Address
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea
                            value={data?.address || ''}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="Full address with city, state, pincode"
                            rows={2}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Business Hours */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Business Hours
                    </label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={data?.hours || ''}
                            onChange={(e) => updateField('hours', e.target.value)}
                            placeholder="Mon-Sat: 9AM - 6PM"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessForm;
