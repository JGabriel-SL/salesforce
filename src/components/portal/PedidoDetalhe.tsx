import { useMemo, useState, useRef } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  User2,
  Receipt,
  Trash2,
  Save,
  Layers,
  Wallet,
  CheckCircle,
  Paperclip,
  Upload,
  Truck,
  DollarSign,
  Tag,
} from "lucide-react";
import {
  Pedido,
  PedidoItem,
  DocumentoAnexado,
  brl,
  calcItemTotal,
  calcPedidoTotal,
  documentosMock,
  formatBytes,
  fmtDateTime,
  fmtDate,
  transportesMock,
  financeiroMock,
} from "@/lib/sankhya-mock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  pedido: Pedido;
  onBack: () => void;
}

export function PedidoDetalhe({ pedido, onBack }: Props) {
  const [docsOpen, setDocsOpen] = useState(false);
  const [novosDocs, setNovosDocs] = useState<DocumentoAnexado[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [subAba, setSubAba] = useState<"itens" | "transporte" | "financeiro">("itens");
  const [itens, setItens] = useState<PedidoItem[]>(pedido.itens);
  const [cabecalho, setCabecalho] = useState({
    codTop: pedido.codTop,
    top: pedido.top,
    codEmp: pedido.codEmp,
    empresa: pedido.empresa,
    dtNeg: pedido.dtNeg,
    vendedor: pedido.vendedor,
    codTipoNegociacao: pedido.codTipoNegociacao,
    tipoNegociacao: pedido.tipoNegociacao,
    codCentroCusto: pedido.codCentroCusto,
    centroCusto: pedido.centroCusto,
    codNatureza: pedido.codNatureza,
    natureza: pedido.natureza,
  });
  const setCab = <K extends keyof typeof cabecalho>(k: K, v: (typeof cabecalho)[K]) =>
    setCabecalho((p) => ({ ...p, [k]: v }));

  const total = useMemo(() => calcPedidoTotal(itens), [itens]);
  const totalBruto = useMemo(
    () => itens.reduce((a, i) => a + i.quantidade * i.precoUnitario, 0),
    [itens],
  );
  const totalDesc = totalBruto - total;

  const update = (id: string, patch: Partial<PedidoItem>) =>
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const remove = (id: string) => setItens((prev) => prev.filter((i) => i.id !== id));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const novos: DocumentoAnexado[] = Array.from(files).map((f, i) => {
      const ext = f.name.split(".").pop() || "bin";
      return {
        nunota: pedido.nunota,
        sequencia: Date.now() + i,
        nomeArquivo: f.name.replace(`.${ext}`, ""),
        extensao: ext,
        tamanhoBytes: f.size,
        usuario: "Você",
        dataHora: new Date().toISOString(),
      };
    });
    setNovosDocs((prev) => [...prev, ...novos]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para lista
          </button>
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Central de Vendas · NUNOTA {pedido.nunota}
          </h1>
          <p className="text-sm text-slate-500">
            NUNOTA {pedido.nunota} · {pedido.parceiro} · {pedido.status}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            onClick={() => setDocsOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Paperclip className="h-4 w-4" /> Anexar docs
          </button>
          {pedido.status !== "Confirmado" && (
            <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100">
              <CheckCircle className="h-4 w-4" /> Confirmar pedido
            </button>
          )}
          <button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800">
            <Save className="h-4 w-4" /> Salvar alterações
          </button>
        </div>
      </div>

      {/* Sub-abas: Itens | Transporte | Financeiro */}
      <nav className="mb-6 flex gap-1 rounded-lg bg-green-100 p-1 text-xs font-medium">
        {[
          { key: "itens" as const, label: "Itens", icon: Receipt },
          { key: "transporte" as const, label: "Transporte", icon: Truck },
          { key: "financeiro" as const, label: "Financeiro", icon: DollarSign },
        ].map((a) => {
          const Icon = a.icon;
          const ativa = subAba === a.key;
          return (
            <button
              key={a.key}
              onClick={() => setSubAba(a.key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
                ativa ? "bg-white text-green-900 shadow-sm" : "text-green-600 hover:text-green-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {a.label}
            </button>
          );
        })}
      </nav>

      {subAba === "transporte" ? (
        /* Conteúdo de Transporte */
        (() => {
          const t = transportesMock.find((x) => x.nunota === pedido.nunota);
          if (!t)
            return (
              <p className="text-sm text-slate-500">
                Nenhum registro de transporte para este pedido.
              </p>
            );
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-50 text-sky-600">
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.transportadora}</p>
                  <p className="text-xs text-slate-500">Placa {t.placa}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Volumes</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{t.volumes}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Peso (kg)</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{t.pesoKg}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Embarque</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {new Date(t.dtEmbarque + "T00:00:00").toLocaleDateString("pt-BR")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Situação</dt>
                  <dd className="mt-0.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        t.situacao === "Entregue"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : t.situacao === "Em Transporte"
                            ? "bg-blue-50 text-blue-700 ring-blue-200"
                            : t.situacao === "Faturado"
                              ? "bg-sky-50 text-sky-700 ring-sky-200"
                              : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {t.situacao}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          );
        })()
      ) : subAba === "financeiro" ? (
        /* Conteúdo de Financeiro */
        (() => {
          const titulos = financeiroMock.filter((f) => f.nunota === pedido.nunota);
          if (titulos.length === 0)
            return (
              <p className="text-sm text-slate-500">Nenhum título financeiro para este pedido.</p>
            );
          return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Parcela</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                      <th className="px-4 py-3">Vencimento</th>
                      <th className="px-4 py-3">Pagamento</th>
                      <th className="px-4 py-3">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {titulos.map((f) => (
                      <tr key={f.parcela}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {f.parcela}/{titulos.length}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                          {brl(f.valor)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(f.dtVencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {f.dtPagamento
                            ? new Date(f.dtPagamento + "T00:00:00").toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              f.situacao === "Pago"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : f.situacao === "Vencido"
                                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                                  : "bg-amber-50 text-amber-700 ring-amber-200"
                            }`}
                          >
                            {f.situacao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Lado A - Cabeçalho do Pedido */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Parceiro
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">{pedido.parceiro}</p>
              <p className="text-xs text-slate-500">Cód. {pedido.codParc}</p>
              {pedido.chaveNfe && (
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Chave NFe:</span>{" "}
                  <span className="font-mono tracking-tight">{pedido.chaveNfe}</span>
                </p>
              )}

              <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                <CodedFieldRow
                  icon={<Receipt className="h-4 w-4" />}
                  label="TOP"
                  code={cabecalho.codTop}
                  value={cabecalho.top}
                  onCodeChange={(v) => setCab("codTop", v)}
                  onValueChange={(v) => setCab("top", v)}
                />
                <CodedFieldRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Empresa"
                  code={cabecalho.codEmp}
                  value={cabecalho.empresa}
                  onCodeChange={(v) => setCab("codEmp", v)}
                  onValueChange={(v) => setCab("empresa", v)}
                />
                <EditableRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Data Neg."
                  type="date"
                  value={cabecalho.dtNeg}
                  onChange={(v) => setCab("dtNeg", v)}
                />
                <EditableRow
                  icon={<User2 className="h-4 w-4" />}
                  label="Vendedor"
                  value={cabecalho.vendedor}
                  onChange={(v) => setCab("vendedor", v)}
                />
                <CodedFieldRow
                  icon={<Tag className="h-4 w-4" />}
                  label="Tipo Neg."
                  code={cabecalho.codTipoNegociacao}
                  value={cabecalho.tipoNegociacao}
                  onCodeChange={(v) => setCab("codTipoNegociacao", v)}
                  onValueChange={(v) => setCab("tipoNegociacao", v)}
                />
                <CodedFieldRow
                  icon={<Layers className="h-4 w-4" />}
                  label="Centro de Custo"
                  code={cabecalho.codCentroCusto}
                  value={cabecalho.centroCusto}
                  onCodeChange={(v) => setCab("codCentroCusto", v)}
                  onValueChange={(v) => setCab("centroCusto", v)}
                />
                <CodedFieldRow
                  icon={<Wallet className="h-4 w-4" />}
                  label="Natureza"
                  code={cabecalho.codNatureza}
                  value={cabecalho.natureza}
                  onCodeChange={(v) => setCab("codNatureza", v)}
                  onValueChange={(v) => setCab("natureza", v)}
                />
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Totalizador financeiro
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <TotalRow label="Subtotal (bruto)" value={brl(totalBruto)} />
                <TotalRow label="Descontos" value={`- ${brl(totalDesc)}`} muted />
                <div className="mt-2 flex items-baseline justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-medium text-slate-600">Valor total do pedido</span>
                  <span className="text-xl font-semibold tabular-nums text-slate-900">
                    {brl(total)}
                  </span>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">
                {itens.length} {itens.length === 1 ? "item" : "itens"} · Status{" "}
                <span className="font-medium text-slate-700">{pedido.status}</span>
              </p>
              {pedido.dtFat && (
                <p className="mt-1 text-xs text-slate-500">
                  Faturamento{" "}
                  <span className="font-medium text-slate-700">{fmtDate(pedido.dtFat)}</span>
                </p>
              )}
            </section>

            {pedido.observacao && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Observação
                </p>
                <p className="mt-2 text-sm text-slate-700">{pedido.observacao}</p>
              </section>
            )}
          </aside>

          {/* Dialog de Documentos Anexados */}
          <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Documentos anexados</DialogTitle>
                <DialogDescription>
                  NUNOTA {pedido.nunota} · {pedido.parceiro}
                </DialogDescription>
              </DialogHeader>

              {/* Upload area */}
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-5 transition-colors hover:border-slate-300 hover:bg-slate-50">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
                >
                  <Upload className="h-4 w-4" />
                  Clique para selecionar arquivos
                </button>
              </div>

              {/* Lista de documentos */}
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {[...documentosMock.filter((d) => d.nunota === pedido.nunota), ...novosDocs].map(
                  (doc) => (
                    <div
                      key={doc.sequencia}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                          {doc.extensao}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {doc.nomeArquivo}.{doc.extensao}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {formatBytes(doc.tamanhoBytes)} · {doc.usuario} ·{" "}
                            {fmtDateTime(doc.dataHora)}
                          </p>
                        </div>
                      </div>
                      <button className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
                        Download
                      </button>
                    </div>
                  ),
                )}
                {documentosMock.filter((d) => d.nunota === pedido.nunota).length === 0 &&
                  novosDocs.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Nenhum documento anexado a este pedido.
                    </p>
                  )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Lado B - Itens do Pedido */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Itens do pedido</h2>
                <p className="text-xs text-slate-500">
                  Edite os campos destacados para recalcular os valores.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {itens.length} {itens.length === 1 ? "item" : "itens"}
              </span>
            </header>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-3 py-3 text-right">Qtd.</th>
                    <th className="px-3 py-3 text-right">Preço Unit.</th>
                    <th className="px-3 py-3 text-right">Desc. %</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900">
                            {item.descricao}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.codProd} · {item.unidade}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <NumberCell
                          value={item.quantidade}
                          step={1}
                          min={0}
                          onChange={(v) => update(item.id, { quantidade: v })}
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <NumberCell
                          value={item.precoUnitario}
                          step={0.01}
                          min={0}
                          onChange={(v) => update(item.id, { precoUnitario: v })}
                          prefix="R$"
                          width="w-28"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <NumberCell
                          value={item.descontoPct}
                          step={0.5}
                          min={0}
                          max={100}
                          onChange={(v) => update(item.id, { descontoPct: v })}
                          suffix="%"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {brl(calcItemTotal(item))}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <button
                          onClick={() => remove(item.id)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {itens.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                        Nenhum item no pedido.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-right text-sm font-medium text-slate-600"
                    >
                      Total do pedido
                    </td>
                    <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-slate-900">
                      {brl(total)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className="truncate text-sm font-medium text-slate-900">{value}</dd>
      </div>
    </div>
  );
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  );
}

function EditableRow({
  icon,
  label,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "date";
}) {
  return (
    <FieldRow icon={icon} label={label}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />
    </FieldRow>
  );
}

function CodedFieldRow({
  icon,
  label,
  code,
  value,
  onCodeChange,
  onValueChange,
}: {
  icon: React.ReactNode;
  label: string;
  code: string;
  value: string;
  onCodeChange: (v: string) => void;
  onValueChange: (v: string) => void;
}) {
  return (
    <FieldRow icon={icon} label={label}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="w-24 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-mono font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>
    </FieldRow>
  );
}

function TotalRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`tabular-nums ${muted ? "text-slate-500" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}

interface NumberCellProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  width?: string;
}
function NumberCell({
  value,
  onChange,
  step = 1,
  min,
  max,
  prefix,
  suffix,
  width = "w-24",
}: NumberCellProps) {
  return (
    <div
      className={`ml-auto flex items-center justify-end gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-right transition-colors focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 ${width}`}
    >
      {prefix && <span className="text-xs text-slate-400">{prefix}</span>}
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="w-full bg-transparent text-right text-sm tabular-nums text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
    </div>
  );
}
