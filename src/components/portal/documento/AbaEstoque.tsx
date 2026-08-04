import { PackageX } from "lucide-react";
import { Pill } from "@/components/portal/shared/StatusPill";
import type { Documento } from "@/lib/mock";
import { filtrarEstoques, nomeLocal, usePermissoes } from "@/lib/permissoes";
import { dbStore } from "@/lib/stores/db";

/**
 * Disponibilidade de estoque por item — somente empresas autorizadas
 * do perfil e locais fora do bloqueio do PCE (segregação ao vivo).
 */
export function AbaEstoque({ doc }: { doc: Documento }) {
  const { perfil } = usePermissoes();
  const produtos = dbStore.useStore((s) => s.produtos);
  if (!perfil) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Exibindo apenas estoques das empresas autorizadas ({perfil.empresasAutorizadas.join(", ")})
        {perfil.locaisEstoqueBloqueados.length > 0 &&
          ` · locais do PCE (${perfil.locaisEstoqueBloqueados.join(", ")}) ocultos pela Central de Certificação`}
        .
      </p>
      {doc.itens.map((item) => {
        const produto = produtos.find((p) => p.codProd === item.codProd);
        const estoques = produto ? filtrarEstoques(produto.estoques, perfil) : [];
        const disponivelEmpresa = estoques
          .filter((e) => e.codEmp === doc.codEmp)
          .reduce((acc, e) => acc + e.disponivel, 0);
        const semSaldo = disponivelEmpresa < item.quantidade;

        return (
          <section
            key={item.id}
            className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
              semSaldo ? "border-rose-200" : "border-slate-200"
            }`}
          >
            <header
              className={`flex flex-wrap items-center gap-2 border-b px-5 py-3 ${
                semSaldo ? "border-rose-100 bg-rose-50/60" : "border-slate-100 bg-slate-50/60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{item.descricao}</p>
                <p className="text-xs text-slate-500">
                  {item.codProd} · necessário: {item.quantidade} {item.unidade} · disponível em{" "}
                  {doc.codEmp}: {disponivelEmpresa}
                </p>
              </div>
              {semSaldo ? (
                <Pill tone="rose">
                  <PackageX className="mr-1 h-3 w-3" />
                  Sem estoque suficiente
                </Pill>
              ) : (
                <Pill tone="emerald">Disponível</Pill>
              )}
            </header>
            {estoques.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">
                Nenhum estoque visível para o seu perfil.
              </p>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-2">Empresa</th>
                    <th className="px-5 py-2">Local</th>
                    <th className="px-5 py-2 text-right">Disponível</th>
                    <th className="px-5 py-2 text-right">Reservado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {estoques.map((e) => (
                    <tr key={`${e.codEmp}-${e.codLocal}`}>
                      <td className="px-5 py-2 font-mono text-xs text-slate-600">{e.codEmp}</td>
                      <td className="px-5 py-2 text-slate-700">
                        {e.codLocal} — {nomeLocal(e.codLocal)}
                      </td>
                      <td
                        className={`px-5 py-2 text-right font-medium tabular-nums ${
                          e.disponivel === 0 ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {e.disponivel}
                      </td>
                      <td className="px-5 py-2 text-right tabular-nums text-slate-500">
                        {e.reservado}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
      {doc.itens.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Adicione itens ao documento para consultar a disponibilidade.
        </p>
      )}
    </div>
  );
}
