"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ResultadoBusca, TipoAtivo } from "@/lib/tipos";
import { formatarMoeda } from "@/lib/formato";

type Props = {
  valor: string;
  tipo: TipoAtivo;
  onChange: (ticker: string) => void;
  onSelecionar: (ativo: ResultadoBusca) => void;
};

/** Campo de ticker com busca na brapi (via /api/busca) e lista navegável pelo teclado. */
export function CampoAtivo({ valor, tipo, onChange, onSelecionar }: Props) {
  const idLista = useId();
  const [aberto, setAberto] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [ativoIndice, setAtivoIndice] = useState(-1);
  const [buscando, setBuscando] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [posicao, setPosicao] = useState<{ top: number; left: number; width: number } | null>(null);

  // A lista fica presa à tela (position: fixed) e é empurrada para dentro das bordas,
  // porque no celular o campo pode cair perto do canto direito.
  function medir() {
    const r = campo.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(352, window.innerWidth - 32);
    const left = Math.min(Math.max(16, r.left), window.innerWidth - width - 16);
    setPosicao({ top: r.bottom + 8, left, width });
  }

  useEffect(() => {
    if (!aberto) return;
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [aberto]);

  // Busca com atraso de 300 ms para não disparar uma requisição por tecla.
  useEffect(() => {
    if (!aberto) return;
    const controle = new AbortController();
    const id = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(
          `/api/busca?q=${encodeURIComponent(valor)}&tipo=${tipo}`,
          { signal: controle.signal },
        );
        const dados = (await r.json()) as { resultados: ResultadoBusca[] };
        setResultados(dados.resultados);
        setAtivoIndice(-1);
      } catch {
        if (!controle.signal.aborted) setResultados([]);
      } finally {
        if (!controle.signal.aborted) setBuscando(false);
      }
    }, 300);
    return () => {
      clearTimeout(id);
      controle.abort();
    };
  }, [valor, tipo, aberto]);

  // Fecha a lista quando a página é escondida pela navegação (React Activity).
  useLayoutEffect(() => {
    return () => {
      setAberto(false);
      setResultados([]);
    };
  }, []);

  // Fecha a lista ao clicar fora.
  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  function escolher(ativo: ResultadoBusca) {
    onSelecionar(ativo);
    setAberto(false);
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      medir();
      setAberto(true);
      setAtivoIndice((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivoIndice((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && aberto && ativoIndice >= 0) {
      e.preventDefault();
      escolher(resultados[ativoIndice]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  const mostrarLista = aberto && posicao !== null && (resultados.length > 0 || buscando);

  return (
    <div ref={caixa} className="relative inline-block">
      <input
        ref={campo}
        id="campo-ativo"
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={ativoIndice >= 0 ? `${idLista}-${ativoIndice}` : undefined}
        aria-label={tipo === "fii" ? "Código do fundo imobiliário" : "Código da ação"}
        className="lacuna uppercase"
        style={{ width: `${Math.max(valor.length, tipo === "fii" ? 6 : 5) + 0.8}ch` }}
        placeholder={tipo === "fii" ? "MXRF11" : "PETR4"}
        autoComplete="off"
        spellCheck={false}
        maxLength={7}
        value={valor}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
          medir();
          setAberto(true);
        }}
        onFocus={() => {
          medir();
          setAberto(true);
        }}
        onKeyDown={aoTeclar}
      />
      {mostrarLista && (
        <ul
          id={idLista}
          role="listbox"
          style={posicao!}
          className="fixed z-20 max-h-80 overflow-auto rounded-xl border border-linha bg-superficie py-1 text-base font-normal tracking-normal shadow-lg"
        >
          {buscando && resultados.length === 0 && (
            <li className="px-4 py-3 text-apagado">Buscando…</li>
          )}
          {resultados.map((r, i) => (
            <li
              key={r.ticker}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={i === ativoIndice}
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(r);
              }}
              onMouseEnter={() => setAtivoIndice(i)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${
                i === ativoIndice ? "bg-cobalto-fundo" : ""
              }`}
            >
              <span className="w-16 shrink-0 font-semibold text-tinta">{r.ticker}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-apagado">{r.nome}</span>
              {r.preco !== null && (
                <span className="shrink-0 text-sm text-apagado">{formatarMoeda(r.preco)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
