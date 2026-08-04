import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { abrirJanela, fecharJanela, LIMITE_JANELAS, type Janela } from "./janelas";

/** Abre/foca uma janela MDI respeitando o limite de 5 telas simultâneas. */
export function useAbrirJanela() {
  const router = useRouter();
  return (janela: Janela): boolean => {
    const resultado = abrirJanela(janela);
    if (resultado === "limite") {
      toast.error(`Limite de ${LIMITE_JANELAS} telas simultâneas atingido`, {
        description: "Feche uma das telas abertas para continuar.",
      });
      return false;
    }
    router.history.push(janela.id);
    return true;
  };
}

export function useFecharJanela() {
  const router = useRouter();
  return (id: string) => {
    const destino = fecharJanela(id, router.state.location.pathname);
    if (destino) router.history.push(destino);
  };
}
