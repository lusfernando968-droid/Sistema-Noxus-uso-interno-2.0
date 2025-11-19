import React from 'react';

interface SimpleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    color?: string;
  }>;
  placeholder?: string;
}

export function SimpleSelect({ value, onChange, options, placeholder }: SimpleSelectProps) {
  console.log('SimpleSelect recebido:', {
    value,
    optionsCount: options.length,
    firstOptions: options.slice(0, 3),
    allOptions: options
  });

  return (
    <div className="space-y-2">
      {console.log('Renderizando select HTML com', options.length, 'opções')}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">{placeholder || 'Selecione...'}</option>
        {options && options.length > 0 ? (
          options.map((option) => {
            console.log('Renderizando option:', option.value, option.label);
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          })
        ) : (
          <option value="" disabled>Nenhuma opção disponível</option>
        )}
      </select>
      
    </div>
  );
}
