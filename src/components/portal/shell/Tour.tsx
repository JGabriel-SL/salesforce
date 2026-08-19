import { useCallback, useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { createStore } from "@/lib/stores/create-store";

/* ─────────────────────────────────────────────────────────────
   Tour guiado por tela (alvos marcados com data-tour="...").
   Ative pelo botão "?" no cabeçalho — os passos são resolvidos
   pela rota atual.
   ───────────────────────────────────────────────────────────── */

interface PassoTour {
  seletor: string;
  titulo: string;
  texto: string;
}

const PASSOS_SHELL: PassoTour[] = [
  {
    seletor: '[data-tour="sidebar"]',
    titulo: "Menu de módulos",
    texto:
      "Todas as rotinas comerciais centralizadas: Portal de Vendas, Parceiros, Flow, Telemarketing, Liberação de Limites e Relatórios. O que aparece aqui respeita o seu perfil.",
  },
  {
    seletor: '[data-tour="tabstrip"]',
    titulo: "Telas abertas (MDI)",
    texto:
      "Como no Sankhya, cada rotina abre em uma aba. “Central” e “Frequentes” são fixas; acima de 5 telas o portal emite um alerta de organização.",
  },
  {
    seletor: '[data-tour="busca"]',
    titulo: "Busca global (Ctrl+K)",
    texto: "Encontre parceiros, orçamentos, pedidos e também as telas do portal em um só lugar.",
  },
];

const TOURS: Record<string, PassoTour[]> = {
  "/": [
    {
      seletor: '[data-tour="kpis"]',
      titulo: "Indicadores do dia",
      texto:
        "Orçamentos abertos, expirando (validade de 10 dias), aguardando liberação e faturamento do mês — sempre restritos às empresas do seu perfil.",
    },
    {
      seletor: '[data-tour="cards"]',
      titulo: "Cards de atalho",
      texto:
        "Cards personalizados por perfil: solicitações do Flow, pedidos retira não coletados, agenda, liberações pendentes e painéis Power BI. Clique em “Abrir” para ir direto à rotina.",
    },
    ...PASSOS_SHELL,
  ],
  "/orcamentos": [
    {
      seletor: '[data-tour="novo"]',
      titulo: "Novo documento",
      texto:
        "Criação no padrão Sankhya: informe a TOP e o parceiro — o orçamento nasce parametrizado pela TOP, com validade de 10 dias.",
    },
    {
      seletor: '[data-tour="filtros"]',
      titulo: "Filtros",
      texto:
        "Filtre por tipo, período, status (Pendente, Confirmado, Aguardando liberação) ou busque por número e parceiro.",
    },
    {
      seletor: '[data-tour="tabela"]',
      titulo: "Documentos",
      texto:
        "Nro. Único (NUNOTA) e Nro. Nota (NUMNOTA — gerado no faturamento). Clique na linha para abrir; o menu ⋮ permite duplicar orçamentos (pedidos nunca são duplicados).",
    },
    ...PASSOS_SHELL,
  ],
  "/orcamentos/": [
    {
      seletor: '[data-tour="acoes-doc"]',
      titulo: "Ações do documento",
      texto:
        "Anexos, duplicação, confirmação para faturamento (roda a régua de eventos) e faturamento — que converte o orçamento em pedido e reserva o estoque.",
    },
    {
      seletor: '[data-tour="cabecalho-doc"]',
      titulo: "Cabeçalho e cliente",
      texto:
        "Dados do cliente com crédito disponível, contato de entrega, TOP e Tipo de Negociação (condição de pagamento — trocar recalcula os preços).",
    },
    {
      seletor: '[data-tour="abas-doc"]',
      titulo: "Abas do documento",
      texto:
        "Itens (com desconto × preço alternativo exclusivos), totais, disponibilidade de estoque segregada, transporte, financeiro e histórico de alterações.",
    },
    ...PASSOS_SHELL,
  ],
  "/parceiros": [
    {
      seletor: '[data-tour="tabela-parceiros"]',
      titulo: "Cadastro único de parceiros",
      texto:
        "Um único cadastro para o grupo, com dados segregados por empresa. Modelo Sankhya: parceiro matriz/filiais e limite de crédito parametrizado na ficha.",
    },
    ...PASSOS_SHELL,
  ],
  "/limites": [
    {
      seletor: '[data-tour="fila-liberacao"]',
      titulo: "Fila de liberação",
      texto:
        "Eventos numerados no padrão Sankhya (ex.: 3 — limite de crédito, 7 — atraso do parceiro). Aprovadores liberam ou recusam — a recusa exige motivo.",
    },
    ...PASSOS_SHELL,
  ],
};

function passosDaRota(pathname: string): PassoTour[] {
  if (TOURS[pathname]) return TOURS[pathname];
  const prefixo = Object.keys(TOURS)
    .filter((k) => k.endsWith("/") && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return prefixo ? TOURS[prefixo] : PASSOS_SHELL;
}

const tourStore = createStore<{ ativo: boolean; passo: number }>({ ativo: false, passo: 0 });

export function iniciarTour() {
  tourStore.setState({ ativo: true, passo: 0 });
}

/** Overlay do tour — renderizado uma única vez no layout do portal. */
export function TourOverlay() {
  const { ativo, passo } = tourStore.useStore((s) => s);
  const { pathname } = useLocation();
  const [rect, setRect] = useState<DOMRect | null>(null);

  const passos = passosDaRota(pathname);
  const atual = passos[passo];

  const medir = useCallback(() => {
    if (!atual) return;
    const el = document.querySelector(atual.seletor);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "nearest", behavior: "instant" as ScrollBehavior });
    setRect(el.getBoundingClientRect());
  }, [atual]);

  useEffect(() => {
    if (!ativo) return;
    medir();
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [ativo, medir]);

  useEffect(() => {
    // troca de tela no meio do tour → encerra
    tourStore.setState({ ativo: false, passo: 0 });
  }, [pathname]);

  if (!ativo || !atual) return null;

  const fechar = () => tourStore.setState({ ativo: false, passo: 0 });
  const proximo = () =>
    passo + 1 >= passos.length ? fechar() : tourStore.setState({ passo: passo + 1 });
  const anterior = () => passo > 0 && tourStore.setState({ passo: passo - 1 });

  // popover abaixo do alvo (ou acima, se não couber)
  const abaixo = rect ? rect.bottom + 260 < window.innerHeight : true;
  const popTop = rect ? (abaixo ? rect.bottom + 12 : undefined) : window.innerHeight / 2 - 100;
  const popBottom = rect && !abaixo ? window.innerHeight - rect.top + 12 : undefined;
  const popLeft = rect
    ? Math.min(Math.max(rect.left, 16), window.innerWidth - 356)
    : window.innerWidth / 2 - 170;

  return (
    <div className="fixed inset-0 z-[100]" onClick={fechar}>
      {rect ? (
        <div
          className="absolute rounded-xl ring-2 ring-green-400 transition-all duration-200"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/55" />
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute w-[340px] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
        style={{ top: popTop, bottom: popBottom, left: popLeft }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{atual.titulo}</p>
          <button onClick={fechar} className="rounded p-0.5 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{atual.texto}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] tabular-nums text-slate-400">
            {passo + 1} de {passos.length}
          </span>
          <div className="flex gap-1.5">
            {passo > 0 && (
              <button
                onClick={anterior}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3 w-3" /> Anterior
              </button>
            )}
            <button
              onClick={proximo}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
            >
              {passo + 1 >= passos.length ? "Concluir" : "Próximo"}
              {passo + 1 < passos.length && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
