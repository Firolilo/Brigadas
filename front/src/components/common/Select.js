import React from 'react';

const Select = React.forwardRef(({ className = '', children, ...props }, ref) => {
    const base = 'h-10 px-3 border border-gray-300 bg-white text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';
    return (
        <select ref={ref} className={[base, className].join(' ')} {...props}>
            {children}
        </select>
    );
});

export default Select;


