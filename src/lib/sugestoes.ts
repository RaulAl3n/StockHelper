import type { ResultadoBusca } from "./tipos";

/**
 * Ativos que a brapi libera com dados completos mesmo sem token.
 * Servem de sugestão na tela inicial e de reserva quando a busca falha.
 */
export const SUGESTOES: ResultadoBusca[] = [
  { ticker: "PETR4", nome: "Petrobras PN", tipo: "acao", preco: null, logo: null },
  { ticker: "VALE3", nome: "Vale ON", tipo: "acao", preco: null, logo: null },
  { ticker: "ITUB4", nome: "Itaú Unibanco PN", tipo: "acao", preco: null, logo: null },
  { ticker: "MGLU3", nome: "Magazine Luiza ON", tipo: "acao", preco: null, logo: null },
  { ticker: "MXRF11", nome: "Maxi Renda FII", tipo: "fii", preco: null, logo: null },
  { ticker: "HGLG11", nome: "CSHG Logística FII", tipo: "fii", preco: null, logo: null },
];
