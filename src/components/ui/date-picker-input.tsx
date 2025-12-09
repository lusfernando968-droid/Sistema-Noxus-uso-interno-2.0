import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Helper: parse a date-only string (yyyy-MM-dd) in local timezone
function parseDateOnly(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

interface DatePickerInputProps {
    value?: string; // yyyy-MM-dd format
    onChange: (date: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    minDate?: Date;
    maxDate?: Date;
}

export function DatePickerInput({
    value,
    onChange,
    placeholder = "dd/mm/aaaa",
    disabled = false,
    className,
    minDate,
    maxDate,
}: DatePickerInputProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [isInvalid, setIsInvalid] = React.useState(false);

    // Sync input value with prop value
    React.useEffect(() => {
        if (value) {
            try {
                const date = parseDateOnly(value);
                setInputValue(format(date, "dd/MM/yyyy"));
                setIsInvalid(false);
            } catch {
                setInputValue("");
            }
        } else {
            setInputValue("");
            setIsInvalid(false);
        }
    }, [value]);

    // Format input as user types (add slashes automatically)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ""); // Remove non-digits

        // Auto-format with slashes
        if (val.length >= 2) {
            val = val.slice(0, 2) + "/" + val.slice(2);
        }
        if (val.length >= 5) {
            val = val.slice(0, 5) + "/" + val.slice(5, 9);
        }

        setInputValue(val);
        setIsInvalid(false);
    };

    // Validate and convert to yyyy-MM-dd on blur
    const handleInputBlur = () => {
        if (!inputValue) {
            onChange("");
            setIsInvalid(false);
            return;
        }

        try {
            // Parse dd/MM/yyyy
            const parsed = parse(inputValue, "dd/MM/yyyy", new Date());

            if (isValid(parsed)) {
                // Check min/max constraints
                if (minDate && parsed < minDate) {
                    setIsInvalid(true);
                    return;
                }
                if (maxDate && parsed > maxDate) {
                    setIsInvalid(true);
                    return;
                }

                // Convert to yyyy-MM-dd
                const formatted = format(parsed, "yyyy-MM-dd");
                onChange(formatted);
                setIsInvalid(false);
            } else {
                setIsInvalid(true);
            }
        } catch {
            setIsInvalid(true);
        }
    };

    // Handle calendar selection
    const handleCalendarSelect = (date: Date | undefined) => {
        if (date) {
            const formatted = format(date, "yyyy-MM-dd");
            onChange(formatted);
            setOpen(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleInputBlur();
            e.currentTarget.blur();
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className={cn("relative", className)}>
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "h-9 pr-10",
                        isInvalid && "border-destructive focus-visible:ring-destructive"
                    )}
                    maxLength={10}
                />
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
                        disabled={disabled}
                    >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
            </div>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value ? parseDateOnly(value) : undefined}
                    onSelect={handleCalendarSelect}
                    locale={ptBR}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
