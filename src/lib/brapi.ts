import "server-only";
import type { AtivoInfo, ResultadoBusca, TipoAtivo } from "./tipos";

const BASE = "https://brapi.dev/api";
const UM_ANO_MS = 365 * 24 * 60 * 60 * 1000;

/** Erro com status HTTP, para a rota repassar ao front-end. */
export class ErroBrapi extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function cabecalhos(): HeadersInit {
  const token = process.env.BRAPI_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** GET na brapi com cache de 1 hora no servidor (poupa o limite mensal da API). */
async function buscar<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    headers: cabecalhos(),
    next: { revalidate: 3600 },
  });
  if (!resposta.ok) {
    throw new ErroBrapi(`brapi respondeu ${resposta.status} em ${caminho}`, resposta.status);
  }
  return resposta.json() as Promise<T>;
}

// ---------- Busca de ativos ----------

type ListaBrapi = {
  stocks?: {
    stock: string;
    name: string;
    close: number | null;
    logo: string | null;
    type: string;
    subType?: string;
  }[];
};

export async function buscarAtivos(termo: string, tipo: TipoAtivo): Promise<ResultadoBusca[]> {
  const params = new URLSearchParams({ search: termo, limit: "8", sortBy: "volume" });
  if (tipo === "fii") {
    params.set("type", "fund");
    params.set("subType", "fii");
  } else {
    params.set("type", "stock");
  }
  const dados = await buscar<ListaBrapi>(`/quote/list?${params}`);
  return (dados.stocks ?? []).map((s) => ({
    ticker: s.stock,
    nome: s.name,
    tipo,
    preco: s.close,
    logo: s.logo,
  }));
}

// ---------- Dados de um ativo ----------

type CotacaoBrapi = {
  results?: {
    symbol: string;
    shortName?: string;
    longName?: string;
    regularMarketPrice: number;
    logourl?: string;
    historicalDataPrice?: { date: number; close: number | null; adjustedClose?: number | null }[];
    dividendsData?: {
      cashDividends?: { rate: number; paymentDate: string | null; lastDatePrior: string | null }[];
    };
  }[];
};

type IndicadoresFii = {
  fiis?: { symbol: string; dividendYield12m?: number | null }[];
};

/**
 * Busca cotação, histórico de 1 ano e dividendos.
 * O plano gratuito da brapi não libera histórico longo nem dividendos (exceto
 * para os ativos de teste), então se a chamada completa for recusada,
 * tentamos só a cotação e deixamos o usuário informar DY e valorização.
 */
async function buscarCotacao(ticker: string) {
  try {
    return await buscar<CotacaoBrapi>(`/quote/${ticker}?range=1y&interval=1mo&dividends=true`);
  } catch (erro) {
    if (erro instanceof ErroBrapi && erro.status === 404) throw erro;
    return buscar<CotacaoBrapi>(`/quote/${ticker}`);
  }
}

/** Soma dos dividendos com data-com (ou pagamento) nos últimos 12 meses, dividida pelo preço. */
function calcularDy(
  dividendos: { rate: number; paymentDate: string | null; lastDatePrior: string | null }[],
  preco: number,
): number | null {
  if (!dividendos.length || preco <= 0) return null;
  const agora = Date.now();
  const soma = dividendos.reduce((total, d) => {
    const data = d.lastDatePrior ?? d.paymentDate;
    if (!data) return total;
    const t = new Date(data).getTime();
    return agora - t <= UM_ANO_MS && t <= agora ? total + d.rate : total;
  }, 0);
  return soma > 0 ? soma / preco : null;
}

function calcularValorizacao(
  historico: { date: number; close: number | null; adjustedClose?: number | null }[],
  precoAtual: number,
): number | null {
  const validos = historico
    .map((p) => ({ data: p.date * 1000, preco: p.adjustedClose ?? p.close }))
    .filter((p): p is { data: number; preco: number } => typeof p.preco === "number" && p.preco > 0)
    .sort((a, b) => a.data - b.data);
  if (validos.length < 2) return null;
  // Só faz sentido falar em "12 meses" se o histórico cobre perto de um ano.
  const cobertura = Date.now() - validos[0].data;
  if (cobertura < UM_ANO_MS * 0.9) return null;
  return precoAtual / validos[0].preco - 1;
}

/** A brapi não deixa claro se o DY de FIIs vem em % ou fração; normalizamos para fração. */
function normalizarPercentual(valor: number): number {
  return valor > 1 ? valor / 100 : valor;
}

async function buscarDyFii(ticker: string): Promise<number | null> {
  try {
    const dados = await buscar<IndicadoresFii>(`/v2/fii/indicators?symbols=${ticker}`);
    const dy = dados.fiis?.[0]?.dividendYield12m;
    return typeof dy === "number" && dy > 0 ? normalizarPercentual(dy) : null;
  } catch {
    return null; // Endpoint exige plano Pro, exceto MXRF11 e HGLG11.
  }
}

export async function obterAtivo(ticker: string): Promise<AtivoInfo> {
  const dados = await buscarCotacao(ticker);
  const r = dados.results?.[0];
  if (!r || typeof r.regularMarketPrice !== "number") {
    throw new ErroBrapi(`Ativo ${ticker} não encontrado`, 404);
  }

  let dyAnual = calcularDy(r.dividendsData?.cashDividends ?? [], r.regularMarketPrice);
  let dyFonte = dyAnual !== null ? "Proventos dos últimos 12 meses" : null;

  if (dyAnual === null && ticker.endsWith("11")) {
    dyAnual = await buscarDyFii(ticker);
    if (dyAnual !== null) dyFonte = "Dividend yield 12 meses do fundo";
  }

  return {
    ticker: r.symbol,
    nome: r.longName || r.shortName || r.symbol,
    preco: r.regularMarketPrice,
    logo: r.logourl ?? null,
    dyAnual,
    dyFonte,
    valorizacao12m: calcularValorizacao(r.historicalDataPrice ?? [], r.regularMarketPrice),
    atualizadoEm: new Date().toISOString(),
  };
}
