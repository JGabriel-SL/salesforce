import type { CondicaoPagamento } from "./types";

export const condicoesMock: CondicaoPagamento[] = [
  { codigo: "AV", descricao: "À Vista", parcelas: 1, fatorPreco: 0.97 },
  { codigo: "30D", descricao: "30 dias", parcelas: 1, fatorPreco: 1.0 },
  { codigo: "30/60", descricao: "30/60 dias", parcelas: 2, fatorPreco: 1.02 },
  { codigo: "30/60/90", descricao: "30/60/90 dias", parcelas: 3, fatorPreco: 1.045 },
];

export const condicaoPorCodigo = (codigo: string) =>
  condicoesMock.find((c) => c.codigo === codigo) ?? condicoesMock[1];
