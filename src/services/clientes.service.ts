import { supabase } from '@/integrations/supabase/client';

/**
 * Tipos de dados
 */
export interface Cliente {
    id: string;
    user_id?: string;
    nome: string;
    email?: string;
    telefone?: string;
    documento?: string;
    endereco?: string;
    instagram?: string;
    cidade?: string;
    cidades?: string[];
    indicado_por?: string | null;
    data_aniversario?: string;
    foto_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ClienteComLTV extends Cliente {
    ltv: number;
    projetos_count: number;
    transacoes_count: number;
}

export interface CreateClienteDTO {
    nome: string;
    email?: string;
    telefone?: string;
    instagram?: string;
    cidade?: string;
    cidades?: string[];
    indicado_por?: string;
    data_aniversario?: string;
}

export interface UpdateClienteDTO {
    nome?: string;
    email?: string;
    telefone?: string;
    instagram?: string;
    cidade?: string;
    indicado_por?: string;
    data_aniversario?: string;
}

/**
 * Erros customizados
 */
export class ClientesServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'ClientesServiceError';
    }
}

/**
 * Serviço de Clientes
 * 
 * Centraliza toda a lógica de negócio relacionada a clientes,
 * incluindo operações CRUD e cálculos de métricas.
 */
export class ClientesService {
    /**
     * Busca todos os clientes com LTV calculado
     * 
     * @returns Lista de clientes com métricas calculadas
     * @throws ClientesServiceError
     */
    /**
     * Busca todos os clientes com LTV calculado
     * 
     * @returns Lista de clientes com métricas calculadas
     * @throws ClientesServiceError
     */
    static async fetchAll(userId: string): Promise<ClienteComLTV[]> {
        try {
            // 1. Buscar clientes da view com LTV já calculado
            const { data: clientesData, error: clientesError } = await supabase
                .from('clientes_com_ltv')
                .select('*')
                .eq('user_id', userId)
                .order('ltv', { ascending: false });

            if (clientesError) throw clientesError;

            // 2. Buscar cidades vinculadas (mantido pois é N:N)
            let cidadesPorCliente: Record<string, string[]> = {};
            try {
                const { data: ccData, error: ccError } = await supabase
                    .from('clientes_cidades')
                    .select('cliente_id, cidades (nome)');

                if (!ccError && ccData) {
                    ccData.forEach((row: any) => {
                        const nomeCidade = row.cidades?.nome;
                        if (!nomeCidade) return;
                        if (!cidadesPorCliente[row.cliente_id]) {
                            cidadesPorCliente[row.cliente_id] = [];
                        }
                        cidadesPorCliente[row.cliente_id].push(nomeCidade);
                    });
                }
            } catch (err) {
                console.warn('Tabela clientes_cidades não disponível:', err);
            }

            // 3. Combinar dados
            const clientesComLTV: ClienteComLTV[] = (clientesData || []).map(cliente => ({
                ...cliente,
                cidades: cidadesPorCliente[cliente.id] || undefined,
            }));

            return clientesComLTV;
        } catch (error: any) {
            throw new ClientesServiceError(
                'Erro ao buscar clientes',
                'FETCH_ERROR',
                error
            );
        }
    }

    /**
     * Cria um novo cliente
     * 
     * @param userId ID do usuário logado
     * @param data Dados do cliente
     * @returns Cliente criado
     * @throws ClientesServiceError
     */
    static async create(
        userId: string,
        data: CreateClienteDTO
    ): Promise<Cliente> {
        try {
            const payload: any = {
                user_id: userId,
                nome: data.nome,
            };

            if (data.email) payload.email = data.email;
            if (data.telefone) payload.telefone = data.telefone;
            if (data.instagram) payload.instagram = data.instagram;
            if (data.cidade) payload.cidade = data.cidade;
            if (data.data_aniversario) payload.data_aniversario = data.data_aniversario;
            if (data.indicado_por && data.indicado_por !== 'none') {
                payload.indicado_por = data.indicado_por;
            }

            const { data: cliente, error } = await supabase
                .from('clientes')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            // Vincular cidades se fornecidas
            if (cliente && data.cidades && data.cidades.length > 0) {
                await this.linkCidades(userId, cliente.id, data.cidades);
            }

            return cliente;
        } catch (error: any) {
            throw new ClientesServiceError(
                'Erro ao criar cliente',
                'CREATE_ERROR',
                error
            );
        }
    }

    /**
     * Atualiza um cliente existente
     * 
     * @param clienteId ID do cliente
     * @param data Dados para atualizar
     * @returns Cliente atualizado
     * @throws ClientesServiceError
     */
    static async update(
        clienteId: string,
        data: UpdateClienteDTO
    ): Promise<Cliente> {
        try {
            const { data: cliente, error } = await supabase
                .from('clientes')
                .update(data)
                .eq('id', clienteId)
                .select()
                .single();

            if (error) throw error;

            return cliente;
        } catch (error: any) {
            throw new ClientesServiceError(
                'Erro ao atualizar cliente',
                'UPDATE_ERROR',
                error
            );
        }
    }

    /**
     * Deleta um cliente
     * 
     * @param clienteId ID do cliente
     * @throws ClientesServiceError
     */
    static async delete(clienteId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', clienteId);

            if (error) throw error;
        } catch (error: any) {
            throw new ClientesServiceError(
                'Erro ao deletar cliente',
                'DELETE_ERROR',
                error
            );
        }
    }

    /**
     * Vincula cidades a um cliente
     * 
     * @private
     */
    private static async linkCidades(
        userId: string,
        clienteId: string,
        cidadeNomes: string[]
    ): Promise<void> {
        try {
            // Buscar cidades existentes
            const { data: cidadesExistentes } = await supabase
                .from('cidades')
                .select('id, nome');

            const cidadeMap = new Map<string, string>();
            (cidadesExistentes || []).forEach((c: any) => {
                if (c?.nome && c?.id) {
                    cidadeMap.set(c.nome.toLowerCase(), c.id);
                }
            });

            // Garantir que todas as cidades existam
            const cidadeIds: string[] = [];
            for (const nome of cidadeNomes) {
                const key = nome.toLowerCase();
                let cidadeId = cidadeMap.get(key);

                if (!cidadeId) {
                    // Criar cidade
                    const { data: novaCidade, error } = await supabase
                        .from('cidades')
                        .insert([{ user_id: userId, nome }])
                        .select()
                        .single();

                    if (error) throw error;
                    cidadeId = novaCidade.id;
                }

                cidadeIds.push(cidadeId);
            }

            // Vincular cidades ao cliente
            if (cidadeIds.length > 0) {
                const rows = cidadeIds.map(cid => ({
                    user_id: userId,
                    cliente_id: clienteId,
                    cidade_id: cid,
                }));

                const { error } = await supabase
                    .from('clientes_cidades')
                    .insert(rows);

                if (error) throw error;
            }
        } catch (error) {
            console.warn('Erro ao vincular cidades:', error);
            // Não propaga erro - cidades são opcionais
        }
    }
}
