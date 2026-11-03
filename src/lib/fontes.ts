import "server-only";
import { ErroBrapi, buscarAtivosBrapi, obterAtivoBrapi } from "./brapi";
import { buscarAtivosYahoo, obterAtivoYahoo } from "./yahoo";
import type { AtivoInfo, ResultadoBusca, TipoAtivo } from "./tipos";

/**
 * Ponto único de acesso aos dados de mercado.
 * Yahoo Finance é a fonte principal (sem token, traz dividendos e histórico);
 * a brapi entra como reserva quando o Yahoo falha ou não conhece o ativo.
 */

const UMA_HORA_MS = 60 * 60 * 1000;
const cache = new Map<string, { valor: unknown; expira: number }>();

/** Cache em memória por instância do servidor, para poupar as duas APIs. */
async function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  const item = cache.get(chave);
  if (item && item.expira > Date.now()) return item.valor as T;
  const valor = await buscar();
  cache.set(chave, { valor, expira: Date.now() + UMA_HORA_MS });
  return valor;
}

export async function obterAtivo(ticker: string): Promise<AtivoInfo> {
  return comCache(`ativo:${ticker}`, async () => {
    try {
      return await obterAtivoYahoo(ticker);
    } catch (erroYahoo) {
      console.warn(`Yahoo falhou para ${ticker}, tentando brapi:`, (erroYahoo as Error).message);
      // Se a brapi também falhar, o erro dela (com status HTTP) segue para a rota.
      return obterAtivoBrapi(ticker);
    }
  });
}

export async function buscarAtivos(termo: string, tipo: TipoAtivo): Promise<ResultadoBusca[]> {
  return comCache(`busca:${tipo}:${termo.toUpperCase()}`, async () => {
    try {
      const resultados = await buscarAtivosYahoo(termo, tipo);
      if (resultados.length > 0) return resultados;
    } catch (erroYahoo) {
      console.warn(`Busca no Yahoo falhou para "${termo}", tentando brapi:`, (erroYahoo as Error).message);
    }
    return buscarAtivosBrapi(termo, tipo);
  });
}

export { ErroBrapi };
