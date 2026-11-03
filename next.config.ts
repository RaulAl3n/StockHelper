import type { NextConfig } from "next";

/** Cabeçalhos de segurança aplicados a todas as páginas e rotas de API. */
const cabecalhosSeguranca = [
  // Impede que outro site carregue o StockHelper dentro de um iframe (clickjacking).
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  // O navegador não tenta "adivinhar" o tipo de arquivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Links externos não recebem a URL completa (que contém o valor do aporte).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O site não usa câmera, microfone nem localização.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Não anuncia a versão do framework no cabeçalho X-Powered-By.
  poweredByHeader: false,
  headers() {
    return [{ source: "/:path*", headers: cabecalhosSeguranca }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
