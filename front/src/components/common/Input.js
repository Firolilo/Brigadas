import React from 'react';

// Input base estilo shadcn/ui, con bordes redondeados, paleta rojo/naranja
const Input = React.forwardRef(({ className = '', ...props }, ref) => {
    const base = 'w-full h-10 px-3 border border-gray-300 text-neutral-900 placeholder-neutral-500 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';
    return <input ref={ref} className={[base, className].join(' ')} {...props} />;
});

export default Input;


