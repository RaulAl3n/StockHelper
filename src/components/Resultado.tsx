"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraficoSaldo } from "./GraficoSaldo";
import { simular } from "@/lib/simulacao";
import type { AtivoInfo } from "@/lib/tipos";
import {
  escreverValor,
  formatarMoeda,
  formatarMoedaInteira,
  formatarPercentual,
  lerValor,
} from "@/lib/formato";

const PRAZOS = [1, 5, 10, 20, 30];

type Estado =
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | { fase: "pronto"; ativo: AtivoInfo };

/** Lê um percentual digitado ("8,5") como fração (0.085). Campo vazio vale 0. */
function lerPercentual(texto: string) {
  const v = lerValor(texto);
  return Number.isFinite(v) ? v / 100 : 0;
}

/**
 * Com cacheComponents, o Next esconde a página ao navegar em vez de desmontá-la
 * (React Activity) e preserva o estado. Sem a `key`, ao simular outro ativo o
 * componente reaproveitaria o DY, o prazo e o resultado da simulação anterior.
 * A chave muda só quando muda a simulação (ativo, aporte, tipo); ajustes de
 * premissas, que também vão para a URL, não recriam o componente.
 */
export function Resultado() {
  const params = useSearchParams();
  const chave = ["ativo", "aporte", "tipo"].map((k) => params.get(k) ?? "").join("|");
  return <ResultadoSimulacao key={chave} />;
}

