import { Check, CheckCheck, Clock } from 'lucide-react';

type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read';

interface MessageStatusProps {
    status: MessageStatusType;
    className?: string;
}

export function MessageStatus({ status, className = '' }: MessageStatusProps) {
    const getStatusIcon = () => {
        switch (status) {
            case 'sending':
                return <Clock className={`h-4 w-4 ${className}`} />;
            case 'sent':
                return <Check className={`h-4 w-4 ${className}`} />;
            case 'delivered':
                return <CheckCheck className={`h-4 w-4 ${className}`} />;
            case 'read':
                return <CheckCheck className={`h-4 w-4 text-[#53bdeb] ${className}`} />;
            default:
                return null;
        }
    };

    return (
        <span className="inline-flex items-center">
            {getStatusIcon()}
        </span>
    );
}
