# 📚 Documentação dos Componentes Principais

Este documento descreve os componentes principais do Sistema Noxus, sua estrutura, props e exemplos de uso.

---

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── agendamento/      # Componentes de agendamentos
│   ├── clientes/         # Componentes de clientes
│   ├── financeiro/       # Componentes financeiros
│   ├── projetos/         # Componentes de projetos
│   ├── layout/           # Layout e navegação
│   └── ui/               # Componentes UI base (shadcn)
├── hooks/                # Hooks customizados
├── services/             # Serviços de dados
├── contexts/             # Contextos React
└── pages/                # Páginas da aplicação
```

---

## 🏦 Módulo Financeiro

### `FinanceiroSummaryCards`

Cards de resumo financeiro com totais de receitas, despesas e saldo.

```tsx
import { FinanceiroSummaryCards } from '@/components/financeiro';

<FinanceiroSummaryCards transacoes={transacoesFiltradas} />
```

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `transacoes` | `Transacao[]` | Lista de transações para cálculo |

---

### `TransacaoFormDialog`

Dialog para criação e edição de transações financeiras.

```tsx
import { TransacaoFormDialog } from '@/components/financeiro';

<TransacaoFormDialog
  isOpen={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  isEditMode={isEditMode}
  formData={formData}
  setFormData={setFormData}
  onSubmit={handleSubmit}
  contas={contas}
  agendamentos={agendamentos}
  saldoConta={saldoConta}
  previewSaldoPos={previewSaldoPos}
  onOpenNew={openNewDialog}
/>
```

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `isOpen` | `boolean` | Controla visibilidade do dialog |
| `onOpenChange` | `(open: boolean) => void` | Callback de mudança de estado |
| `isEditMode` | `boolean` | Modo edição vs criação |
| `formData` | `TransacaoFormData` | Dados do formulário |
| `setFormData` | `(data: TransacaoFormData) => void` | Setter do formulário |
| `onSubmit` | `(e: FormEvent) => void` | Handler de submit |
| `contas` | `ContaBancaria[]` | Lista de contas disponíveis |
| `agendamentos` | `Agendamento[]` | Agendamentos para vincular |
| `saldoConta` | `SaldoConta` | Saldo da conta selecionada |
| `previewSaldoPos` | `number` | Preview do saldo pós-transação |
| `onOpenNew` | `() => void` | Callback para abrir novo |

---

### `TransacoesFilters`

Popover com filtros de transações.

```tsx
import { TransacoesFilters } from '@/components/financeiro';

<TransacoesFilters
  filtroTipo={filtroTipo}
  setFiltroTipo={setFiltroTipo}
  filtroCategoria={filtroCategoria}
  setFiltroCategoria={setFiltroCategoria}
  filtroStatus={filtroStatus}
  setFiltroStatus={setFiltroStatus}
  filtroContaId={filtroContaId}
  setFiltroContaId={setFiltroContaId}
  contas={contas}
  resultCount={transacoesFiltradas.length}
/>
```

---

### `TransacoesTableView` / `TransacoesListView`

Visualizações de transações em tabela ou lista.

```tsx
import { TransacoesTableView, TransacoesListView } from '@/components/financeiro';

// Tabela
<TransacoesTableView
  transacoes={transacoes}
  onLiquidar={handleLiquidar}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// Lista com cards
<TransacoesListView
  transacoes={transacoes}
  onLiquidar={handleLiquidar}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

## 📅 Módulo de Agendamentos

### `AgendamentoFormDialog`

Dialog para criar/editar agendamentos.

```tsx
import { AgendamentoFormDialog } from '@/components/agendamento';

<AgendamentoFormDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  formData={formData}
  setFormData={setFormData}
  onSubmit={handleSubmit}
  clientes={clientes}
  projetos={projetos}
  editingAgendamento={editingAgendamento}
/>
```

---

### `AgendamentosTable`

Tabela de agendamentos com ações.

```tsx
import { AgendamentosTable } from '@/components/agendamento';

<AgendamentosTable
  agendamentos={agendamentosFiltrados}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onStatusChange={handleStatusChange}
  onConfirmSessao={handleConfirmSessao}
/>
```

---

## 👥 Módulo de Clientes

### `ClienteTable`

Tabela de clientes com LTV e ações.

```tsx
import { ClienteTable } from '@/components/clientes';

<ClienteTable
  clientes={clientesFiltrados}
  sortBy={sortBy}
  onSortChange={setSortBy}
  visibleCols={visibleCols}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

### `ClienteFilters`

Filtros avançados para clientes.

```tsx
import { ClienteFilters } from '@/components/clientes';

<ClienteFilters
  filtros={filtros}
  setFiltros={setFiltros}
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  availableCities={availableCities}
  onReset={resetFilters}
/>
```

---

## 🪝 Hooks Customizados

### `useFinanceiroReducer`

Hook para gerenciar estado complexo do módulo financeiro.

```tsx
import { useFinanceiroReducer } from '@/hooks/useFinanceiroReducer';

const { state, actions } = useFinanceiroReducer();

// Acessar estado
state.isDialogOpen
state.formData
state.filtroTipo

// Disparar ações
actions.openNewDialog()
actions.openEditDialog(transacao)
actions.setFiltroTipo('RECEITA')
actions.resetFiltros()
```

**Estado:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `isDialogOpen` | `boolean` | Dialog de formulário aberto |
| `isEditMode` | `boolean` | Modo edição ativo |
| `editingId` | `string \| null` | ID da transação em edição |
| `formData` | `TransacaoFormData` | Dados do formulário |
| `isLiquidarOpen` | `boolean` | Dialog de liquidação aberto |
| `liquidarTargetId` | `string \| null` | ID da transação a liquidar |
| `filtroTipo` | `'TODOS' \| TipoTransacao` | Filtro de tipo |
| `filtroCategoria` | `string` | Filtro de categoria |
| `filtroStatus` | `string` | Filtro de status |
| `filtroContaId` | `string` | Filtro de conta |

---

### `useProjetoDetalhesReducer`

Hook para gerenciar estado de edição no ProjetoDetalhes.

```tsx
import { useProjetoDetalhesReducer } from '@/hooks/useProjetoDetalhesReducer';

const { state, actions } = useProjetoDetalhesReducer();

// Editar sessão
actions.openEditSessaoDialog(sessao);
state.editSessaoForm.valor;
actions.setEditSessaoForm({ valor: 500 });
actions.closeEditSessaoDialog();
```

---

## 🔌 Serviços

### `TransacoesService`

Serviço para operações CRUD de transações.

```tsx
import { TransacoesService } from '@/services';

// Buscar transações
const transacoes = await TransacoesService.fetchAll(userId);

// Criar transação
const result = await TransacoesService.create(userId, {
  tipo: 'RECEITA',
  categoria: 'Pagamento de Cliente',
  valor: 1000,
  data_vencimento: '2024-06-01',
  descricao: 'Pagamento projeto X',
});

// Atualizar
await TransacoesService.update(transacaoId, { valor: 1500 });

// Liquidar
await TransacoesService.liquidar(transacaoId, userId, {
  data_liquidacao: '2024-06-10',
  conta_id: 'conta-principal',
}, transacaoOriginal);

// Deletar
await TransacoesService.delete(transacaoId);
```

---

### `ClientesService`

Serviço para operações CRUD de clientes.

```tsx
import { ClientesService } from '@/services';

// Buscar clientes com LTV
const clientes = await ClientesService.fetchAll(userId);

// Criar cliente
const cliente = await ClientesService.create(userId, {
  nome: 'João Silva',
  email: 'joao@email.com',
  telefone: '11999999999',
});

// Atualizar
await ClientesService.update(clienteId, { nome: 'João Santos' });

// Deletar
await ClientesService.delete(clienteId);
```

---

## 🎨 Padrões de Código

### Estrutura de Componente

```tsx
// 1. Imports
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Componente
export function Component({ title, onAction }: ComponentProps) {
  // 3.1 Hooks
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // 3.2 Effects
  useEffect(() => {
    // ...
  }, []);

  // 3.3 Handlers
  const handleClick = () => {
    setLoading(true);
    onAction();
  };

  // 3.4 Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick} disabled={loading}>
        Ação
      </Button>
    </div>
  );
}

