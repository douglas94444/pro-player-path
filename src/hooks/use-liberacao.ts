import { useEffect, useState } from "react";
import { formatarEspera, proximaLiberacaoMs } from "@/lib/liberacao";

/** Texto "Xh Ymin" até a virada do dia em Brasília, atualizado a cada minuto. */
export function useEsperaLiberacao() {
  const [ms, setMs] = useState(() => proximaLiberacaoMs());

  useEffect(() => {
    const id = setInterval(() => setMs(proximaLiberacaoMs()), 60000);
    return () => clearInterval(id);
  }, []);

  return formatarEspera(ms);
}
