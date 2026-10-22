import { Suspense } from "react";
import { Inicio } from "@/components/Inicio";
import { TelaCarregamento } from "@/components/TelaCarregamento";

export default function PaginaInicial() {
  return (
    <Suspense fallback={<TelaCarregamento />}>
      <Inicio />
    </Suspense>
  );
}
