import type { Empresa, LocalEstoque, Top } from "./types";

export const empresasMock: Empresa[] = [
  {
    codEmp: "M001",
    nome: "HL Distribuidora — Matriz SP",
    cidade: "São Paulo",
    uf: "SP",
    cnpj: "12.345.678/0001-90",
  },
  {
    codEmp: "F002",
    nome: "HL Distribuidora — Filial RJ",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    cnpj: "12.345.678/0002-71",
  },
  {
    codEmp: "F003",
    nome: "HL Distribuidora — Filial RS",
    cidade: "Porto Alegre",
    uf: "RS",
    cnpj: "12.345.678/0003-52",
  },
];

export const locaisEstoqueMock: LocalEstoque[] = [
  { codLocal: "01", descricao: "Depósito Central", pce: false },
  { codLocal: "02", descricao: "Expedição", pce: false },
  { codLocal: "09", descricao: "PCE — Produção", pce: true },
];

export const topsMock: Top[] = [
  { codTop: "1010", descricao: "Venda de Mercadoria", remessa: false },
  { codTop: "1020", descricao: "Venda com Faturamento", remessa: false },
  { codTop: "1030", descricao: "Venda para Consumidor Final", remessa: false },
  { codTop: "1090", descricao: "Remessa para Consumo", remessa: true },
];

export const nomeEmpresa = (codEmp: string) =>
  empresasMock.find((e) => e.codEmp === codEmp)?.nome ?? codEmp;
