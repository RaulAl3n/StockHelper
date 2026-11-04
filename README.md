# StockHelper

**Quanto vira o seu aporte mensal?** O StockHelper simula quanto um investimento mensal em uma ação ou fundo imobiliário da B3 pode render ao longo dos anos, com base nos dados atuais do ativo: preço da cota e proventos pagos nos últimos 12 meses.

🔗 **Acesse:** [link do site no Vercel]

<!-- Dica: grave um GIF curto da simulação e coloque aqui, por exemplo:
![Demonstração do StockHelper](docs/demo.gif) -->

## Funcionalidades

- **Simulação mês a mês** de aportes, proventos e valorização da cota, com cotas fracionárias
- **Ações e fundos imobiliários (FIIs)** da B3, com busca por código ou nome
- **Gráfico de saldo × tempo** comparando o patrimônio com o total investido, com tooltip mês a mês
- **Tabela ano a ano** com investido, saldo e proventos recebidos
- **Premissas ajustáveis:** prazo (1 a 30 anos), dividend yield, valorização anual e reinvestimento dos proventos, com o gráfico atualizado na hora
- **Links compartilháveis:** todas as premissas ficam na URL, então qualquer simulação pode ser enviada para outra pessoa
- **Tema claro e escuro**, conforme o sistema, e layout responsivo para celular

## Como a simulação funciona

Para cada mês do período:

```
cotas    += aporte / preço
proventos = cotas × preço × (DY anual / 12)
cotas    += proventos / preço        (se reinvestir; senão vai para o caixa)
preço    *= (1 + valorização anual)^(1/12)
saldo     = cotas × preço + caixa
```

- O **dividend yield** vem da soma dos proventos dos últimos 12 meses dividida pelo preço atual.
- A **valorização** começa em 0%, para não projetar uma alta ou queda recente por décadas. Um botão permite usar a variação real dos últimos 12 meses.
- Os valores são limitados a faixas que fazem sentido: aporte de até R$ 1 milhão, DY entre 0% e 100% e valorização entre -90% e 100% ao ano.

A lógica fica em `src/lib/simulacao.ts`, uma função pura, sem dependência de React, fácil de testar.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS 4 |
| Gráficos | Recharts |
| Dados de mercado | Yahoo Finance via `yahoo-finance2` (principal) e brapi.dev (reserva) |
| Hospedagem | Vercel |

Não há banco de dados: a simulação é calculada no navegador, e as respostas das APIs ficam em cache por 1 hora.

## Arquitetura

```
Navegador ──> /api/busca ──┐                ┌──> Yahoo Finance  (principal, sem token)
          └─> /api/ativo ──┴──> lib/fontes ─┤
                                            └──> brapi.dev      (reserva)
```

O front-end nunca chama as APIs de mercado diretamente. As rotas em `src/app/api/` passam por `src/lib/fontes.ts`, que tenta o Yahoo Finance primeiro e, se ele falhar ou não conhecer o ativo, recorre à brapi. Isso mantém tokens fora do navegador, evita problemas de CORS e permite cache.

```
src/
├── app/
│   ├── api/ativo/     # cotação, DY e valorização de um ativo
│   ├── api/busca/     # busca de ações e FIIs
│   ├── resultado/     # página do gráfico
│   └── page.tsx       # tela inicial
├── components/        # telas, campo de busca e gráfico
└── lib/
    ├── simulacao.ts   # cálculo mês a mês
    ├── calculos.ts    # DY de 12 meses e valorização
    ├── fontes.ts      # Yahoo primeiro, brapi como reserva, cache
    ├── yahoo.ts       # integração com o Yahoo Finance
    ├── brapi.ts       # integração com a brapi
    └── formato.ts     # leitura e formatação de valores em pt-BR
```

## Segurança

- O token da brapi é usado só no servidor (`server-only`) e nunca chega ao navegador.
- O código do ativo é validado antes de qualquer chamada externa.
- As mensagens de erro são genéricas e não expõem detalhes internos.
- O cache em memória tem tamanho limitado.
- O site envia cabeçalhos de segurança: bloqueio de iframe, `nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- Nenhum dado pessoal é coletado: não há login, banco de dados, cookies ou rastreamento.

## Rodando localmente

Requer Node.js 22 ou superior.

```bash
git clone https://github.com/SEU-USUARIO/stockhelper.git
cd stockhelper
npm install
npm run dev
```

Abra http://localhost:3000.

Nenhum token é necessário: o Yahoo Finance atende todos os ativos. Opcionalmente, crie um `.env.local` a partir do `.env.example` com um `BRAPI_TOKEN` gratuito de [brapi.dev](https://brapi.dev). Ele amplia a cobertura da fonte reserva, que sem token só atende PETR4, VALE3, ITUB4, MGLU3, MXRF11 e HGLG11.

## Deploy no Vercel

1. Suba o repositório para o GitHub.
2. Importe o projeto em [vercel.com/new](https://vercel.com/new).
3. (Opcional) Em *Settings > Environment Variables*, adicione `BRAPI_TOKEN`.

## Limitações

- A biblioteca `yahoo-finance2` não é oficial e pode parar de funcionar se o Yahoo mudar algo. Por isso existe a fonte reserva.
- A simulação não considera impostos, taxas, inflação nem lotes mínimos de compra.
- Proventos e valorização passados não garantem resultados futuros.

## Aviso

Projeto educativo. **Não é recomendação de investimento.**

---

Desenvolvido por [Seu Nome](https://www.linkedin.com/in/seu-perfil)
