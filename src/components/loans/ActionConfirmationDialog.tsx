'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, RotateCcw, ArrowRight, ShieldAlert } from 'lucide-react';

export type ActionType = 'PROCEED' | 'SEND_KYC' | 'APPROVE' | 'DISBURSE' | 'REDO' | 'DELETE' | 'REJECT' | 'APPROVE_FEE';

interface ActionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: ActionType;
  loanId: string | number;
  customerName?: string;
  amount?: string | number;
  isRisk?: boolean;
}

const ActionConfirmationDialog: React.FC<ActionConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  loanId,
  customerName,
  amount,
  isRisk,
}) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getActionConfig = () => {
    switch (action) {
      case 'REDO':
        return {
          title: 'Redo Loan Step',
          description: 'This will revert the loan to its previous state. Any financial allocations or approvals will be reversed.',
          icon: <RotateCcw className="w-12 h-12 text-amber-500" />,
          color: 'amber',
          step1Label: 'I want to redo this step',
          step2Label: 'Confirm State Reversion',
          confirmText: 'Revert State',
          warning: 'This action cannot be easily undone and may affect agent liquidity.'
        };
      case 'APPROVE_FEE':
        return {
          title: 'Approve Platform Fee',
          description: `Confirming Platform Fee payment of ₹${amount} for ${customerName}.`,
          icon: <CheckCircle className="w-12 h-12 text-indigo-500" />,
          color: 'indigo',
          step1Label: 'Verify Payment Proof',
          step2Label: 'Final Payment Confirmation',
          confirmText: 'Confirm Fee Payment',
          warning: 'This will mark the platform fee as paid and progress the loan workflow.'
        };
      case 'APPROVE':
        return {
          title: 'Approve Loan',
          description: `Approving ₹${amount} for ${customerName}. This will reserve funds in the treasury.`,
          icon: <CheckCircle className="w-12 h-12 text-emerald-500" />,
          color: 'emerald',
          step1Label: 'Yes, details are verified',
          step2Label: 'Final Approval Confirmation',
          confirmText: 'Approve Loan',
          warning: 'Ensure all KYC documents are authentic before final approval.'
        };
      case 'DISBURSE':
        return {
          title: 'Disburse Funds',
          description: `Transferring ₹${amount} to ${customerName}'s wallet.`,
          icon: <ArrowRight className="w-12 h-12 text-blue-500" />,
          color: 'blue',
          step1Label: 'Ready for payout',
          step2Label: 'Final Payment Authorization',
          confirmText: 'Release Funds',
          warning: 'This will trigger an irreversible wallet transfer.'
        };
      case 'DELETE':
        return {
          title: 'Delete Loan Record',
          description: 'Permanently deleting this loan application from the system.',
          icon: <ShieldAlert className="w-12 h-12 text-rose-500" />,
          color: 'rose',
          step1Label: 'I understand it will be deleted',
          step2Label: 'Confirm Permanent Deletion',
          confirmText: 'Delete Permanently',
          warning: 'This action is irreversible and will remove all associated data.'
        };
      case 'REJECT':
        return {
          title: 'Reject Loan',
          description: 'Rejecting this loan application. The user will be notified.',
          icon: <AlertTriangle className="w-12 h-12 text-rose-500" />,
          color: 'rose',
          step1Label: 'Reject Application',
          step2Label: 'Confirm Rejection',
          confirmText: 'Reject Now',
          warning: 'This will notify the customer about the rejection.'
        };
      case 'SEND_KYC':
        return {
          title: 'Send KYC Link',
          description: 'Generating a new KYC verification link for the customer.',
          icon: <Info className="w-12 h-12 text-indigo-500" />,
          color: 'indigo',
          step1Label: 'Send Link',
          step2Label: 'Confirm Dispatch',
          confirmText: 'Send to Customer',
          warning: 'Ensure the customer is ready to complete the form.'
        };
      default:
        return {
          title: 'Confirm Operation',
          description: 'Please confirm you want to proceed with this administrative action.',
          icon: <Info className="w-12 h-12 text-slate-400" />,
          color: 'slate',
          step1Label: 'Continue',
          step2Label: 'Final Confirm',
          confirmText: 'Execute Action',
          warning: 'Double check the loan details before proceeding.'
        };
    }
  };

  const config = getActionConfig();

  const handleNext = () => setStep(2);
  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    // onClose is handled by the parent after API call
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div className="relative bg-[#0b0f1a] border border-slate-800/60 rounded-[28px] max-w-md w-full overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
        
        {/* Animated Progress Bar */}
        <div className="h-1.5 w-full bg-slate-900">
          <div 
            className={`h-full transition-all duration-500 ease-out bg-${config.color}-500 shadow-[0_0_10px_rgba(var(--${config.color}-500-rgb),0.5)]`}
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`p-4 rounded-3xl bg-${config.color}-500/10 border border-${config.color}-500/20 mb-6 animate-in slide-in-from-bottom-4 duration-500`}>
              {config.icon}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
              {step === 1 ? config.title : config.step2Label}
            </h2>
            <p className="text-slate-400 text-base">
              {config.description}
            </p>
          </div>

          {/* Warning Card */}
          <div className={`group bg-[#161b2a] border ${isRisk ? 'border-rose-500/50 bg-rose-500/5' : 'border-slate-800/50'} rounded-2xl p-4 mb-8 transition-all hover:border-${config.color}-500/30`}>
            <div className="flex gap-3">
              <ShieldAlert className={`w-5 h-5 ${isRisk ? 'text-rose-500' : `text-${config.color}-400`} shrink-0 mt-0.5`} />
              <div className="space-y-1">
                <p className={`text-xs font-black uppercase tracking-widest ${isRisk ? 'text-rose-500' : 'text-slate-500'}`}>
                  {isRisk ? 'Risk Override Protocol' : 'Secure Protocol'}
                </p>
                <p className={`text-sm ${isRisk ? 'text-rose-200 font-bold' : 'text-slate-300'} leading-relaxed italic`}>
                  {isRisk ? "ATTENTION: This loan has been flagged by Auto-Pilot for potential risk. Manual approval will bypass all safety checks." : `"${config.warning}"`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="space-y-3">
            {step === 1 ? (
              <button
                onClick={handleNext}
                className={`w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 group shadow-xl`}
              >
                {config.step1Label}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className={`w-full py-4 px-6 bg-${config.color}-600 hover:bg-${config.color}-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-${config.color}-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    {config.confirmText}
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-full py-3 text-slate-500 hover:text-slate-400 font-medium transition-colors disabled:opacity-30"
            >
              Cancel Transaction
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-8 py-4 bg-slate-900/40 border-t border-slate-800/40 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Authorization Active</span>
          </div>
          <span className="text-[10px] font-mono text-slate-600">ID: {loanId}</span>
        </div>
      </div>
    </div>
  );
};

export default ActionConfirmationDialog;
