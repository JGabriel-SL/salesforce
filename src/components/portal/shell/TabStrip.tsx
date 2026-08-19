import { useLocation } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  GitPullRequestArrow,
  Headset,
  History,
  Home,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { janelasStore, LIMITE_AVISO, type JanelaIcone } from "@/lib/stores/janelas";
import { useFecharJanela } from "@/lib/stores/use-janelas";

export const ICONES_JANELA: Record<JanelaIcone, LucideIcon> = {
  documento: FileText,
  parceiro: Users,
  flow: GitPullRequestArrow,
  telemarketing: Headset,
  limites: ShieldCheck,
  relatorios: BarChart3,
};

/** Barra MDI estilo Sankhya: Central e Frequentes fixas + janelas abertas. */
export function TabStrip() {
  const janelas = janelasStore.useStore((s) => s.janelas);
  const fechar = useFecharJanela();
  const router = useRouter();
  const { pathname } = useLocation();

  const abaFixa = (ativo: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors ${
      ativo
        ? "border-green-200 bg-white text-green-900 shadow-sm"
        : "border-transparent text-green-700 hover:bg-green-100 hover:text-green-900"
    }`;

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto border-b border-green-200 bg-green-100/60 px-2 pt-1.5"
      data-tour="tabstrip"
    >
      <button onClick={() => router.history.push("/")} className={abaFixa(pathname === "/")}>
        <Home className="h-3.5 w-3.5" />
        Central
      </button>
      <button
        onClick={() => router.history.push("/frequentes")}
        className={abaFixa(pathname === "/frequentes")}
        title="Telas acessadas com frequência"
      >
        <History className="h-3.5 w-3.5" />
        Frequentes
      </button>

      {janelas.map((j) => {
        const Icon = ICONES_JANELA[j.icone] ?? FileText;
        const ativa = pathname === j.id;
        return (
          <div
            key={j.id}
            className={`group flex max-w-56 shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 py-1 pl-3 pr-1.5 text-xs font-medium transition-colors ${
              ativa
                ? "border-green-200 bg-white text-green-900 shadow-sm"
                : "border-transparent text-green-700 hover:bg-green-100 hover:text-green-900"
            }`}
          >
            <button
              onClick={() => router.history.push(j.id)}
              className="flex min-w-0 items-center gap-1.5 py-0.5"
              title={j.titulo}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{j.titulo}</span>
            </button>
            <button
              onClick={() => fechar(j.id)}
              className="rounded p-0.5 text-green-500 opacity-60 transition-colors hover:bg-green-200 hover:text-green-900 group-hover:opacity-100"
              aria-label={`Fechar ${j.titulo}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      <span
        className={`ml-auto shrink-0 pb-1 pr-2 text-[11px] tabular-nums ${
          janelas.length > LIMITE_AVISO ? "font-semibold text-amber-600" : "text-green-600"
        }`}
      >
        {janelas.length} {janelas.length === 1 ? "tela aberta" : "telas abertas"}
        {janelas.length > LIMITE_AVISO && " ⚠"}
      </span>
    </div>
  );
}
