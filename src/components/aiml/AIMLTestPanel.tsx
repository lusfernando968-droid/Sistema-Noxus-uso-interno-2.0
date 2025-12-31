import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { chatWithAIML, processWhatsAppMessage, generateConfirmationMessage } from '@/integrations/aiml';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';

export function AIMLTestPanel() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSimpleChat = async () => {
        if (!message.trim()) {
            toast({
                title: 'Erro',
                description: 'Digite uma mensagem primeiro',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        setResponse('');

        try {
            const result = await chatWithAIML([
                {
                    role: 'system',
                    content: 'Você é um assistente útil que responde em português brasileiro.',
                },
                {
                    role: 'user',
                    content: message,
                },
            ]);

            setResponse(result);
            toast({
                title: 'Sucesso',
                description: 'Resposta recebida da AI/ML API',
            });
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Falha ao processar mensagem',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleProcessWhatsApp = async () => {
        if (!message.trim()) {
            toast({
                title: 'Erro',
                description: 'Digite uma mensagem primeiro',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        setResponse('');

        try {
            const result = await processWhatsAppMessage(message);

            // Generate confirmation message
            const confirmation = await generateConfirmationMessage(
                result.intent,
                result.entities
            );

            const formattedResponse = `
🎯 **Intenção detectada:** ${result.intent}

📋 **Dados extraídos:**
${JSON.stringify(result.entities, null, 2)}

💬 **Mensagem de confirmação:**
${confirmation}
      `.trim();

            setResponse(formattedResponse);
            toast({
                title: 'Sucesso',
                description: 'Mensagem processada com sucesso',
            });
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.message || 'Falha ao processar mensagem',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Teste de Integração AI/ML API
                    </CardTitle>
                    <CardDescription>
                        Teste a integração com a AI/ML API para processamento de mensagens do chatbot
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="message">Mensagem de teste</Label>
                        <Textarea
                            id="message"
                            placeholder="Ex: Quero cadastrar um cliente chamado João Silva, email joao@email.com, telefone (11) 99999-9999"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSimpleChat}
                            disabled={loading}
                            variant="outline"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <MessageSquare className="h-4 w-4 mr-2" />
                            )}
                            Chat Simples
                        </Button>

                        <Button
                            onClick={handleProcessWhatsApp}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Processar como WhatsApp
                        </Button>
                    </div>

                    {response && (
                        <div className="space-y-2">
                            <Label>Resposta</Label>
                            <div className="bg-muted p-4 rounded-lg">
                                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Exemplos de Mensagens</CardTitle>
                    <CardDescription>
                        Experimente estas mensagens para testar diferentes funcionalidades
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                            <strong>Criar Cliente:</strong>
                            <p className="text-muted-foreground mt-1">
                                "Quero cadastrar um cliente chamado Maria Santos, email maria@email.com, telefone (11) 98765-4321"
                            </p>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <strong>Criar Agendamento:</strong>
                            <p className="text-muted-foreground mt-1">
                                "Agendar sessão para João Silva amanhã às 14h, micropigmentação de sobrancelha"
                            </p>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <strong>Criar Projeto:</strong>
                            <p className="text-muted-foreground mt-1">
                                "Criar projeto de micropigmentação para a cliente Ana Costa"
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
