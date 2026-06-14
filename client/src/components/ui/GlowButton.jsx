import { motion } from 'framer-motion';
import { TRANSITIONS } from '../../design-system';
import LoadingSpinner from './LoadingSpinner';

export default function GlowButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  loadingText = null,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  const variantClasses = {
    primary: 'btn-success hover:brightness-[0.97]',
    danger: 'btn-danger',
    secondary:
      'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700',
    ghost:
      'bg-transparent text-zinc-100 border border-zinc-700 hover:bg-zinc-800/80',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative rounded-full font-semibold
        transition-colors duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant] || variantClasses.primary}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{ transition: TRANSITIONS.default }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && <LoadingSpinner size="sm" variant="white" />}
        {loading && loadingText ? loadingText : children}
      </span>
    </motion.button>
  );
}
