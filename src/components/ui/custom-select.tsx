import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
    color?: string;
  }>;
  disabled?: boolean;
  error?: boolean;
}

export function CustomSelect({ value, onChange, placeholder, options, disabled, error }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  console.log('CustomSelect renderizado:', {
    optionsCount: options.length,
    options: options.slice(0, 3),
    isOpen,
    value,
    disabled
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  console.log('Selected option:', selectedOption);

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          console.log('Botão clicado, isOpen atual:', isOpen, 'novo valor:', !isOpen);
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.color && (
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              {selectedOption.label}
            </div>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-[200] w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {console.log('Renderizando dropdown, isOpen:', isOpen, 'options:', options.length)}
          <div className="max-h-60 overflow-auto p-1">
            {options.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Nenhuma opção disponível
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {value === option.value && (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.label}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}