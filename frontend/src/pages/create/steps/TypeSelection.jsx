import React from 'react';
import {
    Globe,
    FileText,
    Contact,
    MessageCircle,
    Share2,
    Film,
    Coffee
} from 'lucide-react';

const TypeSelection = ({ selectedType, onSelect, onProceed }) => {
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
            id: 'MENU',
            label: 'Menu',
            icon: <Coffee size={24} />,
            desc: 'Restaurant or Cafe Menu',
            color: 'orange'
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

    const handleInteraction = (typeId, actionType) => {
        onSelect(typeId);
        
        if (actionType === 'doubleClick' || actionType === 'enter') {
            onProceed && onProceed();
        } else if (actionType === 'click') {
            // Auto-proceed on single tap for mobile devices
            if (window.innerWidth < 1024 || window.matchMedia("(pointer: coarse)").matches) {
                onProceed && onProceed();
            }
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Choose QR Code Type
                </h2>
                <p className="text-slate-500 text-sm">Select the type of content you want your QR code to link to.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {types.map((type) => {
                    const isActive = selectedType === type.id;
                    return (
                        <div
                            key={type.id}
                            tabIndex={0}
                            onClick={() => handleInteraction(type.id, 'click')}
                            onDoubleClick={() => handleInteraction(type.id, 'doubleClick')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInteraction(type.id, 'enter');
                            }}
                            className={`
                                group bg-white p-6 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2
                                ${isActive ? 'border-slate-900 ring-1 ring-slate-900 shadow-sm bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'}
                            `}
                        >
                            <div className={`
                                w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200
                                ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900'}
                            `}>
                                {type.icon}
                            </div>
                            <h3 className={`font-semibold text-sm mb-1 transition-colors duration-200 ${isActive ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                {type.label}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium text-center line-clamp-1">
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
