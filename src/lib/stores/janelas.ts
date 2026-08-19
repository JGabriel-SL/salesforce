import { createStore } from "./create-store";

/**
 * Gerenciador MDI estilo Sankhya: janelas abertas na barra de abas.
 * Não há limite rígido — acima de LIMITE_AVISO telas o portal apenas
 * alerta o usuário. A Central (dashboard "/") é fixa.
 */
export const LIMITE_AVISO = 5;

/** chave do ícone — mapeada para componente lucide no TabStrip */
export type JanelaIcone =
  "documento" | "parceiro" | "flow" | "telemarketing" | "limites" | "relatorios";

export interface Janela {
  /** id = path completo da rota (também usado p/ navegar) */
  id: string;
  titulo: string;
  icone: JanelaIcone;
}

/** Contador de acessos por tela — alimenta a aba "Frequentes". */
export interface AcessoTela {
  id: string;
  titulo: string;
  icone: JanelaIcone;
  acessos: number;
  ultimoAcesso: string; // ISO datetime
}

interface JanelasState {
  janelas: Janela[];
  acessos: Record<string, AcessoTela>;
}

export const janelasStore = createStore<JanelasState>(
  { janelas: [], acessos: {} },
  "portal_janelas_v2",
);

export type AbrirJanelaResultado = "aberta" | "ja-aberta" | "aviso";

/** Abre (ou foca) uma janela. Retorna "aviso" quando o total passa do
 *  limite recomendado — o chamador exibe o alerta, mas a tela abre. */
export function abrirJanela(janela: Janela): AbrirJanelaResultado {
  registrarAcesso(janela);
  const { janelas } = janelasStore.getState();
  if (janelas.some((j) => j.id === janela.id)) return "ja-aberta";
  const novas = [...janelas, janela];
  janelasStore.setState({ janelas: novas });
  return novas.length > LIMITE_AVISO ? "aviso" : "aberta";
}

/** Incrementa o contador de acessos da tela (aba "Frequentes"). */
export function registrarAcesso(janela: Janela) {
  const { acessos } = janelasStore.getState();
  const atual = acessos[janela.id];
  janelasStore.setState({
    acessos: {
      ...acessos,
      [janela.id]: {
        ...janela,
        acessos: (atual?.acessos ?? 0) + 1,
        ultimoAcesso: new Date().toISOString(),
      },
    },
  });
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
  const { janelas, acessos } = janelasStore.getState();
  janelasStore.setState({
    janelas: janelas.map((j) => (j.id === id ? { ...j, titulo } : j)),
    acessos: acessos[id] ? { ...acessos, [id]: { ...acessos[id], titulo } } : acessos,
  });
}

export function fecharTodasJanelas() {
  janelasStore.setState({ janelas: [] });
}
