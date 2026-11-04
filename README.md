# StockHelper

**How much will your monthly investment grow?** StockHelper simulates how a fixed monthly investment in a Brazilian stock or real estate fund (FII) listed on B3 could grow over the years, based on the asset's current data: share price and dividends paid over the last 12 months.

🔗 **Live demo:** [\[Vercel link\]](https://stock-helper-omega.vercel.app/)

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
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Market data | Yahoo Finance via `yahoo-finance2` (primary) and brapi.dev (fallback) |
| Hosting | Vercel |

There's no database: the simulation runs in the browser, and API responses are cached for 1 hour.

## Architecture

```
Browser ──> /api/busca ──┐                ┌──> Yahoo Finance  (primary, no token)
        └─> /api/ativo ──┴──> lib/fontes ─┤
                                          └──> brapi.dev      (fallback)
```

The front end never calls the market data APIs directly. The routes in `src/app/api/` go through `src/lib/fontes.ts`, which tries Yahoo Finance first and falls back to brapi if Yahoo fails or doesn't know the asset. This keeps tokens out of the browser, avoids CORS issues and enables caching.

```
src/
├── app/
│   ├── api/ativo/     # price, dividend yield and growth for one asset
│   ├── api/busca/     # stock and FII search
│   ├── resultado/     # results page with the chart
│   └── page.tsx       # home screen
├── components/        # screens, search field and chart
└── lib/
    ├── simulacao.ts   # month-by-month calculation
    ├── calculos.ts    # 12-month dividend yield and price growth
    ├── fontes.ts      # Yahoo first, brapi as fallback, caching
    ├── yahoo.ts       # Yahoo Finance integration
    ├── brapi.ts       # brapi integration
    └── formato.ts     # parsing and formatting of Brazilian-format numbers
```

> The interface is in Brazilian Portuguese, so some file and folder names are too.

## Security

- The brapi token is only used on the server (`server-only`) and never reaches the browser.
- Tickers are validated before any external call.
- Error messages are generic and don't expose internal details.
- The in-memory cache has a size limit.
- The site sends security headers: iframe blocking, `nosniff`, `Referrer-Policy` and `Permissions-Policy`.
- No personal data is collected: no login, database, cookies or tracking.

## Running locally

Requires Node.js 22 or later.

```bash
git clone https://github.com/RaulAl3n/StockHelper
cd stockhelper
npm install
npm run dev
```

Open http://localhost:3000.

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

Built by [Raul Scalassara Alencar](https://www.linkedin.com/in/raul-alencar-a6a40435a/)