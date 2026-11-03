import "server-only";
import YahooFinance from "yahoo-finance2";
import type { ChartResultArray } from "yahoo-finance2/modules/chart";
import type { AtivoInfo, ResultadoBusca, TipoAtivo } from "./tipos";
import { calcularDy, calcularValorizacao, UM_ANO_MS } from "./calculos";

/**
 * Yahoo Finance via yahoo-finance2 (biblioteca não oficial, sem token).
 * Ativos da B3 usam o sufixo .SA: PETR4 -> PETR4.SA.
 */
const yahoo = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const SUFIXO_B3 = ".SA";
// "CI" é a especificação de cotas de fundo na B3 (ex.: "CSHG LOG CI"); units usam "UNT".
const NOME_DE_FII = /\bFII\b|\bFDO\b|FUNDO|IMOB|\bCI\b/i;

export const paraYahoo = (ticker: string) => `${ticker}${SUFIXO_B3}`;
export const deYahoo = (simbolo: string) => simbolo.replace(/\.SA$/i, "");

/** FIIs terminam em 11 e têm "FII", "Fundo", "Imobiliário" ou "CI" no nome (units como TAEE11 não). */
export function ehFii(ticker: string, nome: string): boolean {
  return /11$/.test(ticker) && NOME_DE_FII.test(nome);
}

// ---------- Dados de um ativo ----------

/** Converte a resposta do módulo chart (com eventos de dividendos) no formato do app. */
export function converterChart(ticker: string, r: ChartResultArray, agora = Date.now()): AtivoInfo {
  const preco = r.meta.regularMarketPrice;
  if (!(preco > 0)) throw new Error(`Yahoo sem preço para ${ticker}`);

  const proventos = (r.events?.dividends ?? []).map((d) => ({
    valor: d.amount,
    data: d.date instanceof Date ? d.date : new Date(d.date),
  }));
  const dyAnual = calcularDy(proventos, preco, agora);

  return {
    ticker,
    nome: r.meta.longName || r.meta.shortName || ticker,
    preco,
    logo: null,
    dyAnual,
    dyFonte: dyAnual !== null ? "Proventos dos últimos 12 meses" : null,
    valorizacao12m: calcularValorizacao(
      r.quotes.map((q) => ({ data: q.date, preco: q.close })),
      preco,
      agora,
    ),
    fonte: "Yahoo Finance",
    atualizadoEm: new Date(agora).toISOString(),
  };
}

export async function obterAtivoYahoo(ticker: string): Promise<AtivoInfo> {
  const resultado = await yahoo.chart(paraYahoo(ticker), {
    // Um pouco mais de 12 meses para o primeiro fechamento mensal cair antes de "um ano atrás".
    period1: new Date(Date.now() - UM_ANO_MS - 20 * 24 * 60 * 60 * 1000),
    interval: "1mo",
    events: "div",
  });
  return converterChart(ticker, resultado);
}

// ---------- Busca de ativos ----------

type CotacaoBusca = {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  isYahooFinance?: boolean;
};

/** Filtra a busca do Yahoo para ativos da B3 do tipo pedido. */
export function converterBusca(quotes: CotacaoBusca[], tipo: TipoAtivo): ResultadoBusca[] {
  return quotes
    .filter(
      (q): q is CotacaoBusca & { symbol: string } =>
        typeof q.symbol === "string" &&
        q.symbol.toUpperCase().endsWith(SUFIXO_B3) &&
        (q.quoteType === "EQUITY" || q.quoteType === "MUTUALFUND"),
    )
    .map((q) => {
      const ticker = deYahoo(q.symbol).toUpperCase();
      const nome = q.longname || q.shortname || ticker;
      const nomes = `${q.longname ?? ""} ${q.shortname ?? ""}`;
      return {
        ticker,
        nome,
        tipo: ehFii(ticker, nomes) ? ("fii" as const) : ("acao" as const),
        preco: null,
        logo: null,
      };
    })
    .filter((r) => r.tipo === tipo)
    .slice(0, 8);
}

export async function buscarAtivosYahoo(termo: string, tipo: TipoAtivo): Promise<ResultadoBusca[]> {
  const { quotes } = await yahoo.search(termo, {
    quotesCount: 20,
    newsCount: 0,
    region: "BR",
    lang: "pt-BR",
  });
  return converterBusca(quotes as CotacaoBusca[], tipo);
}
