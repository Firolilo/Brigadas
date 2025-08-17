import React from 'react';

const Label = ({ className = '', children, ...props }) => {
    const base = 'block text-xs uppercase tracking-wide text-black mb-1';
    return (
        <label className={[base, className].join(' ')} {...props}>
            {children}
        </label>
    );
};

export default Label;


