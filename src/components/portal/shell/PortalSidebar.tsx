import { useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  FileText,
  GitPullRequestArrow,
  Headset,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Perfil } from "@/lib/mock";
import type { JanelaIcone } from "@/lib/stores/janelas";
import { useAbrirJanela } from "@/lib/stores/use-janelas";
import { usePermissoes } from "@/lib/permissoes";
import { useRouter } from "@tanstack/react-router";

interface NavItem {
  titulo: string;
  to: string;
  icone: LucideIcon;
  janelaIcone: JanelaIcone;
  visivel?: (perfil: Perfil) => boolean;
}

const GRUPOS: { grupo: string; itens: NavItem[] }[] = [
  {
    grupo: "Comercial",
    itens: [
      {
        titulo: "Orçamentos e Pedidos",
        to: "/orcamentos",
        icone: FileText,
        janelaIcone: "documento",
      },
      { titulo: "Parceiros", to: "/parceiros", icone: Users, janelaIcone: "parceiro" },
      {
        titulo: "Flow — Cadastro de Parceiros",
        to: "/flow",
        icone: GitPullRequestArrow,
        janelaIcone: "flow",
      },
    ],
  },
  {
    grupo: "Relacionamento",
    itens: [
      {
        titulo: "Telemarketing e Agenda",
        to: "/telemarketing",
        icone: Headset,
        janelaIcone: "telemarketing",
      },
    ],
  },
  {
    grupo: "Crédito",
    itens: [
      {
        titulo: "Liberação de Limites",
        to: "/limites",
        icone: ShieldCheck,
        janelaIcone: "limites",
      },
    ],
  },
  {
    grupo: "Análise",
    itens: [
      {
        titulo: "Relatórios e Power BI",
        to: "/relatorios",
        icone: BarChart3,
        janelaIcone: "relatorios",
      },
    ],
  },
];

export function PortalSidebar() {
  const { perfil } = usePermissoes();
  const abrir = useAbrirJanela();
  const router = useRouter();
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-green-200">
      <SidebarHeader className="border-b border-green-100">
        <button
          onClick={() => router.history.push("/")}
          className="flex items-center gap-2.5 rounded-md px-1 py-1 text-left"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green-500 text-white">
            <Boxes className="h-4 w-4" />
          </span>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold text-green-900">Sankhya · Portal</p>
            <p className="text-[11px] text-green-600">Central de Vendas</p>
          </div>
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/"}
                  onClick={() => router.history.push("/")}
                  tooltip="Central de Vendas"
                >
                  <LayoutDashboard />
                  <span>Central de Vendas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {GRUPOS.map(({ grupo, itens }) => {
          const visiveis = itens.filter((i) => !perfil || !i.visivel || i.visivel(perfil));
          if (visiveis.length === 0) return null;
          return (
            <SidebarGroup key={grupo}>
              <SidebarGroupLabel>{grupo}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visiveis.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.to)}
                        tooltip={item.titulo}
                        onClick={() =>
                          abrir({ id: item.to, titulo: item.titulo, icone: item.janelaIcone })
                        }
                      >
                        <item.icone />
                        <span>{item.titulo}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
