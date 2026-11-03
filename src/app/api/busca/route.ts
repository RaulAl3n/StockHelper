import { NextResponse } from "next/server";
import { buscarAtivos } from "@/lib/fontes";
import { SUGESTOES } from "@/lib/sugestoes";
import type { TipoAtivo } from "@/lib/tipos";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const termo = (params.get("q") ?? "").trim().slice(0, 30);
  const tipo: TipoAtivo = params.get("tipo") === "fii" ? "fii" : "acao";

  const reserva = () =>
    SUGESTOES.filter(
      (s) =>
        s.tipo === tipo &&
        (s.ticker.includes(termo.toUpperCase()) ||
          s.nome.toLowerCase().includes(termo.toLowerCase())),
    );

  if (termo.length < 2) {
    return NextResponse.json({ resultados: reserva(), reserva: true });
  }

  try {
    const resultados = await buscarAtivos(termo, tipo);
    return NextResponse.json(
      { resultados, reserva: false },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (erro) {
    // Sem token ou API fora do ar: oferece só os ativos de teste.
    console.error(erro);
    return NextResponse.json({ resultados: reserva(), reserva: true });
  }
}
