import type { ResultadoBusca } from "./tipos";

/**
 * Atalhos da tela inicial e reserva quando a busca falha.
 * Os dados vêm do Yahoo Finance; se ele cair, a brapi sem token só cobre
 * PETR4, VALE3, ITUB4, MGLU3, MXRF11 e HGLG11.
 */
export const SUGESTOES: ResultadoBusca[] = [
  { ticker: "PETR4", nome: "Petrobras PN", tipo: "acao", preco: null, logo: null },
  { ticker: "VALE3", nome: "Vale ON", tipo: "acao", preco: null, logo: null },
  { ticker: "ITUB4", nome: "Itaú Unibanco PN", tipo: "acao", preco: null, logo: null },
  { ticker: "MGLU3", nome: "Magazine Luiza ON", tipo: "acao", preco: null, logo: null },
  { ticker: "MXRF11", nome: "Maxi Renda FII", tipo: "fii", preco: null, logo: null },
  { ticker: "HGLG11", nome: "CSHG Logística FII", tipo: "fii", preco: null, logo: null },
  { ticker: "XPML11", nome: "XP Malls FII", tipo: "fii", preco: null, logo: null },
  { ticker: "BTLG11", nome: "BTG Pactual Logística FII", tipo: "fii", preco: null, logo: null },
  { ticker: "KNCR11", nome: "Kinea Rendimentos Imobiliários FII", tipo: "fii", preco: null, logo: null },
];
