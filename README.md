# StockHelper

**How much will your monthly investment grow?** StockHelper simulates how a fixed monthly investment in a Brazilian stock or real estate fund (FII) listed on B3 could grow over the years, based on the asset's current data: share price and dividends paid over the last 12 months.

🔗 **Live demo:** [Vercel link]

<!-- Tip: record a short GIF of a simulation and add it here, e.g.:
![StockHelper demo](docs/demo.gif) -->

## Features

- **Month-by-month simulation** of contributions, dividends and share price growth, with fractional shares
- **Stocks and real estate funds (FIIs)** from B3, searchable by ticker or name
- **Balance × time chart** comparing portfolio value with total invested, with a monthly tooltip
- **Year-by-year table** with amount invested, balance and dividends received
- **Adjustable assumptions:** time horizon (1 to 30 years), dividend yield, annual price growth and dividend reinvestment, with the chart updating instantly
- **Shareable links:** all assumptions are stored in the URL, so any simulation can be sent to someone else
- **Light and dark themes** following the system setting, and a responsive layout for mobile

## How the simulation works

For each month in the period:

```
shares    += contribution / price
dividends  = shares × price × (annual DY / 12)
shares    += dividends / price       (if reinvesting; otherwise kept as cash)
price     *= (1 + annual growth)^(1/12)
balance    = shares × price + cash
```

- **Dividend yield** is the sum of dividends paid over the last 12 months divided by the current price.
- **Price growth** starts at 0%, so a recent rally or drop isn't projected for decades. A button lets you use the actual price change over the last 12 months instead.
- Inputs are capped to sensible ranges: contributions up to R$ 1 million, dividend yield between 0% and 100%, and price growth between -90% and 100% per year.

The logic lives in `src/lib/simulacao.ts` as a pure function with no React dependency, so it's easy to test.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Server state | TanStack Query (React Query) 5 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Market data | Yahoo Finance via `yahoo-finance2` (primary) and brapi.dev (fallback) |
| Hosting | Vercel |

There's no database: the simulation runs in the browser, and market data is cached for 1 hour on both the server and the client.

## Architecture

The front end follows a **service → hook → page** layered architecture:

```
page (components/pages)      renders the screen and holds UI state only
  │  uses
hook (hooks/)                React Query: loading, errors, caching, retries, prefetching
  │  calls
service (services/)          plain async functions that make the HTTP requests
  │  HTTP
API route (app/api/)         backend for the front end; validates input
  │
server (server/)             Yahoo Finance first, brapi as fallback, in-memory cache
```

- **Pages never call `fetch`.** They only use hooks, so loading and error states come from React Query instead of hand-written `useEffect` code.
- **Hooks** wrap services with `useQuery`. Query keys live in one place (`hooks/queryKeys.ts`). `useBuscaAtivos` debounces typing and keeps previous results on screen while new ones load. `usePrefetchAtivo` starts loading an asset before navigating to its results page.
- **Services** know nothing about React. They turn API errors into a typed `ErroApi` with a message ready to show.
- **Retries:** server errors (5xx) are retried once automatically; client errors (4xx, such as an unknown ticker) are not. The results page also has a "Try again" button.
- **Read-only domain:** the app only reads market data, so services expose queries only. Writes, such as saved favorites, would be added as new service functions consumed through `useMutation` hooks.

The front end never calls the market data APIs directly. That keeps tokens out of the browser, avoids CORS issues and enables server-side caching.

```
src/
├── app/
│   ├── api/ativo/          # GET: price, dividend yield and growth for one asset
│   ├── api/busca/          # GET: stock and FII search
│   ├── resultado/page.tsx  # route: mounts ResultadoPage
│   ├── page.tsx            # route: mounts InicioPage
│   └── providers.tsx       # QueryClient setup
├── components/
│   ├── pages/              # InicioPage, ResultadoPage
│   └── ...                 # search field, chart, table, form inputs
├── hooks/                  # useAtivo, useBuscaAtivos, useSimulacao, useDebounce, queryKeys
├── services/               # http.ts (fetch + ErroApi), ativoService.ts
├── server/                 # mercado.ts, calculos.ts, providers/yahoo.ts, providers/brapi.ts
├── lib/                    # simulation, number formatting, validation, suggestions
└── types/                  # shared types
```

> The interface is in Brazilian Portuguese, so some file and folder names are too.

## Security

- The brapi token is only used on the server (`server-only`) and never reaches the browser.
- Tickers are validated (shared rule in `lib/validacao.ts`) before any external call.
- Error messages are generic and don't expose internal details.
- The in-memory cache has a size limit.
- The site sends security headers: iframe blocking, `nosniff`, `Referrer-Policy` and `Permissions-Policy`.
- No personal data is collected: no login, database, cookies or tracking.

## Running locally

Requires Node.js 22 or later.

```bash
git clone https://github.com/YOUR-USERNAME/stockhelper.git
cd stockhelper
npm install
npm run dev
```

Open http://localhost:3000. In development, the React Query Devtools button appears in the bottom-left corner; it's left out of production builds.

No token is required: Yahoo Finance covers every asset. Optionally, create a `.env.local` from `.env.example` with a free `BRAPI_TOKEN` from [brapi.dev](https://brapi.dev). It extends the fallback source, which without a token only covers PETR4, VALE3, ITUB4, MGLU3, MXRF11 and HGLG11.

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. (Optional) Under *Settings > Environment Variables*, add `BRAPI_TOKEN`.

## Limitations

- `yahoo-finance2` is an unofficial library and may break if Yahoo changes something. That's why there's a fallback source.
- The simulation doesn't account for taxes, fees, inflation or minimum lot sizes.
- Past dividends and price growth don't guarantee future results.

## Disclaimer

Educational project. **This is not investment advice.**

---

Built by [Your Name](https://www.linkedin.com/in/your-profile)
