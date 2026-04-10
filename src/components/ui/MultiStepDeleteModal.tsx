'use client';

import React, { useState } from 'react';

interface MultiStepDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemDescription?: string;
  actionType?: 'DELETE' | 'ARCHIVE';
}

const MultiStepDeleteModal: React.FC<MultiStepDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemDescription,
  actionType = 'ARCHIVE',
}) => {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleNext = () => setStep(step + 1);
  const handleConfirm = () => {
    if (confirmText.toUpperCase() === actionType) {
      onConfirm();
      setStep(1);
      setConfirmText('');
    }
  };

  const handleClose = () => {
    setStep(1);
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 italic text-amber-200 text-sm">
                 Notice: Permanent deletion is disabled. This record will be moved to the non-destructive archive.
              </div>
              <p className="text-slate-300">Are you sure you want to {actionType.toLowerCase()} this entry?</p>
              {itemDescription && <p className="text-slate-400 text-sm font-mono bg-slate-800/50 p-2 rounded">{itemDescription}</p>}
              <button 
                onClick={handleNext}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
              >
                Yes, I understand
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-slate-300">This action will remove the record from current active views and move it to the <span className="text-amber-400 font-semibold italic">Archive Tab</span> for auditing purposes.</p>
              <button 
                onClick={handleNext}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
              >
                Proceed to Final Confirmation
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-slate-300">To finalize this action, please type <span className="text-rose-400 font-bold tracking-widest px-1">{actionType}</span> below:</p>
              <input
                type="text"
                autoFocus
                placeholder={`Type ${actionType} here...`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-mono"
              />
              <button 
                onClick={handleConfirm}
                disabled={confirmText !== actionType}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  confirmText === actionType 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Move to Archive
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={handleClose}
          className="w-full py-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
        >
          Cancel and Go Back
        </button>
      </div>
    </div>
  );
};

export default MultiStepDeleteModal;
