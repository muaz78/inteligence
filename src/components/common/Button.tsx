import React from 'react';
import { sounds } from '../../utils/soundEffects';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'violet' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  pulseGlow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  pulseGlow = false,
  className = '',
  onClick,
  onMouseEnter,
  disabled,
  ...props
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
    xl: 'text-lg px-8 py-4 rounded-2xl gap-3 font-extrabold uppercase font-tech tracking-wider',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 via-[#3478F6] to-blue-500 text-white shadow-md hover:shadow-glow-blue hover:brightness-105 border-t border-white/20',
    secondary: 'bg-gradient-to-r from-amber-500 via-[#FF9F43] to-orange-500 text-white shadow-md hover:shadow-glow-orange hover:brightness-105 border-t border-white/20',
    violet: 'bg-gradient-to-r from-purple-600 via-[#8B5CF6] to-indigo-500 text-white shadow-md hover:shadow-glow-violet hover:brightness-105 border-t border-white/20',
    outline: 'bg-white/80 hover:bg-blue-50/80 text-[#3478F6] border-2 border-blue-200 hover:border-blue-400 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 hover:text-blue-600',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md hover:brightness-105',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    sounds.playClick();
    if (onClick) onClick(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    sounds.playHover();
    if (onMouseEnter) onMouseEnter(e);
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${pulseGlow ? 'animate-pulse-slow' : ''}
        ${className}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
