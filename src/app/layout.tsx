import type { Metadata } from "next";
// Fonte servida pelo próprio site (sem depender do Google Fonts no build).
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quanto vira? | Simulador de aportes mensais",
  description:
    "Descubra quanto seu aporte mensal em uma ação ou fundo imobiliário pode virar, com dividendos reinvestidos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
