import { useMemo, useState } from "react";
import { PackagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NumberCell } from "@/components/portal/shared/CodedFieldRow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { brl, calcItemTotal, condicaoPorCodigo, precoLiquidoItem } from "@/lib/mock";
import type { Documento, DocumentoItem } from "@/lib/mock";
import { filtrarProdutos, usePermissoes } from "@/lib/permissoes";
import {
  adicionarItem,
  atualizarItem,
  dbStore,
  estoqueDisponivel,
  removerItem,
} from "@/lib/stores/db";
import type { RegrasDocumento } from "./regras";

/** Célula numérica que grava no "banco" apenas ao concluir a edição
 *  (blur/Enter) — mantém o histórico de alterações limpo. */
function CommitNumberCell({
  value,
  onCommit,
  disabled,
  ...rest
}: {
  value: number;
  onCommit: (v: number) => void;
  disabled?: boolean;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  width?: string;
}) {
  const [local, setLocal] = useState<number | null>(null);
  const commit = () => {
    if (local != null && local !== value) onCommit(local);
    setLocal(null);
  };
  return (
    <div onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()}>
      <NumberCell value={local ?? value} onChange={setLocal} disabled={disabled} {...rest} />
    </div>
  );
}

export function AbaItens({ doc, regras }: { doc: Documento; regras: RegrasDocumento }) {
  const { usuario } = usePermissoes();
  const [addAberto, setAddAberto] = useState(false);

  const alterar = (item: DocumentoItem, patch: Partial<DocumentoItem>) => {
    if (!usuario) return;
    atualizarItem(doc.nunota, item.id, patch, usuario);
  };

  const remover = (item: DocumentoItem) => {
    if (!usuario) return;
    if (!removerItem(doc.nunota, item.id, usuario)) {
      toast.error("Exclusão de itens de pedidos não é permitida", {
        description: "Alterações em pedidos devem ser direcionadas ao PCE.",
      });
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Itens do documento</h2>
          <p className="text-xs text-slate-500">
            Desconto e Preço Alternativo são regras independentes — apenas uma por item.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {doc.itens.length} {doc.itens.length === 1 ? "item" : "itens"}
          </span>
          {regras.podeAdicionarItem && (
            <button
              onClick={() => setAddAberto(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              Adicionar item
            </button>
          )}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Produto</th>
              <th className="px-3 py-3 text-right">Qtd.</th>
              <th className="px-3 py-3 text-right">Preço Unit.</th>
              <th className="px-3 py-3 text-right">Desc. %</th>
              <th className="px-3 py-3 text-right">Preço Alt.</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doc.itens.map((item) => {
              const comAlternativo = item.precoAlternativo != null && item.precoAlternativo > 0;
              const comDesconto = item.descontoPct > 0;
              return (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <div className="max-w-64 truncate font-medium text-slate-900">
                        {item.descricao}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.codProd} · {item.unidade} · {item.linhaProduto} · base{" "}
                        {brl(item.precoBase)}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <CommitNumberCell
                      value={item.quantidade}
                      step={1}
                      min={0}
                      disabled={!regras.podeEditar}
                      onCommit={(v) => alterar(item, { quantidade: v })}
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <CommitNumberCell
                      value={item.precoUnitario}
                      step={0.01}
                      min={0}
                      prefix="R$"
                      width="w-28"
                      disabled={!regras.podeEditar || comAlternativo}
                      onCommit={(v) => alterar(item, { precoUnitario: v })}
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <CommitNumberCell
                            value={item.descontoPct}
                            step={0.5}
                            min={0}
                            max={100}
                            suffix="%"
                            disabled={!regras.podeEditar || comAlternativo}
                            onCommit={(v) => alterar(item, { descontoPct: v })}
                          />
                        </div>
                      </TooltipTrigger>
                      {comAlternativo && (
                        <TooltipContent>
                          Item com Preço Alternativo — desconto bloqueado (regras exclusivas).
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <CommitNumberCell
                            value={item.precoAlternativo ?? 0}
                            step={0.01}
                            min={0}
                            prefix="R$"
                            width="w-28"
                            disabled={!regras.podeEditar || comDesconto}
                            onCommit={(v) => alterar(item, { precoAlternativo: v > 0 ? v : null })}
                          />
                        </div>
                      </TooltipTrigger>
                      {comDesconto && (
                        <TooltipContent>
                          Item com desconto — Preço Alternativo bloqueado (regras exclusivas).
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {brl(calcItemTotal(item))}
                    <div className="text-[11px] font-normal text-slate-400">
                      líq. {brl(precoLiquidoItem(item))}/{item.unidade}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <button
                            onClick={() => remover(item)}
                            disabled={!regras.podeRemoverItem}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            aria-label="Remover item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </TooltipTrigger>
                      {!regras.podeRemoverItem && (
                        <TooltipContent>
                          {doc.tipo === "PEDIDO"
                            ? "Exclusão de itens somente via PCE."
                            : "Documento não editável neste status."}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
            {doc.itens.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                  Nenhum item no documento. Use “Adicionar item” para montar o carrinho.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DialogAdicionarItem doc={doc} open={addAberto} onOpenChange={setAddAberto} />
    </section>
  );
}

/** "Carrinho": inclusão de item com desconto opcional já na entrada.
 *  Produtos limitados às linhas autorizadas do perfil. */
function DialogAdicionarItem({
  doc,
  open,
  onOpenChange,
}: {
  doc: Documento;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { usuario, perfil } = usePermissoes();
  const produtos = dbStore.useStore((s) => s.produtos);
  const [codProd, setCodProd] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [descontoPct, setDescontoPct] = useState(0);

  const disponiveis = useMemo(
    () => (perfil ? filtrarProdutos(produtos, perfil) : []),
    [produtos, perfil],
  );
  const produto = disponiveis.find((p) => p.codProd === codProd);
  const fator = condicaoPorCodigo(doc.codCondicao).fatorPreco;
  const precoVenda = produto ? Math.round(produto.precoBase * fator * 100) / 100 : 0;
  const saldo = produto ? estoqueDisponivel(dbStore.getState(), produto.codProd, doc.codEmp) : 0;

  const incluir = () => {
    if (!usuario || !produto || quantidade <= 0) return;
    adicionarItem(
      doc.nunota,
      {
        id: `i-${Date.now()}`,
        codProd: produto.codProd,
        descricao: produto.descricao,
        unidade: produto.unidade,
        linhaProduto: produto.linhaProduto,
        quantidade,
        precoBase: produto.precoBase,
        precoUnitario: precoVenda,
        descontoPct,
        precoAlternativo: null,
      },
      usuario,
    );
    onOpenChange(false);
    setCodProd("");
    setQuantidade(1);
    setDescontoPct(0);
    toast.success(`${produto.descricao} incluído`, {
      description:
        saldo < quantidade ? "Atenção: quantidade acima do saldo disponível." : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar item</DialogTitle>
          <DialogDescription>
            Somente produtos das linhas autorizadas ({perfil?.linhasProdutoAutorizadas.join(", ")}).
            Preço calculado pela condição {doc.codCondicao}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Produto
            </span>
            <select
              value={codProd}
              onChange={(e) => setCodProd(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">Selecione…</option>
              {disponiveis.map((p) => (
                <option key={p.codProd} value={p.codProd}>
                  {p.codProd} — {p.descricao} ({p.linhaProduto})
                </option>
              ))}
            </select>
          </label>

          {produto && (
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Preço venda</p>
                <p className="font-semibold tabular-nums text-slate-900">{brl(precoVenda)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Preço mínimo</p>
                <p className="font-medium tabular-nums text-slate-600">
                  {brl(produto.precoMinimo)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Saldo em {doc.codEmp}
                </p>
                <p
                  className={`font-semibold tabular-nums ${saldo === 0 ? "text-rose-600" : "text-slate-900"}`}
                >
                  {saldo} {produto.unidade}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Quantidade
              </span>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Desconto % (carrinho)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={descontoPct}
                onChange={(e) => setDescontoPct(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={incluir}
            disabled={!produto || quantidade <= 0}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PackagePlus className="h-4 w-4" />
            Incluir no documento
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
