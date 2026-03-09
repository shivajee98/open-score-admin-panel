'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Package, Truck, Home, CreditCard, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface QrStatusStepperProps {
    status: 'pending' | 'agent_approved' | 'payment_confirmed' | 'dispatched' | 'delivering' | 'completed' | 'rejected';
    trackingUrl?: string;
}

export default function QrStatusStepper({ status, trackingUrl }: QrStatusStepperProps) {
    const steps = [
        {
            id: 'agent_approved',
            label: 'QR BOOKED',
            icon: Clock,
            description: 'Order confirmed. Under Printing'
        },
        {
            id: 'payment_confirmed',
            label: 'PRINTED',
            icon: CreditCard,
            description: 'Ready To Dispatch'
        },
        {
            id: 'dispatched',
            label: 'Dispatched',
            icon: Package,
            description: 'Handed over to courier. Under Transit'
        },
        {
            id: 'delivering',
            label: 'IN TRANSIT',
            icon: Truck,
            description: 'Track Status - Reaching your city'
        },
        {
            id: 'completed',
            label: 'Delivered',
            icon: Home,
            description: 'Track Status - Received'
        }
    ];

    const getStatusIndex = (currentStatus: string) => {
        if (currentStatus === 'rejected') return -1;
        if (currentStatus === 'pending') return -1;
        return steps.findIndex(step => step.id === currentStatus);
    };

    const currentIndex = getStatusIndex(status);

    if (status === 'rejected') {
        return (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                    <CheckCircle2 size={20} className="rotate-45" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Request Rejected</h4>
                    <p className="text-[10px] font-bold text-rose-600 uppercase mt-0.5">Please check rejection reason below</p>
                </div>
            </div>
        );
    }

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{isExpanded ? 'Full Timeline' : 'Status Timeline Hidden'}</span>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-indigo-100 transition-colors uppercase tracking-widest"
                >
                    {isExpanded ? <><ChevronUp size={14} /> Hide Details</> : <><ChevronDown size={14} /> View Details</>}
                </button>
            </div>

            {isExpanded && (
                <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 z-0"></div>

                    <div className="space-y-6 relative z-10">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex || status === 'completed';
                    const isCurrent = index === currentIndex;
                    const isUpcoming = index > currentIndex && status !== 'completed';
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex gap-4 group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-lg ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                                    isCurrent ? 'bg-white border-indigo-600 text-indigo-600 scale-110 shadow-indigo-200 ring-4 ring-indigo-50' :
                                        'bg-white border-slate-200 text-slate-300'
                                }`}>
                                {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                            </div>

                            <div className="flex-1 pt-0.5">
                                <h4 className={`text-xs font-black uppercase tracking-wider transition-colors ${isCompleted ? 'text-emerald-600' :
                                        isCurrent ? 'text-indigo-600' :
                                            'text-slate-400'
                                    }`}>
                                    {step.label}
                                </h4>
                                <p className={`text-[10px] font-medium leading-relaxed mt-0.5 transition-colors ${isCompleted || isCurrent ? 'text-slate-600' : 'text-slate-400 opacity-60'
                                    }`}>
                                    {step.description}
                                </p>

                                {isCurrent && (
                                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                                        <div className="inline-flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">In Progress</span>
                                        </div>
                                        
                                        {trackingUrl && (step.id === 'delivering' || step.id === 'completed') && (
                                            <a 
                                                href={trackingUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                            >
                                                <ExternalLink size={10} className="text-emerald-600" />
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Track Status</span>
                                            </a>
                                        )}
                                    </div>
                                )}

                                {!isCurrent && isCompleted && trackingUrl && (step.id === 'delivering' || step.id === 'completed') && (
                                    <div className="mt-2">
                                        <a 
                                            href={trackingUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 hover:bg-slate-100 transition-colors"
                                        >
                                            <ExternalLink size={10} className="text-slate-500" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Track Status</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                    </div>
                </div>
            )}
        </div>
    );
}
