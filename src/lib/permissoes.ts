import type { Documento, EstoqueLocal, Parceiro, Perfil, Produto, Top } from "@/lib/mock";
import { locaisEstoqueMock, topsMock } from "@/lib/mock";
import { useUsuario } from "@/lib/stores/sessao";

/* ─────────────────────────────────────────────────────────────
   Segregação da Central de Certificação — TODAS as telas leem
   dados através destes selectors (nunca dos arrays brutos):
   - empresas do grupo segregadas por perfil;
   - linhas de produto autorizadas;
   - estoques apenas das empresas autorizadas;
   - locais do PCE bloqueados;
   - TOPs de remessa restritas.
   ───────────────────────────────────────────────────────────── */

export function filtrarDocumentos(documentos: Documento[], perfil: Perfil): Documento[] {
  return documentos.filter((d) => perfil.empresasAutorizadas.includes(d.codEmp));
}

/** Cadastro único: o parceiro aparece se tiver dados em alguma
 *  empresa autorizada — mas a ficha só exibe as empresas do perfil. */
export function filtrarParceiros(parceiros: Parceiro[], perfil: Perfil): Parceiro[] {
  return parceiros.filter((p) =>
    p.dadosPorEmpresa.some((d) => perfil.empresasAutorizadas.includes(d.codEmp)),
  );
}

export function dadosEmpresaAutorizados(parceiro: Parceiro, perfil: Perfil) {
  return parceiro.dadosPorEmpresa.filter((d) => perfil.empresasAutorizadas.includes(d.codEmp));
}

export function filtrarProdutos(produtos: Produto[], perfil: Perfil): Produto[] {
  return produtos.filter((p) => perfil.linhasProdutoAutorizadas.includes(p.linhaProduto));
}

/** Estoques visíveis: empresas autorizadas e locais fora do bloqueio (PCE). */
export function filtrarEstoques(estoques: EstoqueLocal[], perfil: Perfil): EstoqueLocal[] {
  return estoques.filter(
    (e) =>
      perfil.empresasAutorizadas.includes(e.codEmp) &&
      !perfil.locaisEstoqueBloqueados.includes(e.codLocal),
  );
}

export function topsDisponiveis(perfil: Perfil): Top[] {
  return topsMock.filter((t) => perfil.topsPermitidas.includes(t.codTop));
}

export const nomeLocal = (codLocal: string) =>
  locaisEstoqueMock.find((l) => l.codLocal === codLocal)?.descricao ?? codLocal;

/** Hook de conveniência: usuário + perfil do logado. */
export function usePermissoes() {
  const usuario = useUsuario();
  return { usuario, perfil: usuario?.perfil ?? null };
}
