import React from 'react';

export const Table = ({ children, className = '' }) => (
    <div className={["overflow-x-auto border border-black", className].join(' ')}>
        <table className="min-w-full text-sm text-black">
            {children}
        </table>
    </div>
);

export const THead = ({ children }) => (
    <thead>
        <tr className="border-b border-black bg-neutral-50 text-left">
            {children}
        </tr>
    </thead>
);

export const Th = ({ children }) => (
    <th className="py-2 px-3 font-medium">{children}</th>
);

export const TBody = ({ children }) => (
    <tbody>{children}</tbody>
);

export const Tr = ({ children }) => (
    <tr className="border-b border-neutral-300 hover:bg-neutral-100">{children}</tr>
);

export const Td = ({ children, colSpan }) => (
    <td className="py-2 px-3" colSpan={colSpan}>{children}</td>
);

export default { Table, THead, Th, TBody, Tr, Td };


