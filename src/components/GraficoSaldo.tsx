"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PontoSimulacao } from "@/lib/simulacao";
import { formatarMoeda, formatarMoedaCompacta } from "@/lib/formato";

type Props = { pontos: PontoSimulacao[]; anos: number };

function rotuloMes(mes: number) {
  const ano = Math.floor(mes / 12);
  const resto = mes % 12;
  if (mes === 0) return "Início";
  if (resto === 0) return `Ano ${ano}`;
  return ano === 0 ? `Mês ${resto}` : `Ano ${ano}, mês ${resto}`;
}

type DicaProps = {
  active?: boolean;
  payload?: { payload: PontoSimulacao }[];
};

function Dica({ active, payload }: DicaProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-linha bg-superficie px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold">{rotuloMes(p.mes)}</p>
      <p className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-cobalto" aria-hidden />
        Saldo <span className="ml-auto pl-4 font-semibold">{formatarMoeda(p.saldo)}</span>
      </p>
      <p className="flex items-center gap-2">
        <span className="inline-block h-0.5 w-2.5 bg-ocre" aria-hidden />
        Investido <span className="ml-auto pl-4">{formatarMoeda(p.investido)}</span>
      </p>
      <p className="mt-1 text-apagado">
        Proventos no mês: {formatarMoeda(p.rendaMes)}
      </p>
    </div>
  );
}

export function GraficoSaldo({ pontos, anos }: Props) {
  const passoAnos = anos <= 10 ? 1 : anos <= 20 ? 2 : 5;
  const ticks = Array.from({ length: Math.floor(anos / passoAnos) + 1 }, (_, i) => i * passoAnos * 12);

  return (
    <figure>
      <figcaption className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-apagado">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-cobalto" aria-hidden />
          Saldo
        </span>
        <span className="flex items-center gap-2">
          <svg width="18" height="4" aria-hidden>
            <line x1="0" y1="2" x2="18" y2="2" stroke="var(--ocre)" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          Total investido
        </span>
      </figcaption>
      <div className="h-[300px] sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="preenchimento-saldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cobalto)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--cobalto)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--linha)" />
            <XAxis
              dataKey="mes"
              type="number"
              domain={[0, anos * 12]}
              ticks={ticks}
              tickFormatter={(m: number) => (m === 0 ? "0" : `${m / 12}a`)}
              stroke="var(--apagado)"
              tick={{ fill: "var(--apagado)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--linha)" }}
            />
            <YAxis
              tickFormatter={(v: number) => formatarMoedaCompacta(v)}
              tick={{ fill: "var(--apagado)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={76}
            />
            <Tooltip
              content={<Dica />}
              cursor={{ stroke: "var(--apagado)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="saldo"
              name="Saldo"
              stroke="var(--cobalto)"
              strokeWidth={2.5}
              fill="url(#preenchimento-saldo)"
              isAnimationActive={false}
              activeDot={{ r: 5, stroke: "var(--superficie)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="investido"
              name="Total investido"
              stroke="var(--ocre)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, stroke: "var(--superficie)", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
