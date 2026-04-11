import React from 'react';
import {
    Globe,
    FileText,
    Contact,
    MessageCircle,
    Share2,
    Film
} from 'lucide-react';

const TypeSelection = ({ selectedType, onSelect, onNext }) => {
    const types = [
        {
            id: 'URL',
            label: 'Website',
            icon: <Globe size={24} />,
            desc: 'Link to any website URL',
            color: 'indigo'
        },
        {
            id: 'PDF',
            label: 'PDF',
            icon: <FileText size={24} />,
            desc: 'Show a PDF document',
            color: 'rose'
        },
        {
            id: 'VCARD',
            label: 'vCard',
            icon: <Contact size={24} />,
            desc: 'Digital business card',
            color: 'emerald'
        },
        {
            id: 'WHATSAPP',
            label: 'WhatsApp',
            icon: <MessageCircle size={24} />,
            desc: 'Pre-filled message link',
            color: 'green'
        },
        {
            id: 'SOCIAL',
            label: 'Social Media',
            icon: <Share2 size={24} />,
            desc: 'All your social links',
            color: 'blue'
        },
        {
            id: 'MEDIA',
            label: 'Media',
            icon: <Film size={24} />,
            desc: 'Image, video, or audio',
            color: 'purple'
        },
    ];

    const handleInteraction = (typeId) => {
        onSelect(typeId);
        // On mobile/tablet, proceed to next step automatically
        if (window.innerWidth < 1024) {
            setTimeout(() => {
                onNext();
            }, 100); // 100ms delay to show the "active" state selection visually before transition
        }
    };

    const handleDoubleClick = (typeId) => {
        // On desktop, double click to proceed
        if (window.innerWidth >= 1024) {
            onSelect(typeId);
            onNext();
        }
    };

    return (
        <div className="w-full">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-12 text-center lg:text-left">
                1. Select a type of QR code
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {types.map((type) => {
                    const isActive = selectedType === type.id;
                    return (
                        <div
                            key={type.id}
                            onClick={() => handleInteraction(type.id)}
                            onDoubleClick={() => handleDoubleClick(type.id)}
                            className={`
                                bg-white p-6 rounded-3xl border text-center cursor-pointer transition-all hover:shadow-lg flex flex-col items-center select-none
                                ${isActive ? 'border-indigo-600 ring-1 ring-indigo-600 shadow-md' : 'border-slate-100'}
                            `}
                        >
                            <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors
                                ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}
                            `}>
                                {type.icon}
                            </div>
                            <h3 className={`font-bold text-sm mb-1 ${isActive ? 'text-indigo-600' : 'text-slate-900'}`}>
                                {type.label}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-medium">
                                {type.desc}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TypeSelection;
