import { useRef, useState } from 'react';
import { Image, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number; // em MB
}

export function FileUpload({ onFileSelect, accept = 'image/*', maxSize = 5 }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamanho
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            toast({
                variant: 'destructive',
                title: 'Arquivo muito grande',
                description: `O arquivo deve ter no máximo ${maxSize}MB`,
            });
            return;
        }

        // Preview para imagens
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }

        onFileSelect(file);
    };

    const clearPreview = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />

            {preview ? (
                <div className="relative inline-block">
                    <img
                        src={preview}
                        alt="Preview"
                        className="max-w-xs max-h-48 rounded-lg"
                    />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full h-8 w-8"
                        onClick={clearPreview}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-500 hover:text-[#25D366]"
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
            )}
        </div>
    );
}
