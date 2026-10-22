import { Suspense } from "react";
import type { Metadata } from "next";
import { Resultado } from "@/components/Resultado";

export const metadata: Metadata = {
  title: "Resultado | Quanto vira?",
};

export default function PaginaResultado() {
  return (
    <Suspense fallback={null}>
      <Resultado />
    </Suspense>
  );
}
