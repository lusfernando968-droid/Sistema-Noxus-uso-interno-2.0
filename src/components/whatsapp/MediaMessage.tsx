import { Image as ImageIcon, File, Download } from 'lucide-react';
import { format } from 'date-fns';

interface MediaMessageProps {
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    caption?: string;
    filename?: string;
    timestamp: string;
    direction: 'inbound' | 'outbound';
}

export function MediaMessage({ type, url, caption, filename, timestamp, direction }: MediaMessageProps) {
    const renderMedia = () => {
        switch (type) {
            case 'image':
                return (
                    <div className="relative group">
                        <img
                            src={url}
                            alt={caption || 'Imagem'}
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(url, '_blank')}
                        />
                        {caption && (
                            <p className="text-sm mt-2 whitespace-pre-wrap break-words">{caption}</p>
                        )}
                    </div>
                );

            case 'video':
                return (
                    <div className="relative">
                        <video
                            src={url}
                            controls
                            className="max-w-full rounded-lg"
                        />
                        {caption && (
                            <p className="text-sm mt-2 whitespace-pre-wrap break-words">{caption}</p>
                        )}
                    </div>
                );

            case 'document':
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <File className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{filename || 'Documento'}</p>
                            <p className="text-xs text-gray-500">Clique para baixar</p>
                        </div>
                        <Download className="h-4 w-4 text-gray-500" />
                    </a>
                );

            case 'audio':
                return (
                    <div className="flex items-center gap-2">
                        <audio src={url} controls className="w-full" />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div
            className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${direction === 'outbound'
                    ? 'bg-[#d9fdd3] rounded-br-none'
                    : 'bg-white rounded-bl-none'
                }`}
        >
            {renderMedia()}
            <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-500">
                    {format(new Date(timestamp), 'HH:mm')}
                </span>
            </div>
        </div>
    );
}
