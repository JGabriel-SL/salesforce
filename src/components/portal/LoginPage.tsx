import { useState } from "react";
import { Boxes, Eye, EyeOff, LogIn } from "lucide-react";

interface Props {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: Props) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha.trim()) {
      setErro(true);
      return;
    }
    setErro(false);
    onLogin();
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Coluna esquerda — 70% */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-12 text-white lg:flex">
        <div className="max-w-lg text-center">
          <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <Boxes className="h-8 w-8" />
          </span>
          <h1 className="text-4xl font-bold tracking-tight">Sankhya · Portal</h1>
          <p className="mt-3 text-lg text-white/80">
            Central de Vendas — gerencie pedidos, transporte e financeiro em um só lugar.
          </p>
          <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-white/30" />
          <p className="mt-6 text-sm text-white/60"></p>
        </div>
      </div>

      {/* Coluna direita — 30% */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-[30%] lg:min-w-[30%]">
        <div className="w-full max-w-sm">
          {/* Logo + título no mobile */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-green-500 text-white">
              <Boxes className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Sankhya · Portal</h1>
            <p className="text-sm text-slate-500">Central de Vendas</p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Acessar</h2>
          <p className="mt-1 text-sm text-slate-500">Informe suas credenciais para entrar.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Usuário</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setErro(false);
                }}
                placeholder="Digite seu usuário"
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <div className="relative mt-1.5">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErro(false);
                  }}
                  placeholder="Digite sua senha"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-sm font-medium text-rose-600">
                Preencha usuário e senha para continuar.
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            © 2026 Sankhya · Portal. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
