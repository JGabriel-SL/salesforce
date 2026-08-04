import { useMemo, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { empresasMock } from "@/lib/mock";
import { dadosEmpresaAutorizados, filtrarParceiros, usePermissoes } from "@/lib/permissoes";
import { criarOrcamento, dbStore } from "@/lib/stores/db";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export function DialogNovoOrcamento({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { usuario, perfil } = usePermissoes();
  const parceiros = dbStore.useStore((s) => s.parceiros);
  const abrir = useAbrirJanela();

  const [codParc, setCodParc] = useState("");
  const [codEmp, setCodEmp] = useState("");

  const parceirosVisiveis = useMemo(
    () => (perfil ? filtrarParceiros(parceiros, perfil) : []),
    [parceiros, perfil],
  );
  const parceiro = parceirosVisiveis.find((p) => p.codParc === codParc);
  const empresasDoParceiro = useMemo(
    () => (parceiro && perfil ? dadosEmpresaAutorizados(parceiro, perfil) : []),
    [parceiro, perfil],
  );

  const criar = () => {
    if (!usuario || !parceiro) return;
    const emp = empresasDoParceiro.find((d) => d.codEmp === codEmp) ?? empresasDoParceiro[0];
    if (!emp) return;
    const nomeEmp = empresasMock.find((e) => e.codEmp === emp.codEmp)?.nome ?? emp.codEmp;
    const nunota = criarOrcamento(parceiro, emp.codEmp, nomeEmp, usuario);
    onOpenChange(false);
    setCodParc("");
    setCodEmp("");
    toast.success(`Orçamento ${nunota} criado`, {
      description: `${parceiro.razaoSocial} · validade de 10 dias`,
    });
    abrir({ id: `/orcamentos/${nunota}`, titulo: `Orçamento ${nunota}`, icone: "documento" });
  };

  const selectCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo orçamento</DialogTitle>
          <DialogDescription>
            Selecione o parceiro e a empresa de venda. O orçamento nasce com validade de 10 dias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Parceiro
            </span>
            <select
              value={codParc}
              onChange={(e) => {
                setCodParc(e.target.value);
                setCodEmp("");
              }}
              className={selectCls}
            >
              <option value="">Selecione…</option>
              {parceirosVisiveis.map((p) => (
                <option key={p.codParc} value={p.codParc}>
                  {p.codParc} — {p.razaoSocial}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Empresa
            </span>
            <select
              value={codEmp}
              onChange={(e) => setCodEmp(e.target.value)}
              disabled={!parceiro}
              className={`${selectCls} disabled:bg-slate-50 disabled:text-slate-400`}
            >
              {empresasDoParceiro.length === 0 && <option value="">—</option>}
              {empresasDoParceiro.map((d) => {
                const emp = empresasMock.find((e) => e.codEmp === d.codEmp);
                return (
                  <option key={d.codEmp} value={d.codEmp}>
                    {d.codEmp} — {emp?.nome ?? d.codEmp}
                  </option>
                );
              })}
            </select>
            {parceiro && empresasDoParceiro.length === 0 && (
              <p className="mt-1 text-xs text-rose-600">
                Este parceiro não possui dados nas empresas autorizadas do seu perfil.
              </p>
            )}
          </label>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={criar}
            disabled={!parceiro || empresasDoParceiro.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FilePlus2 className="h-4 w-4" />
            Criar orçamento
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
