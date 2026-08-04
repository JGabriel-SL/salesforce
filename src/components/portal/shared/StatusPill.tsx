import type { DocumentoStatus, EventoStatus } from "@/lib/mock";
import { STATUS_LABEL } from "@/lib/mock";

export type PillTone =
  "emerald" | "amber" | "sky" | "rose" | "slate" | "violet" | "orange" | "blue";

const TONES: Record<PillTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function Pill({
  tone,
  children,
  dot = true,
}: {
  tone: PillTone;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
    >
      {dot && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<DocumentoStatus, PillTone> = {
  ORCAMENTO_ABERTO: "sky",
  ORCAMENTO_EXPIRADO: "slate",
  AGUARDANDO_LIBERACAO: "amber",
  PRONTO_FATURAMENTO: "emerald",
  SEM_ESTOQUE: "rose",
  PEDIDO_ABERTO: "violet",
  PEDIDO_FATURADO: "blue",
  CANCELADO: "rose",
};

export function DocumentoStatusPill({ status }: { status: DocumentoStatus }) {
  return <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>;
}

export function EventoStatusPill({ status }: { status: EventoStatus }) {
  const map: Record<EventoStatus, { tone: PillTone; label: string }> = {
    PENDENTE: { tone: "amber", label: "Pendente" },
    LIBERADO: { tone: "emerald", label: "Liberado" },
    RECUSADO: { tone: "rose", label: "Recusado" },
  };
  const { tone, label } = map[status];
  return <Pill tone={tone}>{label}</Pill>;
}
