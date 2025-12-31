import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ConversationSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function ConversationSearch({ value, onChange, placeholder = "Buscar conversas..." }: ConversationSearchProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-10 bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
            />
        </div>
    );
}
