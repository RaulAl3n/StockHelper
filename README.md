# StockHelper

Simulador de aportes mensais em ações e fundos imobiliários da B3. Você diz quanto investe por mês e em qual ativo, e o site projeta o saldo ao longo do tempo a partir dos dados atuais do ativo (preço da cota e proventos dos últimos 12 meses).

## Como funciona

1. **Abertura** de 3 segundos ao entrar no site.
2. **Início:** a frase "Se eu investir R$ ___ por mês em ___, quanto vira?", com busca de ações ou FIIs.
3. **Resultado:** saldo final, gráfico de saldo × tempo contra o total investido, tabela ano a ano e premissas ajustáveis (prazo, dividend yield, valorização da cota, reinvestir ou não os proventos).
4. **Recomeçar:** volta ao início mantendo o valor do aporte, para testar outro ativo.

Todas as premissas ficam na URL, então qualquer simulação pode ser compartilhada por link.

### A conta, mês a mês

```
cotas    += aporte / preço
proventos = cotas × preço × (DY anual / 12)
cotas    += proventos / preço        (se reinvestir; senão vai para o caixa)
preço    *= (1 + valorização anual)^(1/12)
saldo     = cotas × preço + caixa
```

A lógica está isolada em `src/lib/simulacao.ts`, sem dependência de React, fácil de testar.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Recharts para o gráfico
- [yahoo-finance2](https://github.com/gadicc/yahoo-finance2) (Yahoo Finance) como fonte principal de dados
- [brapi.dev](https://brapi.dev) como fonte reserva
- Sem banco de dados: o cálculo é feito no navegador e as respostas das APIs ficam em cache por 1 hora

## Arquitetura

```
Navegador ──> /api/busca ──┐                ┌──> Yahoo Finance  (principal, sem token)
          └─> /api/ativo ──┴──> lib/fontes ─┤
                                            └──> brapi.dev      (reserva)
```

O front-end nunca chama as APIs de mercado diretamente. As rotas em `src/app/api/` passam por `src/lib/fontes.ts`, que tenta o Yahoo Finance e, se ele falhar ou não conhecer o ativo, recorre à brapi. Isso mantém tokens fora do navegador, evita problemas de CORS e permite cache.

- **Yahoo Finance** (`src/lib/yahoo.ts`): ativos da B3 com sufixo `.SA`. Traz cotação, histórico e eventos de dividendos de ações e FIIs, sem token. É uma API não oficial e pode mudar sem aviso, por isso existe a reserva.
- **brapi** (`src/lib/brapi.ts`): sem token só cobre PETR4, VALE3, ITUB4, MGLU3, MXRF11 e HGLG11; com o token gratuito cobre todos os ativos, mas sem dividendos.
- **Cálculos** (`src/lib/calculos.ts`): dividend yield de 12 meses e valorização, compartilhados pelas duas fontes.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # opcional: token da brapi, usada só como reserva
npm run dev
```

Abra http://localhost:3000.

Não é preciso nenhum token: o Yahoo Finance atende todos os ativos. O `BRAPI_TOKEN` só amplia a cobertura da fonte reserva.

## Deploy no Vercel

1. Suba o projeto para o GitHub.
2. Importe o repositório em vercel.com/new.
3. (Opcional) Em *Settings > Environment Variables*, adicione `BRAPI_TOKEN`.

## Limitações

Simulação educativa, não é recomendação de investimento. Não considera impostos, taxas, inflação nem lotes mínimos (supõe cotas fracionárias). Proventos e valorização futuros não são garantidos.
