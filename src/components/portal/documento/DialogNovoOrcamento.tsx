import { useMemo, useState } from "react";
import { FilePlus2, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pill } from "@/components/portal/shared/StatusPill";
import { delayOperacao, empresasMock } from "@/lib/mock";
import {
  dadosEmpresaAutorizados,
  filtrarParceiros,
  topsDisponiveis,
  usePermissoes,
} from "@/lib/permissoes";
import { criarOrcamento, dbStore } from "@/lib/stores/db";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

/**
 * Criação de documento no padrão Sankhya: primeiro a TOP (Tipo de
 * Operação), depois o parceiro — o documento nasce parametrizado
 * pela TOP informada (tipo de negociação, natureza, modalidade).
 */
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

  const [codTop, setCodTop] = useState("");
  const [codParc, setCodParc] = useState("");
  const [codEmp, setCodEmp] = useState("");
  const [gerando, setGerando] = useState(false);

  const tops = useMemo(() => (perfil ? topsDisponiveis(perfil) : []), [perfil]);
  const top = tops.find((t) => t.codTop === codTop);

  const parceirosVisiveis = useMemo(
    () => (perfil ? filtrarParceiros(parceiros, perfil) : []),
    [parceiros, perfil],
  );
  const parceiro = parceirosVisiveis.find((p) => p.codParc === codParc);
  const empresasDoParceiro = useMemo(
    () => (parceiro && perfil ? dadosEmpresaAutorizados(parceiro, perfil) : []),
    [parceiro, perfil],
  );

  const criar = async () => {
    if (!usuario || !parceiro || !top || gerando) return;
    const emp = empresasDoParceiro.find((d) => d.codEmp === codEmp) ?? empresasDoParceiro[0];
    if (!emp) return;
    setGerando(true);
    await delayOperacao(1000, 2500);
    setGerando(false);
    const nomeEmp = empresasMock.find((e) => e.codEmp === emp.codEmp)?.nome ?? emp.codEmp;
    const nunota = criarOrcamento(parceiro, emp.codEmp, nomeEmp, usuario, top.codTop);
    onOpenChange(false);
    setCodTop("");
    setCodParc("");
    setCodEmp("");
    toast.success(`Orçamento ${nunota} criado`, {
      description: `TOP ${top.codTop} — ${top.descricao} · ${parceiro.razaoSocial} · validade de 10 dias`,
    });
    abrir({ id: `/orcamentos/${nunota}`, titulo: `Orçamento ${nunota}`, icone: "documento" });
  };

  const selectCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo documento de venda</DialogTitle>
          <DialogDescription>
            Informe a TOP e o parceiro — o orçamento é gerado com a parametrização da TOP e validade
            de 10 dias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              TOP — Tipo de Operação
            </span>
            <select
              value={codTop}
              onChange={(e) => setCodTop(e.target.value)}
              className={selectCls}
            >
              <option value="">Selecione…</option>
              {tops.map((t) => (
                <option key={t.codTop} value={t.codTop}>
                  {t.codTop} — {t.descricao}
                  {t.remessa ? " (remessa)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Exibindo somente as TOPs autorizadas pelo seu perfil.
            </p>
          </label>

          {top && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50/50 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green-100 text-green-700">
                <Receipt className="h-4 w-4" />
              </span>
              <div className="min-w-0 text-xs leading-relaxed text-slate-600">
                <p className="font-semibold text-slate-900">
                  {top.codTop} — {top.descricao}
                </p>
                <p>
                  O documento nasce parametrizado por esta TOP: tipo de negociação, natureza e
                  modalidade de entrega.
                </p>
                {top.remessa && (
                  <div className="mt-1">
                    <Pill tone="amber" dot={false}>
                      TOP de remessa — uso restrito
                    </Pill>
                  </div>
                )}
              </div>
            </div>
          )}

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
            disabled={!top || !parceiro || empresasDoParceiro.length === 0 || gerando}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {gerando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando documento…
              </>
            ) : (
              <>
                <FilePlus2 className="h-4 w-4" /> Gerar documento
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
