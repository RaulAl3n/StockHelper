export type ParametrosSimulacao = {
  aporteMensal: number;
  precoInicial: number;
  /** Dividend yield anual em fração (0.08 = 8%). */
  dyAnual: number;
  /** Valorização anual da cota em fração (0.05 = 5%). */
  valorizacaoAnual: number;
  anos: number;
  /** Se true, os proventos compram novas cotas; se false, ficam acumulados em caixa. */
  reinvestir: boolean;
};

export type PontoSimulacao = {
  mes: number;
  investido: number;
  saldo: number;
  dividendosAcumulados: number;
  /** Proventos recebidos naquele mês. */
  rendaMes: number;
};

/**
 * Faixas aceitas nas premissas. Fora delas a conta perde sentido: valorização
 * de -100% zera o preço (divisão por zero) e valores enormes viram Infinity.
 */
export const LIMITES = {
  aporteMax: 1_000_000,
  dyMin: 0,
  dyMax: 1, // 100% a.a.
  valorizacaoMin: -0.9, // -90% a.a.
  valorizacaoMax: 1, // 100% a.a.
  anosMin: 1,
  anosMax: 50,
} as const;

export const limitar = (v: number, min: number, max: number) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

/**
 * Projeção mês a mês a partir dos atributos atuais do ativo:
 * 1. compra cotas com o aporte, ao preço do mês (aceita cotas fracionárias);
 * 2. recebe proventos de dyAnual/12 sobre o patrimônio em cotas;
 * 3. reinveste os proventos (ou guarda em caixa);
 * 4. corrige o preço pela valorização mensal equivalente.
 */
export function simular(entrada: ParametrosSimulacao): PontoSimulacao[] {
  // Defesa extra: a interface já limita, mas a URL pode ser editada à mão.
  const p = {
    ...entrada,
    aporteMensal: limitar(entrada.aporteMensal, 0, LIMITES.aporteMax),
    dyAnual: limitar(entrada.dyAnual, LIMITES.dyMin, LIMITES.dyMax),
    valorizacaoAnual: limitar(entrada.valorizacaoAnual, LIMITES.valorizacaoMin, LIMITES.valorizacaoMax),
    anos: limitar(entrada.anos, LIMITES.anosMin, LIMITES.anosMax),
  };
  if (!(p.precoInicial > 0)) return [{ mes: 0, investido: 0, saldo: 0, dividendosAcumulados: 0, rendaMes: 0 }];

  const meses = Math.round(p.anos * 12);
  const fatorPreco = Math.pow(1 + p.valorizacaoAnual, 1 / 12);
  const dyMensal = p.dyAnual / 12;

  let cotas = 0;
  let caixa = 0;
  let preco = p.precoInicial;
  let investido = 0;
  let dividendosAcumulados = 0;

  const pontos: PontoSimulacao[] = [
    { mes: 0, investido: 0, saldo: 0, dividendosAcumulados: 0, rendaMes: 0 },
  ];

  for (let mes = 1; mes <= meses; mes++) {
    cotas += p.aporteMensal / preco;
    investido += p.aporteMensal;

    const rendaMes = cotas * preco * dyMensal;
    dividendosAcumulados += rendaMes;
    if (p.reinvestir) cotas += rendaMes / preco;
    else caixa += rendaMes;

    preco *= fatorPreco;

    pontos.push({
      mes,
      investido,
      saldo: cotas * preco + caixa,
      dividendosAcumulados,
      rendaMes,
    });
  }

  return pontos;
}
