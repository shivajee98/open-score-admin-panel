'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { X, User, FileText, Briefcase, Landmark, MapPin, Camera, Shield, ChevronRight, ExternalLink } from 'lucide-react';

interface FormDetailsModalProps {
    loan: any;
    onClose: () => void;
}

// Helper to prettify keys
const prettifyKey = (key: string) => {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
};

// Section component
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon size={16} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">{title}</h3>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

// Field display component
function Field({ label, value }: { label: string; value: any }) {
    if (value === null || value === undefined || value === '') return null;

    return (
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-900 break-words">{String(value)}</p>
        </div>
    );
}

// Image field component
function ImageField({ label, data }: { label: string; data: any }) {
    if (!data || typeof data !== 'object' || !data.url) return null;

    return (
        <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative group aspect-video overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
            >
                <img
                    src={data.url}
                    alt={label}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
            </a>
            {data.geo && (
                <div className="flex gap-3 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><MapPin size={10} /> Lat: {data.geo.lat?.toFixed(6)}</span>
                    <span>Lng: {data.geo.lng?.toFixed(6)}</span>
                </div>
            )}
        </div>
    );
}

export default function FormDetailsModal({ loan, onClose }: FormDetailsModalProps) {
    const formData = loan.form_data || {};
    const user = loan.user || {};

    // Separate KYC form fields from KYC link photo fields
    const kycFormFields = [
        'desired_amount', 'annual_income', 'loan_usage',
        'first_name', 'last_name', 'birth_month', 'birth_day', 'birth_year',
        'marital_status', 'email', 'phone',
        'street_address', 'street_address_2', 'city', 'state', 'postal_code', 'address_duration',
        'employer', 'occupation', 'aadhar_number', 'pan_number',
        'experience_years', 'gross_monthly_income', 'rent_mortgage', 'down_payment',
        'comments', 'bank_references', 'consent',
        'auto_approved', 'auto_approved_at'
    ];

    const photoFields = ['aadhar_front', 'aadhar_back', 'pan_front', 'applicant_selfie', 'selfie', 'prop_1', 'prop_2', 'prop_3'];
    const bankFields = ['bank_name', 'ifsc_code', 'account_holder_name', 'account_number', 'location_url'];

    // Extract data categories
    const personalInfo: Record<string, any> = {};
    const contactInfo: Record<string, any> = {};
    const employmentInfo: Record<string, any> = {};
    const photos: Record<string, any> = {};
    const bankInfo: Record<string, any> = {};
    const otherInfo: Record<string, any> = {};

    // Personal fields
    const personalKeys = ['first_name', 'last_name', 'birth_month', 'birth_day', 'birth_year', 'marital_status', 'aadhar_number', 'pan_number'];
    const contactKeys = ['email', 'phone', 'street_address', 'street_address_2', 'city', 'state', 'postal_code', 'address_duration'];
    const employmentKeys = ['employer', 'occupation', 'experience_years', 'gross_monthly_income', 'annual_income', 'rent_mortgage', 'down_payment'];
    const loanKeys = ['desired_amount', 'loan_usage', 'comments', 'bank_references'];

    Object.entries(formData).forEach(([key, value]) => {
        if (photoFields.includes(key) && value && typeof value === 'object') {
            photos[key] = value;
        } else if (bankFields.includes(key)) {
            bankInfo[key] = value;
        } else if (personalKeys.includes(key)) {
            personalInfo[key] = value;
        } else if (contactKeys.includes(key)) {
            contactInfo[key] = value;
        } else if (employmentKeys.includes(key)) {
            employmentInfo[key] = value;
        } else if (!['consent', 'auto_approved', 'auto_approved_at'].includes(key)) {
            otherInfo[key] = value;
        }
    });

    // Also pull bank info from user model
    if (user.bank_name) bankInfo['bank_name'] = user.bank_name;
    if (user.ifsc_code) bankInfo['ifsc_code'] = user.ifsc_code;
    if (user.account_holder_name) bankInfo['account_holder_name'] = user.account_holder_name;
    if (user.account_number) bankInfo['account_number'] = user.account_number;
    if (user.location_url) bankInfo['location_url'] = user.location_url;

    const isEmpty = Object.keys(formData).length === 0 && Object.keys(bankInfo).length === 0;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-50 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto relative">

                {/* Header */}
                <div className="bg-white p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start sticky top-0 z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-black text-slate-900">Form Details</h2>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">#{loan.display_id || loan.id}</span>
                            <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-wide border shadow-sm ${loan.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                loan.status === 'DISBURSED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    loan.status === 'FORM_SUBMITTED' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        loan.status === 'KYC_SENT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>{loan.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5">
                                <User size={16} className="text-blue-500" />
                                {loan.user?.name || 'Unknown'} • {loan.user?.mobile_number}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <FileText size={16} className="text-slate-400" />
                                ₹{parseFloat(loan.amount).toLocaleString()} • {loan.tenure} {Number(loan.tenure) > 6 ? 'Days' : 'Months'}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-red-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    {isEmpty ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText size={24} className="text-slate-300" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-1">No Form Data</h4>
                            <p className="text-slate-400 font-medium text-sm">The applicant has not submitted any form data yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* Auto Approved Banner */}
                            {formData.auto_approved && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                                    <Shield size={20} className="text-emerald-600" />
                                    <div>
                                        <p className="text-sm font-black text-emerald-800">Auto-Approved Loan</p>
                                        <p className="text-xs text-emerald-600">This ₹10,000 loan was auto-approved on {formData.auto_approved_at ? new Date(formData.auto_approved_at).toLocaleString() : 'N/A'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Loan Request Info */}
                            {Object.keys(otherInfo).length > 0 && (
                                <Section title="Loan Request" icon={FileText}>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        {Object.entries(otherInfo).map(([key, value]) => (
                                            <Field key={key} label={prettifyKey(key)} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Personal Information */}
                            {Object.keys(personalInfo).length > 0 && (
                                <Section title="Personal Information" icon={User}>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <Field label="Full Name" value={`${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`} />
                                        <Field label="Date of Birth" value={
                                            personalInfo.birth_day && personalInfo.birth_month && personalInfo.birth_year
                                                ? `${personalInfo.birth_day}/${personalInfo.birth_month}/${personalInfo.birth_year}`
                                                : null
                                        } />
                                        <Field label="Marital Status" value={personalInfo.marital_status} />
                                        <Field label="Aadhaar Number" value={personalInfo.aadhar_number} />
                                        <Field label="PAN Number" value={personalInfo.pan_number} />
                                    </div>
                                </Section>
                            )}

                            {/* Contact Information */}
                            {Object.keys(contactInfo).length > 0 && (
                                <Section title="Contact & Address" icon={MapPin}>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <Field label="Email" value={contactInfo.email} />
                                        <Field label="Phone" value={contactInfo.phone} />
                                        <Field label="Street Address" value={contactInfo.street_address} />
                                        <Field label="Street Address 2" value={contactInfo.street_address_2} />
                                        <Field label="City" value={contactInfo.city} />
                                        <Field label="State" value={contactInfo.state} />
                                        <Field label="PIN Code" value={contactInfo.postal_code} />
                                        <Field label="Address Duration" value={contactInfo.address_duration} />
                                    </div>
                                </Section>
                            )}

                            {/* Employment Information */}
                            {Object.keys(employmentInfo).length > 0 && (
                                <Section title="Employment & Income" icon={Briefcase}>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <Field label="Employer" value={employmentInfo.employer} />
                                        <Field label="Occupation" value={employmentInfo.occupation} />
                                        <Field label="Experience" value={employmentInfo.experience_years ? `${employmentInfo.experience_years} years` : null} />
                                        <Field label="Gross Monthly Income" value={employmentInfo.gross_monthly_income ? `₹${parseFloat(employmentInfo.gross_monthly_income).toLocaleString()}` : null} />
                                        <Field label="Annual Income" value={employmentInfo.annual_income ? `₹${parseFloat(employmentInfo.annual_income).toLocaleString()}` : null} />
                                        <Field label="Rent / Mortgage" value={employmentInfo.rent_mortgage ? `₹${parseFloat(employmentInfo.rent_mortgage).toLocaleString()}` : null} />
                                        <Field label="Down Payment" value={employmentInfo.down_payment ? `₹${parseFloat(employmentInfo.down_payment).toLocaleString()}` : null} />
                                    </div>
                                </Section>
                            )}

                            {/* KYC Photos */}
                            {Object.keys(photos).length > 0 && (
                                <Section title="KYC Documents & Photos" icon={Camera}>
                                    <div className="grid grid-cols-2 gap-6">
                                        {Object.entries(photos).map(([key, data]) => (
                                            <ImageField key={key} label={prettifyKey(key)} data={data} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Bank Details */}
                            {Object.keys(bankInfo).length > 0 && (
                                <Section title="Bank Details" icon={Landmark}>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <Field label="Bank Name" value={bankInfo.bank_name} />
                                        <Field label="IFSC Code" value={bankInfo.ifsc_code} />
                                        <Field label="Account Holder" value={bankInfo.account_holder_name} />
                                        <Field label="Account Number" value={bankInfo.account_number} />
                                        {bankInfo.location_url && (
                                            <div className="col-span-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                                <a href={bankInfo.location_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                    View on Map <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </Section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
