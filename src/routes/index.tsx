import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { pedidosMock } from "@/lib/sankhya-mock";
import { PedidosList } from "@/components/portal/PedidosList";
import { PedidoDetalhe } from "@/components/portal/PedidoDetalhe";
import { LoginPage } from "@/components/portal/LoginPage";
import { Boxes, LogOut } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [logado, setLogado] = useState(() => sessionStorage.getItem("portal_logado") === "1");
  const [selected, setSelected] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pedido = selected != null ? pedidosMock.find((p) => p.nunota === selected) : null;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const logout = () => {
    sessionStorage.removeItem("portal_logado");
    setLogado(false);
    setMenuOpen(false);
  };

  if (!logado) {
    return (
      <LoginPage
        onLogin={() => {
          sessionStorage.setItem("portal_logado", "1");
          setLogado(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-green-50/30 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-green-200 bg-green-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-green-500 text-white">
              <Boxes className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-green-900">Sankhya · Portal</p>
              <p className="text-[11px] text-green-600">Central de Vendas</p>
            </div>
          </div>
          <nav className="hidden gap-1 rounded-lg bg-green-100 p-1 text-xs font-medium sm:flex">
            <span className="rounded-md bg-white px-3 py-1.5 text-green-900 shadow-sm">Vendas</span>
            <span className="px-3 py-1.5 text-green-600">Compras</span>
            <span className="px-3 py-1.5 text-green-600">Financeiro</span>
            <span className="px-3 py-1.5 text-green-600">Cadastros</span>
          </nav>
          <div className="relative flex items-center gap-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-full bg-green-200 text-xs font-semibold text-green-700 transition-colors hover:bg-green-300"
            >
              MC
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {pedido ? (
        <PedidoDetalhe pedido={pedido} onBack={() => setSelected(null)} />
      ) : (
        <PedidosList pedidos={pedidosMock} onSelect={setSelected} />
      )}
    </div>
  );
}
