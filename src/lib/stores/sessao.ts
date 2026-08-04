import { usuariosMock } from "@/lib/mock";
import type { Usuario } from "@/lib/mock";
import { createStore } from "./create-store";

interface SessaoState {
  usuarioId: string | null;
}

export const sessaoStore = createStore<SessaoState>({ usuarioId: null }, "portal_sessao_v1");

export function login(usuarioId: string) {
  sessaoStore.setState({ usuarioId });
}

export function logout() {
  sessaoStore.setState({ usuarioId: null });
}

export function usuarioPorId(id: string | null): Usuario | null {
  return usuariosMock.find((u) => u.id === id) ?? null;
}

/** Usuário logado (null enquanto não autenticado/hidratado). */
export function useUsuario(): Usuario | null {
  const usuarioId = sessaoStore.useStore((s) => s.usuarioId);
  return usuarioPorId(usuarioId);
}
