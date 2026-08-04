import { createStore } from "./create-store";

/**
 * Gerenciador MDI estilo Sankhya: janelas abertas na barra de abas.
 * A Central (dashboard "/") é fixa e não conta no limite.
 */
export const LIMITE_JANELAS = 5;

/** chave do ícone — mapeada para componente lucide no TabStrip */
export type JanelaIcone =
  "documento" | "parceiro" | "flow" | "telemarketing" | "limites" | "relatorios";

export interface Janela {
  /** id = path completo da rota (também usado p/ navegar) */
  id: string;
  titulo: string;
  icone: JanelaIcone;
}

interface JanelasState {
  janelas: Janela[];
}

export const janelasStore = createStore<JanelasState>({ janelas: [] }, "portal_janelas_v1");

export type AbrirJanelaResultado = "aberta" | "ja-aberta" | "limite";

/** Abre (ou foca) uma janela. Retorna "limite" quando as 5 já estão em uso. */
export function abrirJanela(janela: Janela): AbrirJanelaResultado {
  const { janelas } = janelasStore.getState();
  const existente = janelas.find((j) => j.id === janela.id);
  if (existente) return "ja-aberta";
  if (janelas.length >= LIMITE_JANELAS) return "limite";
  janelasStore.setState({ janelas: [...janelas, janela] });
  return "aberta";
}

/** Fecha a janela e devolve o path para onde navegar caso ela fosse a ativa. */
export function fecharJanela(id: string, pathAtivo: string): string | null {
  const { janelas } = janelasStore.getState();
  const idx = janelas.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  const restantes = janelas.filter((j) => j.id !== id);
  janelasStore.setState({ janelas: restantes });
  if (pathAtivo !== id) return null; // fechou uma aba inativa — permanece onde está
  const vizinha = restantes[idx - 1] ?? restantes[idx] ?? null;
  return vizinha ? vizinha.id : "/";
}

/** Atualiza o título de uma janela já aberta (ex.: após carregar o documento). */
export function renomearJanela(id: string, titulo: string) {
  const { janelas } = janelasStore.getState();
  if (!janelas.some((j) => j.id === id)) return;
  janelasStore.setState({
    janelas: janelas.map((j) => (j.id === id ? { ...j, titulo } : j)),
  });
}

export function fecharTodasJanelas() {
  janelasStore.setState({ janelas: [] });
}
