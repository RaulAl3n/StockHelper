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
- [brapi.dev](https://brapi.dev) como fonte de dados
- Sem banco de dados: o cálculo é feito no navegador e as respostas da API ficam em cache por 1 hora

## Arquitetura

```
Navegador ──> /api/busca  ──┐
          └─> /api/ativo  ──┴──> brapi.dev   (token só no servidor)
```

O front-end nunca chama a brapi diretamente. As rotas em `src/app/api/` fazem esse papel, o que mantém o token fora do navegador, evita problemas de CORS e permite cache.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # opcional: cole seu BRAPI_TOKEN
npm run dev
```

Abra http://localhost:3000.

**Sem token** só funcionam PETR4, VALE3, ITUB4, MGLU3, MXRF11 e HGLG11 (ativos de teste liberados pela brapi). **Com o token gratuito**, todos os ativos funcionam, mas o plano grátis não traz dividendos nem histórico de 12 meses; nesses casos o site pede que o usuário informe o dividend yield.

## Deploy no Vercel

1. Suba o projeto para o GitHub.
2. Importe o repositório em vercel.com/new.
3. Em *Settings > Environment Variables*, adicione `BRAPI_TOKEN`.

## Limitações

Simulação educativa, não é recomendação de investimento. Não considera impostos, taxas, inflação nem lotes mínimos (supõe cotas fracionárias). Proventos e valorização futuros não são garantidos.
