import { useState } from "react";
import { Boxes, Building2, Check, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { usuariosMock } from "@/lib/mock";
import { login } from "@/lib/stores/sessao";

/**
 * Login por seleção de persona (POC): cada usuário demonstra um
 * recorte de permissões/segregação. A senha é decorativa.
 */
export function LoginPage() {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionado) {
      setErro(true);
      return;
    }
    login(selecionado);
  };

  return (
    <div className="flex h-screen w-screen">
      {/* Coluna esquerda — hero */}
      <div className="hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-12 text-white lg:flex">
        <div className="max-w-lg text-center">
          <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <Boxes className="h-8 w-8" />
          </span>
          <h1 className="text-4xl font-bold tracking-tight">Sankhya · Portal</h1>
          <p className="mt-3 text-lg text-white/80">
            Central de Vendas — orçamentos, parceiros, telemarketing e liberações em um só ambiente.
          </p>
          <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-white/30" />
          <div className="mt-8 space-y-2 text-left text-sm text-white/75">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Segregação entre empresas do grupo e linhas autorizadas
            </p>
            <p className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0" />
              Regras da Central de Certificação aplicadas em todas as telas
            </p>
          </div>
        </div>
      </div>

      {/* Coluna direita — seleção de persona */}
      <div className="flex w-full items-center justify-center overflow-y-auto bg-white px-6 py-8 lg:w-[38%] lg:min-w-[420px]">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-green-500 text-white">
              <Boxes className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Sankhya · Portal</h1>
            <p className="text-sm text-slate-500">Central de Vendas</p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Acessar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Selecione o usuário para entrar na Central de Vendas.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              {usuariosMock.map((u) => {
                const ativo = selecionado === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelecionado(u.id);
                      setErro(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      ativo
                        ? "border-green-500 bg-green-50 ring-2 ring-green-500/20"
                        : "border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/40"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                        ativo ? "bg-green-500 text-white" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {u.iniciais}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {u.nome}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{u.cargo}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                        {u.perfil.nome} · {u.perfil.empresasAutorizadas.join(", ")}
                      </span>
                    </span>
                    {ativo && <Check className="h-4 w-4 shrink-0 text-green-600" />}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <div className="relative mt-1.5">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••  (demonstração)"
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
                Selecione um usuário para continuar.
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
