import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      sounds.playModalOpen();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          sounds.playCancel();
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  const handleClose = () => {
    sounds.playCancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Dialog Card */}
      <div 
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden z-10 transition-all duration-300 transform scale-100 animate-in fade-in zoom-in-95`}
      >
        {/* Top Decorative Esports Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-400" />

        {/* Modal Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-slate-100 bg-gradient-to-b from-blue-50/50 to-white">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h3 className="text-xl font-black text-slate-800 tracking-wide font-tech uppercase">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
