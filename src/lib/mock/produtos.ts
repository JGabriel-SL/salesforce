import type { Produto } from "./types";

/* Estoque distribuído entre empresas/locais para evidenciar a segregação:
   o local "09" (PCE) só aparece para perfis sem bloqueio. */
export const produtosMock: Produto[] = [
  {
    codProd: "PRD-1001",
    descricao: "Cabo HDMI 2.1 Ultra HD 2m",
    unidade: "UN",
    linhaProduto: "Tecnologia",
    precoBase: 49.9,
    precoMinimo: 43.9,
    estoques: [
      { codEmp: "M001", codLocal: "01", disponivel: 320, reservado: 24 },
      { codEmp: "M001", codLocal: "02", disponivel: 45, reservado: 0 },
      { codEmp: "F002", codLocal: "01", disponivel: 110, reservado: 10 },
    ],
  },
  {
    codProd: "PRD-1188",
    descricao: "Fonte ATX 650W 80 Plus Bronze",
    unidade: "UN",
    linhaProduto: "Tecnologia",
    precoBase: 389.0,
    precoMinimo: 349.0,
    estoques: [
      { codEmp: "M001", codLocal: "01", disponivel: 58, reservado: 8 },
      { codEmp: "F002", codLocal: "01", disponivel: 22, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-2340",
    descricao: "SSD NVMe 1TB Gen4",
    unidade: "UN",
    linhaProduto: "Tecnologia",
    precoBase: 629.5,
    precoMinimo: 559.0,
    estoques: [
      { codEmp: "M001", codLocal: "01", disponivel: 96, reservado: 12 },
      { codEmp: "M001", codLocal: "09", disponivel: 40, reservado: 0 },
      { codEmp: "F003", codLocal: "01", disponivel: 30, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-4410",
    descricao: 'Notebook Corporate 14" i5',
    unidade: "UN",
    linhaProduto: "Tecnologia",
    precoBase: 4890.0,
    precoMinimo: 4390.0,
    estoques: [
      { codEmp: "M001", codLocal: "01", disponivel: 14, reservado: 6 },
      { codEmp: "F002", codLocal: "01", disponivel: 4, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-4415",
    descricao: 'Monitor 27" QHD IPS',
    unidade: "UN",
    linhaProduto: "Tecnologia",
    precoBase: 1720.0,
    precoMinimo: 1548.0,
    estoques: [
      { codEmp: "M001", codLocal: "01", disponivel: 25, reservado: 6 },
      { codEmp: "M001", codLocal: "02", disponivel: 8, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-4420",
    descricao: "Dock Station USB-C 100W",
    unidade: "UN",
    linhaProduto: "Tecnologia",
    precoBase: 690.0,
    precoMinimo: 610.0,
    estoques: [{ codEmp: "M001", codLocal: "01", disponivel: 0, reservado: 0 }],
  },
  {
    codProd: "PRD-3301",
    descricao: "Rolamento SKF 6205-2Z",
    unidade: "UN",
    linhaProduto: "Industrial",
    precoBase: 18.75,
    precoMinimo: 16.5,
    estoques: [
      { codEmp: "M001", codLocal: "01", disponivel: 800, reservado: 100 },
      { codEmp: "F002", codLocal: "01", disponivel: 1200, reservado: 150 },
      { codEmp: "F002", codLocal: "09", disponivel: 500, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-3311",
    descricao: "Correia dentada HTD 8M-1200",
    unidade: "UN",
    linhaProduto: "Industrial",
    precoBase: 92.4,
    precoMinimo: 82.0,
    estoques: [
      { codEmp: "M001", codLocal: "01", disponivel: 140, reservado: 20 },
      { codEmp: "F002", codLocal: "01", disponivel: 260, reservado: 40 },
    ],
  },
  {
    codProd: "PRD-3345",
    descricao: "Mancal de Ferro Fundido P205",
    unidade: "UN",
    linhaProduto: "Industrial",
    precoBase: 64.9,
    precoMinimo: 57.5,
    estoques: [
      { codEmp: "M001", codLocal: "01", disponivel: 90, reservado: 0 },
      { codEmp: "F002", codLocal: "01", disponivel: 75, reservado: 5 },
    ],
  },
  {
    codProd: "PRD-3390",
    descricao: "Motor Elétrico Trifásico 2CV",
    unidade: "UN",
    linhaProduto: "Industrial",
    precoBase: 1480.0,
    precoMinimo: 1320.0,
    estoques: [
      { codEmp: "F002", codLocal: "01", disponivel: 12, reservado: 2 },
      { codEmp: "F003", codLocal: "01", disponivel: 6, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-5501",
    descricao: "Refrigerante Cola 2L PET (cx 6)",
    unidade: "CX",
    linhaProduto: "Alimentos",
    precoBase: 42.0,
    precoMinimo: 37.8,
    estoques: [
      { codEmp: "F002", codLocal: "01", disponivel: 640, reservado: 80 },
      { codEmp: "F003", codLocal: "01", disponivel: 480, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-5510",
    descricao: "Água Mineral 500ml (fardo 12)",
    unidade: "FD",
    linhaProduto: "Alimentos",
    precoBase: 18.9,
    precoMinimo: 16.8,
    estoques: [
      { codEmp: "F002", codLocal: "01", disponivel: 900, reservado: 120 },
      { codEmp: "F003", codLocal: "01", disponivel: 750, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-5522",
    descricao: "Suco Integral Uva 1L (cx 12)",
    unidade: "CX",
    linhaProduto: "Alimentos",
    precoBase: 71.5,
    precoMinimo: 63.9,
    estoques: [
      { codEmp: "F002", codLocal: "01", disponivel: 180, reservado: 24 },
      { codEmp: "F002", codLocal: "02", disponivel: 36, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-6601",
    descricao: "Farinha de Trigo Especial 25kg",
    unidade: "SC",
    linhaProduto: "Alimentos",
    precoBase: 128.0,
    precoMinimo: 114.0,
    estoques: [
      { codEmp: "F002", codLocal: "01", disponivel: 220, reservado: 30 },
      { codEmp: "F003", codLocal: "01", disponivel: 160, reservado: 0 },
    ],
  },
  {
    codProd: "PRD-6612",
    descricao: "Fermento Biológico Seco 500g",
    unidade: "PC",
    linhaProduto: "Alimentos",
    precoBase: 34.9,
    precoMinimo: 31.0,
    estoques: [{ codEmp: "F002", codLocal: "01", disponivel: 340, reservado: 24 }],
  },
];

export const produtoPorCodigo = (codProd: string) =>
  produtosMock.find((p) => p.codProd === codProd);
