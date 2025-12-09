/**
 * Classe base para erros da aplicação
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public userMessage: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'AppError';
    }
}

/**
 * Erro de validação
 */
export class ValidationError extends AppError {
    constructor(message: string, field?: string) {
        super(
            message,
            'VALIDATION_ERROR',
            `Erro de validação${field ? ` no campo ${field}` : ''}: ${message}`
        );
        this.name = 'ValidationError';
    }
}

/**
 * Erro de autenticação
 */
export class AuthError extends AppError {
    constructor(message: string, originalError?: any) {
        super(
            message,
            'AUTH_ERROR',
            'Erro de autenticação. Faça login novamente.',
            originalError
        );
        this.name = 'AuthError';
    }
}

/**
 * Erro de permissão
 */
export class PermissionError extends AppError {
    constructor(message: string) {
        super(
            message,
            'PERMISSION_ERROR',
            'Você não tem permissão para realizar esta ação.'
        );
        this.name = 'PermissionError';
    }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(
            `${resource} não encontrado`,
            'NOT_FOUND',
            `${resource} não foi encontrado.`
        );
        this.name = 'NotFoundError';
    }
}

/**
 * Erro de conflito (ex: duplicação)
 */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(
            message,
            'CONFLICT_ERROR',
            message
        );
        this.name = 'ConflictError';
    }
}

/**
 * Verifica se um erro é do tipo AppError
 */
export function isAppError(error: any): error is AppError {
    return error instanceof AppError;
}

/**
 * Extrai mensagem amigável de um erro
 */
export function getErrorMessage(error: any): string {
    if (isAppError(error)) {
        return error.userMessage;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Ocorreu um erro inesperado. Tente novamente.';
}
