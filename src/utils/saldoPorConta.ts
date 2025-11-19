import { ContaBancariaRecord } from "@/hooks/useContasBancarias";

type Tx = {
  conta_id?: string | null;
  valor: number;
  tipo: string;
  data_liquidacao?: string | null;
};

const norm = (v: any) => String(v || "").toLowerCase();

export function calcularSaldoConta(
  contaId: string | null | undefined,
  contas: ContaBancariaRecord[],
  transacoes: Tx[]
) {
  const id = String(contaId || "");
  const conta = contas.find((c) => String(c.id) === id);
  const saldoInicial = Number(conta?.saldo_inicial || 0);
  const txConta = (transacoes || []).filter((t) => {
    const same = String(t.conta_id || "") === id;
    const hasLiquidacaoField = Object.prototype.hasOwnProperty.call(t, "data_liquidacao");
    const isLiquidado = hasLiquidacaoField ? !!t.data_liquidacao : true;
    return same && isLiquidado;
  });
  const entradas = txConta
    .filter((t) => {
      const nt = norm(t.tipo);
      return nt === "receita" || nt === "entrada";
    })
    .reduce((s, t) => s + Number(t.valor || 0), 0);
  const saidas = txConta
    .filter((t) => {
      const nt = norm(t.tipo);
      return nt === "despesa" || nt === "saida";
    })
    .reduce((s, t) => s + Number(t.valor || 0), 0);
  const saldoAtual = saldoInicial + entradas - saidas;
  return { saldoInicial, entradas, saidas, saldoAtual };
}

export function saldoPosTransacao(
  saldoAtual: number,
  tipo: string,
  valor: number,
  liquidarAgora: boolean
) {
  if (!liquidarAgora) return saldoAtual;
  const nt = norm(tipo);
  const isReceita = nt === "receita" || nt === "entrada";
  const v = Number(valor || 0);
  return isReceita ? saldoAtual + v : saldoAtual - v;
}
