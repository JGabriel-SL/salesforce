import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpRight, History } from "lucide-react";
import { ICONES_JANELA } from "@/components/portal/shell/TabStrip";
import { PageHeader } from "@/components/portal/shared/PageHeader";
import { fmtDateTime } from "@/lib/mock";
import { janelasStore } from "@/lib/stores/janelas";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export const Route = createFileRoute("/_portal/frequentes")({
  component: FrequentesScreen,
});

/** Telas acessadas com frequência pelo usuário nesta sessão. */
function FrequentesScreen() {
  const acessos = janelasStore.useStore((s) => s.acessos);
  const abrir = useAbrirJanela();

  const ordenadas = useMemo(
    () =>
      Object.values(acessos).sort(
        (a, b) => b.acessos - a.acessos || b.ultimoAcesso.localeCompare(a.ultimoAcesso),
      ),
    [acessos],
  );
  const maxAcessos = ordenadas[0]?.acessos ?? 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Telas frequentes"
        subtitle="Suas rotinas mais utilizadas, sempre a um clique — quanto mais você usa, mais alto aparece."
      />

      {ordenadas.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <History className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Nenhum acesso registrado ainda — navegue pelas telas do portal e elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordenadas.map((a) => {
            const Icon = ICONES_JANELA[a.icone] ?? History;
            return (
              <button
                key={a.id}
                onClick={() => abrir({ id: a.id, titulo: a.titulo, icone: a.icone })}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-green-300 hover:shadow"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-green-50 text-green-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {a.titulo}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {a.acessos} acesso{a.acessos > 1 ? "s" : ""} · último em{" "}
                    {fmtDateTime(a.ultimoAcesso)}
                  </span>
                  <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-green-400"
                      style={{ width: `${Math.max(8, (a.acessos / maxAcessos) * 100)}%` }}
                    />
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-green-600" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