// 4. Export default (opcional)
export default Component;
```

### Estrutura de Serviço

```tsx
// 1. Imports
import { supabase } from '@/integrations/supabase/client';

// 2. Types
export interface EntityDTO { ... }

// 3. Erro customizado
export class EntityServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'EntityServiceError';
  }
}

// 4. Classe de Serviço
export class EntityService {
  static async fetchAll(userId: string): Promise<Entity[]> {
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new EntityServiceError('Erro ao buscar', 'FETCH_ERROR', error);
    }
  }

  // ... outros métodos
}
```

---

## 🧪 Testes

### Executar Testes

```bash
# Modo watch
pnpm test

# Executar uma vez
pnpm test:run

# Com cobertura
pnpm test:ci

# Interface visual
pnpm test:ui
```

### Estrutura de Teste

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@/test/utils';
import { Component } from './Component';

describe('Component', () => {
  it('deve renderizar corretamente', () => {
    render(<Component title="Teste" onAction={vi.fn()} />);
    expect(screen.getByText('Teste')).toBeInTheDocument();
  });

  it('deve chamar onAction ao clicar', async () => {
    const onAction = vi.fn();
    render(<Component title="Teste" onAction={onAction} />);
    
    await act(async () => {
      screen.getByRole('button').click();
    });
    
    expect(onAction).toHaveBeenCalled();
  });
});
```

---

## 📋 Convenções

1. **Nomes de arquivos**: PascalCase para componentes, camelCase para hooks/utils
2. **Exportações**: Named exports para componentes, classes de serviço
3. **Props**: Interface com nome `NomeComponenteProps`
4. **Tipos**: Usar TypeScript strict mode
5. **Estilo**: Tailwind CSS + shadcn/ui
6. **Estado**: useState para simples, useReducer para complexo

