import { useLocation } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  GitPullRequestArrow,
  Headset,
  Home,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { janelasStore, LIMITE_JANELAS, type JanelaIcone } from "@/lib/stores/janelas";
import { useFecharJanela } from "@/lib/stores/use-janelas";

const ICONES: Record<JanelaIcone, LucideIcon> = {
  documento: FileText,
  parceiro: Users,
  flow: GitPullRequestArrow,
  telemarketing: Headset,
  limites: ShieldCheck,
  relatorios: BarChart3,
};

/** Barra MDI estilo Sankhya: Central fixa + até 5 janelas abertas. */
export function TabStrip() {
  const janelas = janelasStore.useStore((s) => s.janelas);
  const fechar = useFecharJanela();
  const router = useRouter();
  const { pathname } = useLocation();

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-green-200 bg-green-100/60 px-2 pt-1.5">
      <button
        onClick={() => router.history.push("/")}
        className={`flex shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors ${
          pathname === "/"
            ? "border-green-200 bg-white text-green-900 shadow-sm"
            : "border-transparent text-green-700 hover:bg-green-100 hover:text-green-900"
        }`}
      >
        <Home className="h-3.5 w-3.5" />
        Central
      </button>

      {janelas.map((j) => {
        const Icon = ICONES[j.icone] ?? FileText;
        const ativa = pathname === j.id;
        return (
          <div
            key={j.id}
            className={`group flex max-w-56 shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 pl-3 pr-1.5 py-1 text-xs font-medium transition-colors ${
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

      <span className="ml-auto shrink-0 pb-1 pr-2 text-[11px] tabular-nums text-green-600">
        {janelas.length}/{LIMITE_JANELAS} telas
      </span>
    </div>
  );
}
