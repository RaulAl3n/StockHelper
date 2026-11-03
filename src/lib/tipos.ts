export type TipoAtivo = "acao" | "fii";

/** Item mostrado na busca da tela inicial. */
export type ResultadoBusca = {
  ticker: string;
  nome: string;
  tipo: TipoAtivo;
  preco: number | null;
  logo: string | null;
};

/** Dados atuais do ativo, usados como base da projeção. */
export type AtivoInfo = {
  ticker: string;
  nome: string;
  preco: number;
  logo: string | null;
  /** Dividend yield anual em fração (0.08 = 8%), ou null se a API não informou. */
  dyAnual: number | null;
  /** De onde veio o DY, para mostrar ao usuário. */
  dyFonte: string | null;
  /** Variação do preço nos últimos 12 meses em fração, ou null se não houver histórico suficiente. */
  valorizacao12m: number | null;
  /** Fonte que respondeu: Yahoo Finance (principal) ou brapi (reserva). */
  fonte: "Yahoo Finance" | "brapi";
  atualizadoEm: string;
};
