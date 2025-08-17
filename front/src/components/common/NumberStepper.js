import React from 'react';

// NumberStepper: control con botones +/- grandes, incrementos de 1, con bordes redondeados
// Props:
// - value: number
// - onChange: (next:number) => void
// - min, max, step: opcionales (default step=1)
// - ariaLabel: accesibilidad
const NumberStepper = ({ value = 0, onChange, min = 0, max, step = 1, ariaLabel = 'Selector numérico', className = '' }) => {
    const handleDecrease = () => {
        const next = (Number(value) || 0) - step;
        if (min !== undefined && next < min) {
            onChange(min);
            return;
        }
        onChange(next);
    };
    const handleIncrease = () => {
        const next = (Number(value) || 0) + step;
        if (max !== undefined && next > max) {
            onChange(max);
            return;
        }
        onChange(next);
    };
    const handleInput = (e) => {
        const raw = e.target.value;
        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
            onChange(0);
            return;
        }
        if (min !== undefined && parsed < min) {
            onChange(min);
            return;
        }
        if (max !== undefined && parsed > max) {
            onChange(max);
            return;
        }
        onChange(parsed);
    };

    return (
        <div className={["inline-flex items-center border border-red-300 rounded-md overflow-hidden", className].join(' ')} aria-label={ariaLabel}>
            <button type="button" onClick={handleDecrease} className="h-12 w-12 text-xl font-bold bg-white hover:bg-red-600 hover:text-white">
                −
            </button>
            <input
                type="number"
                className="h-12 w-20 text-center outline-none border-l border-r border-red-300"
                value={Number(value) || 0}
                onChange={handleInput}
                min={min}
                max={max}
                step={step}
            />
            <button type="button" onClick={handleIncrease} className="h-12 w-12 text-xl font-bold bg-white hover:bg-red-600 hover:text-white">
                +
            </button>
        </div>
    );
};

export default NumberStepper;


