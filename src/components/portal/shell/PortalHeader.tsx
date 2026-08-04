import { useEffect, useMemo, useState } from "react";
import { FileText, LogOut, RefreshCcw, Search, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { statusEfetivo, STATUS_LABEL } from "@/lib/mock";
import { filtrarDocumentos, filtrarParceiros, usePermissoes } from "@/lib/permissoes";
import { dbStore, resetarDemo } from "@/lib/stores/db";
import { fecharTodasJanelas } from "@/lib/stores/janelas";
import { logout } from "@/lib/stores/sessao";
import { useAbrirJanela } from "@/lib/stores/use-janelas";

export function PortalHeader() {
  const { usuario, perfil } = usePermissoes();
  const [buscaAberta, setBuscaAberta] = useState(false);
  const abrir = useAbrirJanela();

  const documentos = dbStore.useStore((s) => s.documentos);
  const parceiros = dbStore.useStore((s) => s.parceiros);

  const docsVisiveis = useMemo(
    () => (perfil ? filtrarDocumentos(documentos, perfil) : []),
    [documentos, perfil],
  );
  const parceirosVisiveis = useMemo(
    () => (perfil ? filtrarParceiros(parceiros, perfil) : []),
    [parceiros, perfil],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setBuscaAberta((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-green-200 bg-green-50/80 px-3 py-2 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="text-green-700 hover:bg-green-100 hover:text-green-900" />
        <div className="hidden leading-tight sm:block">
          <p className="truncate text-sm font-semibold text-green-900">Central de Vendas</p>
          <p className="truncate text-[11px] text-green-600">
            {usuario?.perfil.nome} · {usuario?.perfil.empresasAutorizadas.join(" · ")}
          </p>
        </div>
      </div>

      <button
        onClick={() => setBuscaAberta(true)}
        className="flex min-w-0 flex-1 max-w-md items-center gap-2 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-sm text-slate-400 shadow-sm transition-colors hover:border-green-300"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Buscar parceiro, orçamento ou pedido…</span>
        <kbd className="ml-auto hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:block">
          Ctrl K
        </kbd>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-200 text-xs font-semibold text-green-700 transition-colors hover:bg-green-300">
            {usuario?.iniciais ?? "?"}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <p className="text-sm font-semibold text-slate-900">{usuario?.nome}</p>
            <p className="text-xs font-normal text-slate-500">{usuario?.cargo}</p>
            <p className="mt-0.5 text-xs font-normal text-slate-400">{usuario?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <UserRound className="h-4 w-4" />
            Trocar usuário
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              resetarDemo();
              fecharTodasJanelas();
              toast.success("Dados da demonstração restaurados");
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Resetar dados demo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              fecharTodasJanelas();
              logout();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandDialog open={buscaAberta} onOpenChange={setBuscaAberta}>
        <CommandInput placeholder="Buscar parceiro, orçamento ou pedido…" />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Parceiros">
            {parceirosVisiveis.map((p) => (
              <CommandItem
                key={p.codParc}
                value={`${p.codParc} ${p.razaoSocial} ${p.nomeFantasia}`}
                onSelect={() => {
                  setBuscaAberta(false);
                  abrir({
                    id: `/parceiros/${p.codParc}`,
                    titulo: p.nomeFantasia,
                    icone: "parceiro",
                  });
                }}
              >
                <Users className="h-4 w-4 text-slate-400" />
                <span className="min-w-0 flex-1 truncate">{p.razaoSocial}</span>
                <span className="font-mono text-xs text-slate-400">{p.codParc}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Orçamentos e Pedidos">
            {docsVisiveis.map((d) => (
              <CommandItem
                key={d.nunota}
                value={`${d.nunota} ${d.parceiro} ${d.vendedor}`}
                onSelect={() => {
                  setBuscaAberta(false);
                  abrir({
                    id: `/orcamentos/${d.nunota}`,
                    titulo: `${d.tipo === "ORCAMENTO" ? "Orçamento" : "Pedido"} ${d.nunota}`,
                    icone: "documento",
                  });
                }}
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-mono font-medium">{d.nunota}</span> · {d.parceiro}
                </span>
                <span className="text-xs text-slate-400">{STATUS_LABEL[statusEfetivo(d)]}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
