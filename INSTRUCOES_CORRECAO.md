# Instruções para Corrigir o Agrupamento de Nós

## Problema
Os nós estão se agrupando no canto superior direito do mapa de conexões.

## Solução
Substituir as **linhas 605-613** do arquivo `src/components/clientes/ReferralNetwork.tsx`

### Código Atual (REMOVER):
```typescript
        // Distribuir nós uniformemente pela largura disponível
        sortedNodes.forEach((node, index) => {
          // Calcular posição X para distribuição uniforme
          const x = margin + spacing + (index * spacing);
          
          // Garantir que não saia dos limites
          node.x = Math.max(margin, Math.min(width - margin, x));
          node.y = y;
        });
```

### Código Novo (ADICIONAR):
```typescript
        // Distribuir nós uniformemente pela largura disponível
        if (totalNodes === 1) {
          // Se há apenas um nó, centralizar
          sortedNodes[0].x = width / 2;
          sortedNodes[0].y = y;
        } else {
          // Distribuir uniformemente do início ao fim da largura disponível
          const step = availableWidth / (totalNodes - 1);
          
          sortedNodes.forEach((node, index) => {
            node.x = margin + (index * step);
            node.y = y;
          });
        }
```

## Explicação
A fórmula antiga `margin + spacing + (index * spacing)` estava causando acúmulo progressivo à direita.
A nova fórmula `margin + (index * step)` distribui linearmente os nós de forma uniforme pela largura disponível.
