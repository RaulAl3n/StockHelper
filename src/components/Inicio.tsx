"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CampoAtivo } from "./CampoAtivo";
import { TelaCarregamento } from "./TelaCarregamento";
import { SUGESTOES } from "@/lib/sugestoes";
import { escreverValor, formatarMoedaInteira, lerValor } from "@/lib/formato";
import { LIMITES } from "@/lib/simulacao";
import type { TipoAtivo } from "@/lib/tipos";

const TICKER_VALIDO = /^[A-Z0-9]{4,7}$/;
const DURACAO_ABERTURA_MS = 3000;

// Fica em memória durante a navegação: a abertura aparece ao entrar no site,
// mas não de novo quando o usuário clica em "Recomeçar".
let aberturaExibida = false;

export function Inicio() {
  const router = useRouter();
  const params = useSearchParams();

  const [abrindo, setAbrindo] = useState(() => !aberturaExibida);
  const [aporte, setAporte] = useState(() => {
    const v = lerValor(params.get("aporte") ?? "");
    return v > 0 ? escreverValor(v) : "";
  });
  const [tipo, setTipo] = useState<TipoAtivo>(params.get("tipo") === "fii" ? "fii" : "acao");
  const [ticker, setTicker] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  // O Next preserva esta página escondida ao navegar (React Activity). Ao sair,
  // limpamos o ativo e o erro para que "Recomeçar" traga o campo vazio;
  // o aporte e o tipo continuam, para facilitar testar outro ativo.
  useLayoutEffect(() => {
    return () => {
      setTicker("");
      setErro(null);
    };
  }, []);

  useEffect(() => {
    if (!abrindo) return;
    const id = setTimeout(() => {
      aberturaExibida = true;
      setAbrindo(false);
    }, DURACAO_ABERTURA_MS);
    return () => clearTimeout(id);
  }, [abrindo]);

  function simular(e: React.FormEvent) {
    e.preventDefault();
    const valor = lerValor(aporte);
    if (!(valor > 0)) {
      setErro("Digite quanto você investe por mês, por exemplo 500.");
      document.getElementById("campo-aporte")?.focus();
      return;
    }
    if (valor > LIMITES.aporteMax) {
      setErro(`O aporte mensal pode ser de até ${formatarMoedaInteira(LIMITES.aporteMax)}.`);
      document.getElementById("campo-aporte")?.focus();
      return;
    }
    if (!TICKER_VALIDO.test(ticker)) {
      setErro("Escolha uma ação ou fundo imobiliário na lista, ou digite o código (ex.: PETR4).");
      document.getElementById("campo-ativo")?.focus();
      return;
    }
    setErro(null);
    router.push(`/resultado?ativo=${ticker}&aporte=${valor}&tipo=${tipo}`);
  }

  const sugestoes = SUGESTOES.filter((s) => s.tipo === tipo);

  return (
    <>
      {abrindo && <TelaCarregamento />}

      <div className={abrindo ? "invisible" : undefined}>
        <header className="mx-auto w-full max-w-4xl px-4 pt-6 sm:px-8">
          <p className="text-lg font-bold tracking-tight">StockHelper</p>
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-16 sm:px-8 sm:pt-24">
          <form onSubmit={simular} noValidate>
            <fieldset className="mb-8">
              <legend className="mb-3 text-sm text-apagado">Onde você quer investir</legend>
              <div className="inline-flex rounded-full border border-linha bg-superficie p-1">
                {(
                  [
                    ["acao", "Ação"],
                    ["fii", "Fundo imobiliário"],
                  ] as const
                ).map(([valor, rotulo]) => (
                  <label
                    key={valor}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-cobalto ${
                      tipo === valor ? "bg-cobalto text-sobre-cobalto" : "text-apagado hover:text-tinta"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={valor}
                      checked={tipo === valor}
                      onChange={() => {
                        setTipo(valor);
                        setTicker("");
                      }}
                      className="sr-only"
                    />
                    {rotulo}
                  </label>
                ))}
              </div>
            </fieldset>

            <h1 className="max-w-[18ch] text-[2.6rem] font-bold leading-[1.15] tracking-[-0.03em] sm:text-6xl sm:leading-[1.12]">
              Se eu investir{" "}
              <span className="whitespace-nowrap">
                R${" "}
                <input
                  id="campo-aporte"
                  aria-label="Valor investido por mês, em reais"
                  className="lacuna"
                  style={{ width: `${Math.max(aporte.length, 3) + 0.6}ch` }}
                  inputMode="decimal"
                  placeholder="500"
                  autoComplete="off"
                  value={aporte}
                  onChange={(e) => setAporte(e.target.value.replace(/[^\d.,]/g, ""))}
                  onBlur={() => {
                    const v = lerValor(aporte);
                    if (v > 0) setAporte(escreverValor(v));
                  }}
                />
              </span>{" "}
              por mês em{" "}
              <CampoAtivo
                valor={ticker}
                tipo={tipo}
                onChange={setTicker}
                onSelecionar={(a) => setTicker(a.ticker)}
              />
              , quanto vira?
            </h1>

            {erro && (
              <p role="alert" className="mt-6 max-w-prose text-erro">
                {erro}
              </p>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <button
                type="submit"
                className="rounded-full bg-cobalto px-7 py-3.5 text-lg font-semibold text-sobre-cobalto transition-transform active:scale-[0.98]"
              >
                Ver quanto vira
              </button>
            </div>

            <div className="mt-14 max-w-prose">
              <p className="text-sm text-apagado">
                Sem ideia? Experimente {tipo === "fii" ? "um destes fundos" : "uma destas ações"}:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sugestoes.map((s) => (
                  <button
                    key={s.ticker}
                    type="button"
                    onClick={() => setTicker(s.ticker)}
                    aria-pressed={ticker === s.ticker}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      ticker === s.ticker
                        ? "border-cobalto bg-cobalto-fundo text-cobalto"
                        : "border-linha bg-superficie text-tinta hover:border-cobalto"
                    }`}
                  >
                    <span className="font-semibold">{s.ticker}</span>{" "}
                    <span className="text-apagado">{s.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
