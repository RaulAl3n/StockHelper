const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const moedaInteira = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const percentual = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export const formatarMoeda = (v: number) => moeda.format(v);
export const formatarMoedaInteira = (v: number) => moedaInteira.format(v);
export const formatarMoedaCompacta = (v: number) => moedaCompacta.format(v);
export const formatarPercentual = (v: number) => percentual.format(v);

/** Converte "1.500,50", "1500.5" ou "1500" em número. Retorna NaN se inválido. */
export function lerValor(texto: string): number {
  const limpo = texto.replace(/[^\d.,-]/g, "");
  if (!limpo) return NaN;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  return Number(normalizado);
}

/** Número para o formato de digitação brasileiro, sem símbolo: 1500 -> "1.500". */
export function escreverValor(v: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(v);
}
