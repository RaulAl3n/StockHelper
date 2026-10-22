import { NextResponse } from "next/server";
import { ErroBrapi, obterAtivo } from "@/lib/brapi";

const TICKER_VALIDO = /^[A-Z0-9]{4,7}$/;

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase() ?? "";
  if (!TICKER_VALIDO.test(ticker)) {
    return NextResponse.json({ erro: "Código de ativo inválido." }, { status: 400 });
  }

  try {
    const ativo = await obterAtivo(ticker);
    return NextResponse.json(ativo, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (erro) {
    if (erro instanceof ErroBrapi) {
      if (erro.status === 404) {
        return NextResponse.json({ erro: `Não encontramos o ativo ${ticker}.` }, { status: 404 });
      }
      if (erro.status === 401 || erro.status === 403) {
        return NextResponse.json(
          {
            erro: `${ticker} precisa de um token da brapi. Configure BRAPI_TOKEN ou teste com PETR4, VALE3, ITUB4, MGLU3, MXRF11 ou HGLG11.`,
          },
          { status: 403 },
        );
      }
      if (erro.status === 429) {
        return NextResponse.json(
          { erro: "Limite de consultas da API atingido. Tente de novo mais tarde." },
          { status: 429 },
        );
      }
    }
    console.error(erro);
    return NextResponse.json(
      { erro: "Não foi possível buscar os dados agora. Tente de novo em instantes." },
      { status: 502 },
    );
  }
}
