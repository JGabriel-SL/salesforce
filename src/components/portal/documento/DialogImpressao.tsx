import { useState } from "react";
import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { brl, calcDocumentoTotal, calcItemTotal, fmtDate, precoLiquidoItem } from "@/lib/mock";
import type { Documento } from "@/lib/mock";
import { dbStore } from "@/lib/stores/db";

/** Impressão de nota (DANFE simplificado) e boleto — layout HTML + window.print. */
export function DialogImpressao({
  doc,
  open,
  onOpenChange,
}: {
  doc: Documento;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [modo, setModo] = useState<"nota" | "boleto">("nota");
  const financeiro = dbStore.useStore((s) => s.financeiro);
  const parceiros = dbStore.useStore((s) => s.parceiros);
  const titulos = financeiro.filter((f) => f.nunota === doc.nunota);
  const parceiro = parceiros.find((p) => p.codParc === doc.codParc);
  const total = calcDocumentoTotal(doc);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="print:hidden">
          <DialogTitle>Impressão de documentos</DialogTitle>
          <DialogDescription>
            NUNOTA {doc.nunota} · {doc.parceiro}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 print:hidden">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <button
              onClick={() => setModo("nota")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                modo === "nota" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Nota Fiscal (DANFE)
            </button>
            <button
              onClick={() => setModo("boleto")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                modo === "boleto" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Boleto
            </button>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>

        <div className="print-area">
          {modo === "nota" ? (
            <div className="rounded-lg border border-slate-300 bg-white p-6 text-slate-900">
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
                <div>
                  <p className="text-lg font-bold">HL DISTRIBUIDORA LTDA</p>
                  <p className="text-xs text-slate-600">{doc.empresa}</p>
                  <p className="text-xs text-slate-600">CNPJ 12.345.678/0001-90</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">DANFE — Documento Auxiliar da NF-e</p>
                  <p className="text-xs text-slate-600">0 — ENTRADA · 1 — SAÍDA [1]</p>
                  <p className="mt-1 font-mono text-sm font-bold">Nº {doc.nunota}</p>
                </div>
              </div>

              {doc.chaveNfe && (
                <div className="mt-3 rounded border border-slate-300 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Chave de acesso
                  </p>
                  <p className="font-mono text-xs tracking-tight">{doc.chaveNfe}</p>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded border border-slate-300 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Destinatário
                  </p>
                  <p className="font-semibold">{doc.parceiro}</p>
                  <p>{parceiro?.cnpj ?? "—"}</p>
                  <p>
                    {parceiro?.endereco ?? "—"} · {parceiro?.cidade}/{parceiro?.uf}
                  </p>
                </div>
                <div className="rounded border border-slate-300 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Emissão</p>
                  <p>Data Neg.: {fmtDate(doc.dtNeg)}</p>
                  {doc.dtFat && <p>Faturamento: {fmtDate(doc.dtFat)}</p>}
                  <p>
                    TOP: {doc.codTop} — {doc.top}
                  </p>
                  <p>Vendedor: {doc.vendedor}</p>
                </div>
              </div>

              <table className="mt-3 w-full border-collapse text-xs">
                <thead>
                  <tr className="border-y border-slate-800 text-left text-[10px] uppercase tracking-wider text-slate-600">
                    <th className="py-1.5 pr-2">Cód.</th>
                    <th className="py-1.5 pr-2">Descrição</th>
                    <th className="py-1.5 pr-2 text-right">Qtd.</th>
                    <th className="py-1.5 pr-2 text-right">Vl. Unit.</th>
                    <th className="py-1.5 text-right">Vl. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.itens.map((i) => (
                    <tr key={i.id} className="border-b border-slate-200">
                      <td className="py-1.5 pr-2 font-mono">{i.codProd}</td>
                      <td className="py-1.5 pr-2">{i.descricao}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">
                        {i.quantidade} {i.unidade}
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">
                        {brl(precoLiquidoItem(i))}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{brl(calcItemTotal(i))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-800 font-semibold">
                    <td colSpan={4} className="py-2 pr-2 text-right">
                      VALOR TOTAL DA NOTA
                    </td>
                    <td className="py-2 text-right tabular-nums">{brl(total)}</td>
                  </tr>
                </tfoot>
              </table>

              <p className="mt-4 text-center text-[10px] text-slate-400">
                Documento sem valor fiscal — emitido pelo Portal de Vendas (demonstração).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(titulos.length > 0 ? titulos : [null]).map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  <div className="flex items-center justify-between border-b-2 border-slate-800 px-4 py-2">
                    <p className="text-lg font-black italic text-slate-700">HL BANK | 341-7</p>
                    <p className="font-mono text-sm font-semibold tracking-wider">
                      34191.09008 12345.678901 23456.789012 1 {doc.nunota}0000
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-px bg-slate-200 text-xs">
                    <div className="col-span-3 bg-white p-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Beneficiário
                      </p>
                      <p className="font-semibold">HL Distribuidora Ltda — {doc.codEmp}</p>
                    </div>
                    <div className="bg-white p-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Vencimento
                      </p>
                      <p className="font-semibold tabular-nums">
                        {t ? fmtDate(t.dtVencimento) : "—"}
                      </p>
                    </div>
                    <div className="col-span-3 bg-white p-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Pagador</p>
                      <p className="font-semibold">{doc.parceiro}</p>
                      <p>{parceiro?.cnpj}</p>
                    </div>
                    <div className="bg-white p-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Valor do documento
                      </p>
                      <p className="font-bold tabular-nums">
                        {brl(t ? t.valor : total)}
                        {t && (
                          <span className="ml-1 text-[10px] font-normal text-slate-500">
                            (parcela {t.parcela}/{titulos.length})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div
                      className="h-12 w-full"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, #0f172a 0 2px, transparent 2px 5px, #0f172a 5px 6px, transparent 6px 9px, #0f172a 9px 12px, transparent 12px 14px)",
                      }}
                    />
                    <p className="mt-2 text-center text-[10px] text-slate-400">
                      Boleto ilustrativo — demonstração do Portal de Vendas.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
