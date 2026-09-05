import { forwardRef } from 'react';

const Button = forwardRef(function Button({ children, variant = 'primary', className = '', ...props }, ref) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 min-h-[44px] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-emerald-700 text-white hover:bg-emerald-800',
    secondary: 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'text-stone-600 hover:bg-stone-100',
  };
  return (
    <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
});

export default Button;
