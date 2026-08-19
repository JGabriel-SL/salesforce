import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { delayOperacao } from "@/lib/mock";
import { resolverEvento } from "@/lib/stores/db";
import { useUsuario } from "@/lib/stores/sessao";

export interface AlvoRecusa {
  nunota: number;
  eventoId: string;
  titulo: string;
  descricao: string;
}

/** Recusa de evento de liberação exige motivo (registrado no histórico). */
export function DialogRecusarEvento({
  alvo,
  onOpenChange,
}: {
  alvo: AlvoRecusa | null;
  onOpenChange: (v: boolean) => void;
}) {
  const usuario = useUsuario();
  const [motivo, setMotivo] = useState("");
  const [processando, setProcessando] = useState(false);

  const confirmar = async () => {
    if (!usuario || !alvo || !motivo.trim() || processando) return;
    setProcessando(true);
    await delayOperacao(700, 1600);
    setProcessando(false);
    resolverEvento(alvo.nunota, alvo.eventoId, "RECUSADO", usuario, motivo.trim());
    setMotivo("");
    onOpenChange(false);
    toast.error("Evento recusado", {
      description: `Documento ${alvo.nunota} · motivo registrado no histórico.`,
    });
  };

  return (
    <Dialog open={alvo != null} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recusar evento de liberação</DialogTitle>
          <DialogDescription>
            {alvo?.titulo} · Documento {alvo?.nunota}
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{alvo?.descricao}</p>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Motivo da recusa *
          </span>
          <textarea
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder="Descreva o motivo — será registrado no histórico do documento…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </label>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!motivo.trim() || processando}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Registrando…
              </>
            ) : (
              <>
                <X className="h-4 w-4" /> Recusar evento
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
