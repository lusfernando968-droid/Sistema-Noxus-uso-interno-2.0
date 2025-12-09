import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Captura erros não tratados em componentes filhos e exibe
 * uma interface amigável ao usuário.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Atualiza o estado para renderizar a UI de fallback
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log do erro para console (em produção, enviar para serviço de monitoramento)
        console.error('Uncaught error:', error, errorInfo);

        // Mostrar toast de erro
        toast({
            title: 'Erro inesperado',
            description: 'Ocorreu um erro na aplicação. A página será recarregada.',
            variant: 'destructive',
        });

        // TODO: Em produção, enviar para serviço de monitoramento
        // logErrorToService(error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            // Renderizar fallback customizado se fornecido
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Fallback padrão
            return (
                <div className="flex items-center justify-center min-h-screen bg-background">
                    <div className="max-w-md w-full mx-4">
                        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <svg
                                        className="w-6 h-6 text-destructive"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-foreground">
                                        Algo deu errado
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Ocorreu um erro inesperado
                                    </p>
                                </div>
                            </div>

                            {/* Detalhes do erro (apenas em desenvolvimento) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mb-4 p-3 bg-muted rounded-md">
                                    <p className="text-xs font-mono text-muted-foreground break-all">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                                >
                                    Recarregar página
                                </button>
                                <button
                                    onClick={this.handleReset}
                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                                >
                                    Tentar novamente
                                </button>
                            </div>

                            <p className="mt-4 text-xs text-center text-muted-foreground">
                                Se o problema persistir, entre em contato com o suporte.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