function ResultadoSimulacao() {
  const router = useRouter();
  const params = useSearchParams();

  const ticker = (params.get("ativo") ?? "").toUpperCase();
  const tipo = params.get("tipo") === "fii" ? "fii" : "acao";
  const aporte = lerValor(params.get("aporte") ?? "");

  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const [anos, setAnos] = useState(() => {
    const a = Number(params.get("anos"));
    return a >= 1 && a <= 50 ? Math.round(a) : 10;
  });
  const [dyTexto, setDyTexto] = useState<string | null>(params.get("dy"));
  const [valTexto, setValTexto] = useState(params.get("val") ?? "0");
  const [reinvestir, setReinvestir] = useState(params.get("reinvestir") !== "0");

  // Busca os dados atuais do ativo na nossa rota de API (que chama a brapi).
  useEffect(() => {
    if (!ticker) return;
    const controle = new AbortController();
    (async () => {
      try {
        const r = await fetch(`/api/ativo?ticker=${encodeURIComponent(ticker)}`, {
          signal: controle.signal,
        });
        const dados = await r.json();
        if (!r.ok) {
          setEstado({ fase: "erro", mensagem: dados.erro ?? "Não foi possível carregar o ativo." });
          return;
        }
        const ativo = dados as AtivoInfo;
        setEstado({ fase: "pronto", ativo });
        setDyTexto((atual) =>
          atual ?? (ativo.dyAnual !== null ? escreverValor(+(ativo.dyAnual * 100).toFixed(2)) : ""),
        );
      } catch {
        if (!controle.signal.aborted) {
          setEstado({ fase: "erro", mensagem: "Sem conexão com o servidor. Tente de novo." });
        }
      }
    })();
    return () => controle.abort();
  }, [ticker]);

  // Mantém a URL em dia com as premissas, para a simulação poder ser compartilhada.
  useEffect(() => {
    if (estado.fase !== "pronto" || dyTexto === null) return;
    const q = new URLSearchParams({
      ativo: ticker,
      aporte: String(aporte),
      tipo,
      anos: String(anos),
      dy: dyTexto,
      val: valTexto,
    });
    if (!reinvestir) q.set("reinvestir", "0");
    router.replace(`/resultado?${q}`, { scroll: false });
  }, [estado.fase, ticker, aporte, tipo, anos, dyTexto, valTexto, reinvestir, router]);

  const dyAnual = lerPercentual(dyTexto ?? "");
  const valorizacaoAnual = lerPercentual(valTexto);

  const pontos = useMemo(() => {
    if (estado.fase !== "pronto") return [];
    return simular({
      aporteMensal: aporte,
      precoInicial: estado.ativo.preco,
      dyAnual,
      valorizacaoAnual,
      anos,
      reinvestir,
    });
  }, [estado, aporte, dyAnual, valorizacaoAnual, anos, reinvestir]);

  const linkRecomecar = `/?aporte=${aporte > 0 ? aporte : ""}&tipo=${tipo}`;

  if (!ticker || !(aporte > 0)) {
    return (
      <Moldura linkRecomecar="/">
        <p className="text-2xl font-semibold">Faltou o valor do aporte ou o ativo.</p>
        <BotaoRecomecar href="/" />
      </Moldura>
    );
  }

  if (estado.fase === "carregando") {
    return (
      <Moldura linkRecomecar={linkRecomecar}>
        <p role="status" className="animate-pulse text-2xl text-apagado">
          Buscando os dados de {ticker}…
        </p>
      </Moldura>
    );
  }

  if (estado.fase === "erro") {
    return (
      <Moldura linkRecomecar={linkRecomecar}>
        <p role="alert" className="max-w-prose text-2xl font-semibold">
          {estado.mensagem}
        </p>
        <BotaoRecomecar href={linkRecomecar} />
      </Moldura>
    );
  }

  const { ativo } = estado;
  const final = pontos[pontos.length - 1];
  const ganho = final.saldo - final.investido;
  const anosTexto = anos === 1 ? "1 ano" : `${anos} anos`;

  const linhasTabela = pontos.filter((p) => p.mes > 0 && p.mes % 12 === 0);
  const proventosNoAno = (mesFinal: number) =>
    pontos.slice(mesFinal - 11, mesFinal + 1).reduce((s, p) => s + p.rendaMes, 0);

  return (
    <Moldura linkRecomecar={linkRecomecar}>
      <section aria-labelledby="titulo-resultado">
        <p className="flex items-center gap-3 text-lg text-apagado sm:text-xl">
          {ativo.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ativo.logo} alt="" width={28} height={28} className="rounded-md" />
          )}
          <span>
            {formatarMoeda(aporte)} por mês em{" "}
            <strong className="font-semibold text-tinta">{ativo.ticker}</strong> durante{" "}
            {anosTexto} viram
          </span>
        </p>
        <h1
          id="titulo-resultado"
          className="mt-2 text-5xl font-bold tracking-[-0.04em] text-cobalto sm:text-7xl"
        >
          {formatarMoedaInteira(final.saldo)}
        </h1>

        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
          <Numero rotulo="Você investiu" valor={formatarMoedaInteira(final.investido)} />
          <Numero
            rotulo={ganho >= 0 ? "Ganho" : "Perda"}
            valor={formatarMoedaInteira(Math.abs(ganho))}
          />
          <Numero rotulo="Proventos recebidos" valor={formatarMoedaInteira(final.dividendosAcumulados)} />
          <Numero rotulo="Renda mensal no fim" valor={formatarMoeda(final.rendaMes)} />
        </dl>
      </section>

      <section className="mt-12" aria-label="Gráfico de saldo ao longo do tempo">
        <GraficoSaldo pontos={pontos} anos={anos} />
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-apagado hover:text-tinta">
            Ver os números ano a ano
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left">
              <thead className="text-apagado">
                <tr className="border-b border-linha">
                  <th className="py-2 pr-4 font-medium">Ano</th>
                  <th className="py-2 pr-4 text-right font-medium">Investido</th>
                  <th className="py-2 pr-4 text-right font-medium">Saldo</th>
                  <th className="py-2 text-right font-medium">Proventos no ano</th>
                </tr>
              </thead>
              <tbody>
                {linhasTabela.map((p) => (
                  <tr key={p.mes} className="border-b border-linha/60">
                    <td className="py-2 pr-4">{p.mes / 12}</td>
                    <td className="py-2 pr-4 text-right">{formatarMoedaInteira(p.investido)}</td>
                    <td className="py-2 pr-4 text-right font-medium">{formatarMoedaInteira(p.saldo)}</td>
                    <td className="py-2 text-right">{formatarMoeda(proventosNoAno(p.mes))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section
        aria-labelledby="titulo-premissas"
        className="mt-12 rounded-2xl border border-linha bg-superficie p-5 sm:p-7"
      >
        <h2 id="titulo-premissas" className="text-xl font-semibold">
          Premissas da projeção
        </h2>
        <p className="mt-1 max-w-prose text-sm text-apagado">
          Partimos dos dados atuais de {ativo.nome}: cota a {formatarMoeda(ativo.preco)}. Ajuste os
          valores abaixo e o gráfico muda na hora.
        </p>

        <div className="mt-6 grid gap-7 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">Prazo</legend>
            <div className="flex flex-wrap gap-2">
              {PRAZOS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={anos === p}
                  onClick={() => setAnos(p)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    anos === p
                      ? "border-cobalto bg-cobalto text-sobre-cobalto"
                      : "border-linha text-tinta hover:border-cobalto"
                  }`}
                >
                  {p === 1 ? "1 ano" : `${p} anos`}
                </button>
              ))}
            </div>
          </fieldset>

          <CampoPercentual
            id="campo-dy"
            rotulo="Dividend yield anual"
            valor={dyTexto ?? ""}
            onChange={setDyTexto}
            ajuda={
              ativo.dyFonte
                ? `${ativo.dyFonte}: ${formatarPercentual(ativo.dyAnual ?? 0)}.`
                : "Não encontramos proventos deste ativo nos últimos 12 meses. Se ele paga, digite uma estimativa."
            }
            destaque={!ativo.dyFonte && !dyTexto}
          />

          <CampoPercentual
            id="campo-val"
            rotulo="Valorização anual da cota"
            valor={valTexto}
            onChange={setValTexto}
            ajuda={
              ativo.valorizacao12m !== null
                ? `Nos últimos 12 meses a cota variou ${formatarPercentual(ativo.valorizacao12m)}. Começamos em 0% para não projetar o passado recente para sempre.`
                : "Começamos em 0%: o preço fica constante e o crescimento vem só dos aportes e proventos."
            }
            acao={
              ativo.valorizacao12m !== null
                ? {
                    rotulo: "Usar variação dos últimos 12 meses",
                    aoClicar: () =>
                      setValTexto(escreverValor(+(ativo.valorizacao12m! * 100).toFixed(2))),
                  }
                : undefined
            }
          />

          <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={reinvestir}
              onChange={(e) => setReinvestir(e.target.checked)}
              className="mt-1 h-5 w-5 accent-[var(--cobalto)]"
            />
            <span>
              <span className="font-medium">Reinvestir os proventos</span>
              <span className="block text-sm text-apagado">
                Desmarcado, os proventos ficam guardados em dinheiro e não compram novas cotas.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="mt-12">
        <BotaoRecomecar href={linkRecomecar} />
      </div>

      <p className="mt-12 max-w-prose text-xs leading-relaxed text-apagado">
        Simulação educativa, não é recomendação de investimento. Preço, proventos e valorização
        futuros não são garantidos. Não considera impostos, taxas nem inflação, e supõe compra de
        cotas fracionárias. Dados de mercado: {ativo.fonte}, consultados em{" "}
        {new Date(ativo.atualizadoEm).toLocaleString("pt-BR")}.
      </p>
    </Moldura>
  );
}

function Moldura({ children, linkRecomecar }: { children: React.ReactNode; linkRecomecar: string }) {
  return (
    <>
      <header className="mx-auto w-full max-w-4xl px-4 pt-6 sm:px-8">
        <Link href={linkRecomecar} className="text-lg font-bold tracking-tight">
          StockHelper
        </Link>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-12 sm:px-8 sm:pt-16">{children}</main>
    </>
  );
}

function BotaoRecomecar({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-8 inline-block rounded-full bg-cobalto px-7 py-3.5 text-lg font-semibold text-sobre-cobalto"
    >
      Recomeçar com outro ativo
    </Link>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm text-apagado">{rotulo}</dt>
      <dd className="mt-0.5 text-xl font-semibold sm:text-2xl">{valor}</dd>
    </div>
  );
}

function CampoPercentual(props: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  ajuda: string;
  destaque?: boolean;
  acao?: { rotulo: string; aoClicar: () => void };
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-2 block text-sm font-medium">
        {props.rotulo}
      </label>
      <div
        className={`flex w-44 items-center rounded-lg border bg-papel px-3 focus-within:border-cobalto ${
          props.destaque ? "border-ocre" : "border-linha"
        }`}
      >
        <input
          id={props.id}
          inputMode="decimal"
          autoComplete="off"
          value={props.valor}
          placeholder="0"
          onChange={(e) => props.onChange(e.target.value.replace(/[^\d,.-]/g, ""))}
          aria-describedby={`${props.id}-ajuda`}
          className="w-full bg-transparent py-2 text-lg outline-none"
        />
        <span className="shrink-0 whitespace-nowrap text-apagado">% a.a.</span>
      </div>
      <p id={`${props.id}-ajuda`} className="mt-2 max-w-[38ch] text-sm text-apagado">
        {props.ajuda}
      </p>
      {props.acao && (
        <button
          type="button"
          onClick={props.acao.aoClicar}
          className="mt-1 text-sm font-medium text-cobalto underline underline-offset-4"
        >
          {props.acao.rotulo}
        </button>
      )}
    </div>
  );
}
