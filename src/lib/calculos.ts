/** Cálculos compartilhados pelas fontes de dados (Yahoo Finance e brapi). */

export const UM_ANO_MS = 365 * 24 * 60 * 60 * 1000;

export type Provento = { valor: number; data: Date | null };
export type PontoPreco = { data: Date; preco: number | null };

/**
 * Dividend yield dos últimos 12 meses: soma dos proventos por cota com data
 * no último ano, dividida pelo preço atual. Retorna null se não houver proventos.
 */
export function calcularDy(proventos: Provento[], preco: number, agora = Date.now()): number | null {
  if (!proventos.length || preco <= 0) return null;
  const soma = proventos.reduce((total, p) => {
    if (!p.data || !(p.valor > 0)) return total;
    const t = p.data.getTime();
    return t <= agora && agora - t <= UM_ANO_MS ? total + p.valor : total;
  }, 0);
  return soma > 0 ? soma / preco : null;
}

/**
 * Variação do preço nos últimos 12 meses. Usa o preço de fechamento sem ajuste
 * por proventos, senão os dividendos seriam contados duas vezes (aqui e no DY).
 * Retorna null se o histórico não cobrir perto de um ano.
 */
export function calcularValorizacao(
  historico: PontoPreco[],
  precoAtual: number,
  agora = Date.now(),
): number | null {
  const validos = historico
    .filter((p): p is { data: Date; preco: number } => typeof p.preco === "number" && p.preco > 0)
    .sort((a, b) => a.data.getTime() - b.data.getTime());
  if (validos.length < 2 || precoAtual <= 0) return null;
  if (agora - validos[0].data.getTime() < UM_ANO_MS * 0.9) return null;
  return precoAtual / validos[0].preco - 1;
}
