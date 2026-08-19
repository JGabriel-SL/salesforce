import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { abrirJanela, fecharJanela, janelasStore, LIMITE_AVISO, type Janela } from "./janelas";

/** Abre/foca uma janela MDI. Sem limite rígido — apenas alerta quando
 *  há muitas telas abertas simultaneamente. */
export function useAbrirJanela() {
  const router = useRouter();
  return (janela: Janela): boolean => {
    const resultado = abrirJanela(janela);
    if (resultado === "aviso") {
      const total = janelasStore.getState().janelas.length;
      toast.warning(`Você está com ${total} telas abertas`, {
        description: `Acima de ${LIMITE_AVISO} telas o desempenho e a organização podem ser prejudicados — considere fechar algumas.`,
      });
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
