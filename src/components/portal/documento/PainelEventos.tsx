import { useState } from "react";
import { Check, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { EventoStatusPill } from "@/components/portal/shared/StatusPill";
import { delayOperacao, eventoTitulo, fmtDateTime } from "@/lib/mock";
import type { Documento } from "@/lib/mock";
import { usePermissoes } from "@/lib/permissoes";
import { resolverEvento } from "@/lib/stores/db";
import { DialogRecusarEvento, type AlvoRecusa } from "./DialogRecusarEvento";

/** Eventos de bloqueio do documento (numeração padrão Sankhya).
 *  Perfis aprovadores podem liberar/recusar diretamente daqui —
 *  a recusa exige motivo. */
export function PainelEventos({ doc }: { doc: Documento }) {
  const { usuario, perfil } = usePermissoes();
  const [recusando, setRecusando] = useState<AlvoRecusa | null>(null);
  const [liberandoId, setLiberandoId] = useState<string | null>(null);
  if (doc.eventos.length === 0) return null;

  const liberar = async (eventoId: string) => {
    if (!usuario || liberandoId) return;
    setLiberandoId(eventoId);
    await delayOperacao(700, 1600);
    setLiberandoId(null);
    resolverEvento(doc.nunota, eventoId, "LIBERADO", usuario);
    const pendentes = doc.eventos.filter(
      (e) => e.status === "PENDENTE" && e.id !== eventoId,
    ).length;
    if (pendentes === 0) {
      toast.success("Todos os eventos liberados — documento pronto para faturamento!");
    } else {
      toast("Evento liberado", { description: `${pendentes} evento(s) ainda pendente(s).` });
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/70 px-5 py-3">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-semibold text-amber-900">Eventos de liberação</h2>
        <span className="ml-auto text-xs text-amber-700">
          {doc.eventos.filter((e) => e.status === "PENDENTE").length} pendente(s)
        </span>
      </header>
      <ul className="divide-y divide-slate-100">
        {doc.eventos.map((ev) => (
          <li key={ev.id} className="flex items-center gap-4 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{eventoTitulo(ev.tipo)}</p>
              <p className="truncate text-xs text-slate-500">{ev.descricao}</p>
              {ev.resolvidoPor && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {ev.status === "LIBERADO" ? "Liberado" : "Recusado"} por {ev.resolvidoPor} em{" "}
                  {fmtDateTime(ev.resolvidoEm!)}
                  {ev.motivoRecusa && (
                    <span className="text-rose-500"> · motivo: {ev.motivoRecusa}</span>
                  )}
                </p>
              )}
            </div>
            <EventoStatusPill status={ev.status} />
            {perfil?.podeAprovarLiberacoes && ev.status === "PENDENTE" && (
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => liberar(ev.id)}
                  disabled={liberandoId != null}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-70"
                >
                  {liberandoId === ev.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Liberando…
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Liberar
                    </>
                  )}
                </button>
                <button
                  onClick={() =>
                    setRecusando({
                      nunota: doc.nunota,
                      eventoId: ev.id,
                      titulo: eventoTitulo(ev.tipo),
                      descricao: ev.descricao,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <X className="h-3.5 w-3.5" /> Recusar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!perfil?.podeAprovarLiberacoes && (
        <p className="border-t border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs text-slate-500">
          As liberações são realizadas pela gerência na tela{" "}
          <span className="font-medium">Liberação de Limites</span>.
        </p>
      )}
      <DialogRecusarEvento alvo={recusando} onOpenChange={(v) => !v && setRecusando(null)} />
    </section>
  );
}
