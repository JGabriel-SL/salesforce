import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoginPage } from "@/components/portal/LoginPage";
import { PortalHeader } from "@/components/portal/shell/PortalHeader";
import { PortalSidebar } from "@/components/portal/shell/PortalSidebar";
import { TabStrip } from "@/components/portal/shell/TabStrip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { dbStore } from "@/lib/stores/db";
import { abrirJanela, janelasStore, type JanelaIcone } from "@/lib/stores/janelas";
import { sessaoStore, useUsuario } from "@/lib/stores/sessao";

export const Route = createFileRoute("/_portal")({
  component: PortalLayout,
});

/** Título/ícone padrão p/ janelas abertas por URL direta (F5, link compartilhado). */
function janelaPadrao(pathname: string): { titulo: string; icone: JanelaIcone } | null {
  if (pathname.startsWith("/orcamentos/"))
    return { titulo: `Documento ${pathname.split("/")[2]}`, icone: "documento" };
  if (pathname.startsWith("/parceiros/"))
    return { titulo: `Parceiro ${pathname.split("/")[2]}`, icone: "parceiro" };
  const mapa: Record<string, { titulo: string; icone: JanelaIcone }> = {
    "/orcamentos": { titulo: "Orçamentos e Pedidos", icone: "documento" },
    "/parceiros": { titulo: "Parceiros", icone: "parceiro" },
    "/flow": { titulo: "Flow — Cadastro de Parceiros", icone: "flow" },
    "/telemarketing": { titulo: "Telemarketing e Agenda", icone: "telemarketing" },
    "/limites": { titulo: "Liberação de Limites", icone: "limites" },
    "/relatorios": { titulo: "Relatórios e Power BI", icone: "relatorios" },
  };
  return mapa[pathname] ?? null;
}

function PortalLayout() {
  // Hidratação client-side dos stores persistidos (sessionStorage é
  // inacessível no SSR — este gate evita mismatch de hidratação).
  const [pronto, setPronto] = useState(false);
  const usuario = useUsuario();
  const { pathname } = useLocation();

  useEffect(() => {
    sessaoStore.hydrate();
    janelasStore.hydrate();
    dbStore.hydrate();
    setPronto(true);
  }, []);

  // Acesso por URL direta: garante que a tela atual exista na barra MDI.
  useEffect(() => {
    if (!pronto || pathname === "/") return;
    const { janelas } = janelasStore.getState();
    if (janelas.some((j) => j.id === pathname)) return;
    const padrao = janelaPadrao(pathname);
    if (padrao) abrirJanela({ id: pathname, ...padrao });
  }, [pronto, pathname]);

  if (!pronto) return null;

  if (!usuario) {
    return (
      <>
        <LoginPage />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <SidebarProvider>
      <PortalSidebar />
      <SidebarInset className="min-w-0 bg-green-50/30">
        <PortalHeader />
        <TabStrip />
        <main className="min-h-0 flex-1">
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
