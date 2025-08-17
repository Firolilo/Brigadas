import React from 'react';

// Botón base inspirado en shadcn/ui con variantes y tamaños
// - Paleta roja/naranja y bordes redondeados
// - Accesible con aria-label opcional
const Button = React.forwardRef(({ variant = 'primary', size = 'md', className = '', disabled = false, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center select-none whitespace-nowrap border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60 rounded-md';

    const variants = {
        primary: 'bg-gradient-to-r from-red-600 to-orange-500 text-white border-transparent hover:from-orange-500 hover:to-red-600',
        secondary: 'bg-white text-red-700 border-red-300 hover:bg-red-50',
        ghost: 'bg-transparent text-red-700 border-red-300 hover:bg-red-50',
        destructive: 'bg-white text-red-700 border-red-700 hover:bg-red-700 hover:text-white'
    };

    const sizes = {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base'
    };

    const classes = [base, variants[variant] || variants.primary, sizes[size] || sizes.md, className].join(' ');

    return (
        <button ref={ref} className={classes} disabled={disabled} {...props}>
            {children}
        </button>
    );
});

export default Button;


