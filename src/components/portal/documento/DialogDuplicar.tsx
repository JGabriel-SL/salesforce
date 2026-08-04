import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Documento } from "@/lib/mock";
import { duplicarOrcamento } from "@/lib/stores/db";
import { useAbrirJanela } from "@/lib/stores/use-janelas";
import { useUsuario } from "@/lib/stores/sessao";

/**
 * Duplicação de orçamento (regra 8 do levantamento):
 *  - flag LIGADA: atualiza toda a cadeia de preços e valores comerciais;
 *  - flag DESLIGADA: atualiza somente o preço base;
 *  - sempre mantém descontos, comissão reduzida e ajustes do original.
 */
export function DialogDuplicar({
  doc,
  open,
  onOpenChange,
}: {
  doc: Documento | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [atualizarCadeia, setAtualizarCadeia] = useState(true);
  const usuario = useUsuario();
  const abrir = useAbrirJanela();

  if (!doc) return null;

  const confirmar = () => {
    if (!usuario) return;
    const novo = duplicarOrcamento(doc.nunota, atualizarCadeia, usuario);
    onOpenChange(false);
    if (novo == null) {
      toast.error("Somente orçamentos podem ser duplicados.");
      return;
    }
    toast.success(`Orçamento ${novo} criado a partir do ${doc.nunota}`, {
      description: atualizarCadeia
        ? "Cadeia de preços atualizada — descontos e ajustes preservados."
        : "Preços digitados mantidos — somente o preço base foi atualizado.",
    });
    abrir({ id: `/orcamentos/${novo}`, titulo: `Orçamento ${novo}`, icone: "documento" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicar orçamento {doc.nunota}</DialogTitle>
          <DialogDescription>
            {doc.parceiro} · Descontos, comissão reduzida e ajustes do original são sempre
            preservados.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900">
              Atualizar cadeia de preços completa
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
              {"Ligada: recalcula toda a cadeia de preços e os valores comerciais relacionados. "}
              {
                "Desligada: mantém os preços digitados (preço líquido) e atualiza apenas o preço base."
              }
            </span>
          </span>
          <Switch checked={atualizarCadeia} onCheckedChange={setAtualizarCadeia} />
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
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            <Copy className="h-4 w-4" />
            Duplicar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
