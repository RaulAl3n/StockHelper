/** Tela de abertura: o nome do site e uma linha de saldo que sobe em 3 segundos. */
export function TelaCarregamento() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-papel px-6"
    >
      <svg
        viewBox="0 0 240 120"
        className="w-56 sm:w-72"
        aria-hidden="true"
        fill="none"
      >
        <line x1="0" y1="118" x2="240" y2="118" stroke="var(--linha)" strokeWidth="2" />
        <path
          className="linha-carregando"
          pathLength={1}
          d="M2 112 C 40 108, 60 104, 90 96 S 140 78, 165 60 S 210 22, 238 6"
          stroke="var(--cobalto)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">StockHelper</p>
      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-linha">
        <div className="barra-carregando h-full w-full bg-cobalto" />
      </div>
      <span className="sr-only">Carregando o simulador</span>
    </div>
  );
}
