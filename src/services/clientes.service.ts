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
    status: 'lead' | 'cliente' | 'desativado';
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
    status?: 'lead' | 'cliente' | 'desativado';
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
    static async fetchAll(userId?: string): Promise<ClienteComLTV[]> {
        try {
            // 1. Tentar buscar da view (ideal)
            // Se userId for fornecido, filtra. Se não, confia no RLS.
            let query = supabase
                .from('clientes_com_ltv')
                .select('*')
                .order('ltv', { ascending: false });

            // Se quisermos ver APENAS meus clientes, usamos userId.
            // Mas se somos assistentes vendo clientes do admin, a query deve ser aberta (RLS filtra)
            // Por padrão, vamos confiar no RLS se userId não for crítico. 
            // Porém, a assinatura pedia userId. Vamos manter opcional.

            // if (userId) query = query.eq('user_id', userId); 
            // REMOVIDO FILTRO DE ID PARA PERMITIR ASSISTENTES VEREM DADOS DO ADMIN (RLS DECIDE)

            const { data: clientesData, error: clientesError } = await query;

            // Se der sucesso, usa a view
            if (!clientesError && clientesData) {
                // ... Busca cidades ... (Lógica existente simplificada abaixo)
                return await this.enrichWithCities(clientesData);
            }

            throw clientesError; // Força cair no catch para tentar o fallback

        } catch (viewError: any) {
            console.warn("View falhou. Tentando tabela...", viewError);

            // Aguardar 500ms antes de tentar fallback para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 500));

            // 2. FALLBACK: Buscar da tabela bruta 'clientes'
            try {
                let queryRaw = supabase
                    .from('clientes')
                    .select('*')
                    .order('nome', { ascending: true });

                // if (userId) queryRaw = queryRaw.eq('user_id', userId);
                // REMOVIDO FILTRO DE ID

                const { data: rawData, error: rawError } = await queryRaw;

                if (rawError) throw rawError;

                // Converter para formato ComLTV (com zeros)
                const fallbackData: ClienteComLTV[] = (rawData || []).map(c => ({
                    ...c,
                    ltv: 0,
                    projetos_count: 0,
                    transacoes_count: 0,
                    cidades: undefined // Será preenchido pelo enrich
                }));

                return await this.enrichWithCities(fallbackData);

            } catch (tableError) {
                console.warn("Tabela falhou (bloqueio severo). Tentando RPC V4...", tableError);

                // Aguardar 1s antes de tentar último fallback
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 3. ULTIMATO: Tentar via RPC V4 (Seleção Dinâmica - À prova de falhas)
                try {
                    // Log para debug
                    console.log("Chamando RPC get_clients_v4 com ID:", userId);

                    // A RPC V4 geralmente exige parametro. Se for nulo, pode falhar.
                    // Se formos assistente, precisamos do ID do Admin para essa RPC funcionar se ela for SECURITY DEFINER e filtrar.
                    // Mas se não sabemos o ID do Admin, essa RPC pode ser inútil para o assistente.
                    // Vamos tentar passar user_id se tiver, senao null.

                    const { data: rpcData, error: rpcError } = await supabase
                        .rpc('get_clients_v4', { p_user_id: userId || null });

                    if (rpcError) {
                        console.error("Erro na RPC V4:", rpcError);
                        throw rpcError;
                    }

                    // O RPC retorna JSON, precisamos garantir tipagem
                    const safeData = (rpcData as any[]) || [];

                    const finalData: ClienteComLTV[] = safeData.map(c => ({
                        ...c,
                        ltv: c.ltv || 0,
                        projetos_count: 0,
                        transacoes_count: 0,
                        cidades: undefined // Será preenchido
                    }));

                    return await this.enrichWithCities(finalData);

                } catch (rpcFatalError) {
                    throw new ClientesServiceError(
                        'Erro Fatal: Clientes inacessíveis por todas as vias (até RPC falhou).',
                        'FETCH_ERROR',
                        rpcFatalError
                    );
                }
            }
        }
    }

    // Helper auxiliar para não duplicar código de cidades
    private static async enrichWithCities(clientes: ClienteComLTV[]): Promise<ClienteComLTV[]> {
        let cidadesPorCliente: Record<string, string[]> = {};
        try {
            const { data: ccData } = await supabase
                .from('clientes_cidades')
                .select('cliente_id, cidades (nome)');

            if (ccData) {
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
            console.warn('Cidades indisponíveis:', err);
        }

        return clientes.map(c => ({
            ...c,
            cidades: cidadesPorCliente[c.id] || undefined
        }));
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
                status: data.status || 'cliente',
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
