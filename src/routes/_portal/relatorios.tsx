import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BarChart3, ExternalLink } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/portal/shared/PageHeader";
import { brl, calcDocumentoTotal, statusEfetivo } from "@/lib/mock";
import { filtrarDocumentos, usePermissoes } from "@/lib/permissoes";
import { dbStore } from "@/lib/stores/db";

export const Route = createFileRoute("/_portal/relatorios")({
  component: RelatoriosScreen,
});

const VERDES = ["#22c55e", "#16a34a", "#86efac", "#15803d", "#4ade80"];

const PAINEIS_POWERBI = [
  { nome: "Vendas Comercial — Diário", area: "Comercial" },
  { nome: "Margem e Rentabilidade", area: "Controladoria" },
  { nome: "Carteira de Clientes", area: "Relacionamento" },
  { nome: "Estoque e Ruptura", area: "Suprimentos" },
];

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function RelatoriosScreen() {
  const { perfil } = usePermissoes();
  const documentos = dbStore.useStore((s) => s.documentos);

  const docs = useMemo(
    () => (perfil ? filtrarDocumentos(documentos, perfil) : []),
    [documentos, perfil],
  );

  // Vendas por mês (últimos 4 meses, docs faturados por dtFat; demais por dtNeg)
  const vendasMes = useMemo(() => {
    const mapa = new Map<string, number>();
    const agora = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      mapa.set(d.toISOString().slice(0, 7), 0);
    }
    docs.forEach((doc) => {
      const chave = (doc.dtFat ?? doc.dtNeg).slice(0, 7);
      if (mapa.has(chave)) mapa.set(chave, (mapa.get(chave) ?? 0) + calcDocumentoTotal(doc));
    });
    return [...mapa.entries()].map(([mes, valor]) => ({
      mes: MESES[parseInt(mes.slice(5), 10) - 1],
      valor: Math.round(valor),
    }));
  }, [docs]);

  // Top parceiros por valor
  const topParceiros = useMemo(() => {
    const mapa = new Map<string, number>();
    docs.forEach((d) => {
      if (statusEfetivo(d) === "CANCELADO") return;
      mapa.set(d.parceiro, (mapa.get(d.parceiro) ?? 0) + calcDocumentoTotal(d));
    });
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, valor]) => ({
        nome: nome.length > 22 ? nome.slice(0, 22) + "…" : nome,
        valor: Math.round(valor),
      }));
  }, [docs]);

  // Funil orçamento → pedido → faturado
  const funil = useMemo(() => {
    const orcamentos = docs.filter((d) => d.tipo === "ORCAMENTO").length;
    const pedidos = docs.filter((d) => d.tipo === "PEDIDO").length;
    const faturados = docs.filter((d) => statusEfetivo(d) === "PEDIDO_FATURADO").length;
    return [
      { etapa: "Orçamentos", qtd: orcamentos },
      { etapa: "Pedidos", qtd: pedidos },
      { etapa: "Faturados", qtd: faturados },
    ];
  }, [docs]);

  // Vendas por linha de produto
  const porLinha = useMemo(() => {
    const mapa = new Map<string, number>();
    docs.forEach((d) => {
      if (statusEfetivo(d) === "CANCELADO") return;
      d.itens.forEach((i) => {
        mapa.set(i.linhaProduto, (mapa.get(i.linhaProduto) ?? 0) + i.quantidade * i.precoUnitario);
      });
    });
    return [...mapa.entries()].map(([linha, valor]) => ({ linha, valor: Math.round(valor) }));
  }, [docs]);

  const tooltipBRL = (v: number | string) => brl(Number(v));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Relatórios e Power BI"
        subtitle="Indicadores derivados dos documentos das empresas autorizadas do seu perfil."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GraficoCard titulo="Vendas por mês" subtitulo="Valor total dos documentos (R$)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vendasMes} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <Tooltip formatter={tooltipBRL} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="valor" name="Valor" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        <GraficoCard titulo="Top parceiros" subtitulo="Maiores volumes de compra (R$)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={topParceiros}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <YAxis
                type="category"
                dataKey="nome"
                width={150}
                tick={{ fontSize: 11, fill: "#475569" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={tooltipBRL} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="valor" name="Valor" fill="#16a34a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        <GraficoCard titulo="Funil comercial" subtitulo="Orçamento → Pedido → Faturamento (qtde)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funil} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="etapa"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="qtd" name="Documentos" radius={[6, 6, 0, 0]}>
                {funil.map((_, i) => (
                  <Cell key={i} fill={VERDES[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        <GraficoCard titulo="Vendas por linha de produto" subtitulo="Participação no valor bruto">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={porLinha}
                dataKey="valor"
                nameKey="linha"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {porLinha.map((_, i) => (
                  <Cell key={i} fill={VERDES[i % VERDES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipBRL} />
              <Legend
                formatter={(v) => <span style={{ color: "#475569", fontSize: 12 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </GraficoCard>
      </div>

      {/* Power BI */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-500">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Painéis Power BI</h2>
            <p className="text-xs text-slate-500">
              Acesso direto aos painéis publicados no workspace do Grupo HL.
            </p>
          </div>
        </header>
        <ul className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
          {PAINEIS_POWERBI.map((p) => (
            <li key={p.nome} className="bg-white">
              <a
                href="https://app.powerbi.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-full items-center gap-3 px-5 py-4 transition-colors hover:bg-amber-50/40"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-amber-100 text-[11px] font-black text-amber-700">
                  BI
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {p.nome}
                  </span>
                  <span className="block text-xs text-slate-400">{p.area}</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-300" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function GraficoCard({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
        <p className="text-xs text-slate-500">{subtitulo}</p>
      </div>
      {children}
    </section>
  );
}
