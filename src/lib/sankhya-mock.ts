export type PedidoStatus = "Confirmado" | "Pendente" | "Faturado" | "Cancelado";

export interface PedidoItem {
  id: string;
  codProd: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  descontoPct: number;
}

export interface Pedido {
  nunota: number;
  parceiro: string;
  codParc: string;
  codEmp: string;
  empresa: string;
  codTop: string;
  top: string;
  dtNeg: string; // ISO date
  status: PedidoStatus;
  vendedor: string;
  codCentroCusto: string;
  centroCusto: string;
  codNatureza: string;
  natureza: string;
  codTipoNegociacao: string;
  tipoNegociacao: string;
  dtFat?: string; // ISO date — faturamento
  chaveNfe?: string;
  observacao?: string;
  itens: PedidoItem[];
}

export const pedidosMock: Pedido[] = [
  {
    nunota: 100234,
    parceiro: "Comercial Aurora Ltda",
    codParc: "PARC-0421",
    codEmp: "M001",
    empresa: "Matriz - SP",
    codTop: "1010",
    top: "Venda de Mercadoria",
    codTipoNegociacao: "TN-01",
    tipoNegociacao: "Venda Interna",
    dtNeg: "2026-06-28",
    status: "Confirmado",
    vendedor: "Marina Costa",
    codCentroCusto: "CC-01",
    centroCusto: "Comercial SP",
    codNatureza: "1.01.001",
    natureza: "Receita de Venda",
    dtFat: "2026-07-01",
    chaveNfe: "35200601234567000192550010000012341000012345",
    observacao: "Entrega programada para o depósito central.",
    itens: [
      {
        id: "i1",
        codProd: "PRD-1001",
        descricao: "Cabo HDMI 2.1 Ultra HD 2m",
        unidade: "UN",
        quantidade: 20,
        precoUnitario: 49.9,
        descontoPct: 5,
      },
      {
        id: "i2",
        codProd: "PRD-1188",
        descricao: "Fonte ATX 650W 80 Plus Bronze",
        unidade: "UN",
        quantidade: 8,
        precoUnitario: 389.0,
        descontoPct: 0,
      },
      {
        id: "i3",
        codProd: "PRD-2340",
        descricao: "SSD NVMe 1TB Gen4",
        unidade: "UN",
        quantidade: 12,
        precoUnitario: 629.5,
        descontoPct: 7.5,
      },
    ],
  },
  {
    nunota: 100235,
    parceiro: "Indústria Norte Peças S/A",
    codParc: "PARC-0088",
    codEmp: "F002",
    empresa: "Filial - RJ",
    codTop: "1020",
    top: "Venda com Faturamento",
    codTipoNegociacao: "TN-02",
    tipoNegociacao: "Venda Externa",
    dtNeg: "2026-06-30",
    status: "Pendente",
    vendedor: "Rafael Menezes",
    codCentroCusto: "CC-02",
    centroCusto: "Comercial RJ",
    codNatureza: "1.01.002",
    natureza: "Venda Industrial",
    itens: [
      {
        id: "i1",
        codProd: "PRD-3301",
        descricao: "Rolamento SKF 6205-2Z",
        unidade: "UN",
        quantidade: 100,
        precoUnitario: 18.75,
        descontoPct: 3,
      },
      {
        id: "i2",
        codProd: "PRD-3311",
        descricao: "Correia dentada HTD 8M-1200",
        unidade: "UN",
        quantidade: 40,
        precoUnitario: 92.4,
        descontoPct: 0,
      },
    ],
  },
  {
    nunota: 100236,
    parceiro: "Distribuidora Sul Bebidas",
    codParc: "PARC-1120",
    codEmp: "F003",
    empresa: "Filial - RS",
    codTop: "1010",
    top: "Venda de Mercadoria",
    codTipoNegociacao: "TN-01",
    tipoNegociacao: "Venda Interna",
    dtNeg: "2026-07-01",
    status: "Faturado",
    vendedor: "Juliana Prado",
    codCentroCusto: "CC-03",
    centroCusto: "Comercial Sul",
    codNatureza: "1.01.001",
    natureza: "Receita de Venda",
    dtFat: "2026-07-03",
    chaveNfe: "43200612345678000192550010000056781000056789",
    itens: [
      {
        id: "i1",
        codProd: "PRD-5501",
        descricao: "Refrigerante Cola 2L PET",
        unidade: "CX",
        quantidade: 200,
        precoUnitario: 42.0,
        descontoPct: 4,
      },
      {
        id: "i2",
        codProd: "PRD-5510",
        descricao: "Água Mineral 500ml (fardo 12)",
        unidade: "FD",
        quantidade: 150,
        precoUnitario: 18.9,
        descontoPct: 2,
      },
      {
        id: "i3",
        codProd: "PRD-5522",
        descricao: "Suco Integral Uva 1L",
        unidade: "CX",
        quantidade: 60,
        precoUnitario: 71.5,
        descontoPct: 0,
      },
    ],
  },
  {
    nunota: 100237,
    parceiro: "Farma Bem Estar ME",
    codParc: "PARC-0777",
    codEmp: "M001",
    empresa: "Matriz - SP",
    codTop: "1030",
    top: "Venda para Consumidor Final",
    codTipoNegociacao: "TN-03",
    tipoNegociacao: "Venda Direta",
    dtNeg: "2026-07-02",
    status: "Cancelado",
    vendedor: "Marina Costa",
    codCentroCusto: "CC-01",
    centroCusto: "Comercial SP",
    codNatureza: "1.01.003",
    natureza: "Venda Consumidor Final",
    itens: [
      {
        id: "i1",
        codProd: "PRD-9001",
        descricao: "Kit Higienização Hospitalar",
        unidade: "KT",
        quantidade: 5,
        precoUnitario: 320.0,
        descontoPct: 10,
      },
    ],
  },
  {
    nunota: 100238,
    parceiro: "TechOne Soluções Ltda",
    codParc: "PARC-2200",
    codEmp: "M001",
    empresa: "Matriz - SP",
    codTop: "1010",
    top: "Venda de Mercadoria",
    codTipoNegociacao: "TN-04",
    tipoNegociacao: "Venda Corporativa",
    dtNeg: "2026-07-03",
    status: "Confirmado",
    vendedor: "Rafael Menezes",
    codCentroCusto: "CC-04",
    centroCusto: "Corporate",
    codNatureza: "1.01.001",
    natureza: "Receita de Venda",
    dtFat: "2026-07-06",
    itens: [
      {
        id: "i1",
        codProd: "PRD-4410",
        descricao: 'Notebook Corporate 14" i5',
        unidade: "UN",
        quantidade: 6,
        precoUnitario: 4890.0,
        descontoPct: 5,
      },
      {
        id: "i2",
        codProd: "PRD-4415",
        descricao: 'Monitor 27" QHD IPS',
        unidade: "UN",
        quantidade: 6,
        precoUnitario: 1720.0,
        descontoPct: 3,
      },
      {
        id: "i3",
        codProd: "PRD-4420",
        descricao: "Dock Station USB-C 100W",
        unidade: "UN",
        quantidade: 6,
        precoUnitario: 690.0,
        descontoPct: 0,
      },
      {
        id: "i4",
        codProd: "PRD-4425",
        descricao: "Headset Executivo Bluetooth",
        unidade: "UN",
        quantidade: 12,
        precoUnitario: 549.0,
        descontoPct: 8,
      },
    ],
  },
  {
    nunota: 100239,
    parceiro: "Padaria & Cia Alimentos",
    codParc: "PARC-3312",
    codEmp: "F004",
    empresa: "Filial - MG",
    codTop: "1010",
    top: "Venda de Mercadoria",
    codTipoNegociacao: "TN-01",
    tipoNegociacao: "Venda Interna",
    dtNeg: "2026-07-05",
    status: "Pendente",
    vendedor: "Juliana Prado",
    codCentroCusto: "CC-05",
    centroCusto: "Comercial MG",
    codNatureza: "1.01.001",
    natureza: "Receita de Venda",
    itens: [
      {
        id: "i1",
        codProd: "PRD-6601",
        descricao: "Farinha de Trigo Especial 25kg",
        unidade: "SC",
        quantidade: 30,
        precoUnitario: 128.0,
        descontoPct: 0,
      },
      {
        id: "i2",
        codProd: "PRD-6612",
        descricao: "Fermento Biológico Seco 500g",
        unidade: "PC",
        quantidade: 24,
        precoUnitario: 34.9,
        descontoPct: 5,
      },
    ],
  },
];

export function calcItemTotal(
  item: Pick<PedidoItem, "quantidade" | "precoUnitario" | "descontoPct">,
) {
  const bruto = item.quantidade * item.precoUnitario;
  return bruto * (1 - item.descontoPct / 100);
}

export function calcPedidoTotal(itens: PedidoItem[]) {
  return itens.reduce((acc, it) => acc + calcItemTotal(it), 0);
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");

/* TSIATA — Arquivos Anexados */
export interface DocumentoAnexado {
  nunota: number;
  sequencia: number;
  nomeArquivo: string;
  extensao: string;
  tamanhoBytes: number;
  usuario: string;
  dataHora: string; // ISO datetime
}

export const documentosMock: DocumentoAnexado[] = [
  {
    nunota: 100234,
    sequencia: 1,
    nomeArquivo: "Nota_Fiscal_100234",
    extensao: "pdf",
    tamanhoBytes: 245_760,
    usuario: "Marina Costa",
    dataHora: "2026-06-28T14:30:00",
  },
  {
    nunota: 100234,
    sequencia: 2,
    nomeArquivo: "Contrato_Assinado",
    extensao: "pdf",
    tamanhoBytes: 1_024_000,
    usuario: "Marina Costa",
    dataHora: "2026-06-29T09:15:00",
  },
  {
    nunota: 100234,
    sequencia: 3,
    nomeArquivo: "Comprovante_Entrega",
    extensao: "jpg",
    tamanhoBytes: 512_000,
    usuario: "Logística",
    dataHora: "2026-07-02T16:45:00",
  },
  {
    nunota: 100235,
    sequencia: 1,
    nomeArquivo: "Pedido_Cliente",
    extensao: "xlsx",
    tamanhoBytes: 180_224,
    usuario: "Rafael Menezes",
    dataHora: "2026-06-30T11:00:00",
  },
  {
    nunota: 100236,
    sequencia: 1,
    nomeArquivo: "Nota_Fiscal_100236",
    extensao: "pdf",
    tamanhoBytes: 310_000,
    usuario: "Juliana Prado",
    dataHora: "2026-07-01T08:20:00",
  },
  {
    nunota: 100238,
    sequencia: 1,
    nomeArquivo: "Proposta_Comercial",
    extensao: "pdf",
    tamanhoBytes: 890_000,
    usuario: "Rafael Menezes",
    dataHora: "2026-07-03T10:30:00",
  },
  {
    nunota: 100238,
    sequencia: 2,
    nomeArquivo: "Aprovacao_Diretor",
    extensao: "png",
    tamanhoBytes: 420_000,
    usuario: "Diretoria",
    dataHora: "2026-07-04T14:00:00",
  },
];

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR");

/* TSIRF — Transporte / Faturamento */
export type SituacaoTransporte = "A Faturar" | "Faturado" | "Em Transporte" | "Entregue";

export interface Transporte {
  nunota: number;
  transportadora: string;
  placa: string;
  volumes: number;
  pesoKg: number;
  dtEmbarque: string; // ISO date
  situacao: SituacaoTransporte;
}

export const transportesMock: Transporte[] = [
  {
    nunota: 100234,
    transportadora: "Expressa Logística SP",
    placa: "ABC-1J23",
    volumes: 3,
    pesoKg: 45.5,
    dtEmbarque: "2026-06-30",
    situacao: "Entregue",
  },
  {
    nunota: 100235,
    transportadora: "Transportadora Sul Ltda",
    placa: "DEF-4K56",
    volumes: 2,
    pesoKg: 28.0,
    dtEmbarque: "2026-07-02",
    situacao: "Em Transporte",
  },
  {
    nunota: 100236,
    transportadora: "Rápido Distribuidora RS",
    placa: "GHI-7L89",
    volumes: 8,
    pesoKg: 320.0,
    dtEmbarque: "2026-07-03",
    situacao: "Entregue",
  },
  {
    nunota: 100238,
    transportadora: "Logtech Corporate",
    placa: "JKL-0M12",
    volumes: 6,
    pesoKg: 95.0,
    dtEmbarque: "2026-07-05",
    situacao: "A Faturar",
  },
  {
    nunota: 100239,
    transportadora: "Transportadora MG Rápido",
    placa: "MNO-3N45",
    volumes: 4,
    pesoKg: 55.0,
    dtEmbarque: "2026-07-06",
    situacao: "A Faturar",
  },
];

/* Financeiro */
export type SituacaoFinanceiro = "Pago" | "Pendente" | "Vencido";

export interface TituloFinanceiro {
  nunota: number;
  parcela: number;
  valor: number;
  dtVencimento: string; // ISO date
  situacao: SituacaoFinanceiro;
  dtPagamento?: string; // ISO date
}

export const financeiroMock: TituloFinanceiro[] = [
  {
    nunota: 100234,
    parcela: 1,
    valor: 2549.4,
    dtVencimento: "2026-07-15",
    situacao: "Pago",
    dtPagamento: "2026-07-10",
  },
  { nunota: 100235, parcela: 1, valor: 2657.0, dtVencimento: "2026-07-20", situacao: "Pendente" },
  { nunota: 100235, parcela: 2, valor: 2657.0, dtVencimento: "2026-08-20", situacao: "Pendente" },
  {
    nunota: 100236,
    parcela: 1,
    valor: 10260.0,
    dtVencimento: "2026-07-10",
    situacao: "Pago",
    dtPagamento: "2026-07-08",
  },
  { nunota: 100236, parcela: 2, valor: 10260.0, dtVencimento: "2026-08-10", situacao: "Pendente" },
  { nunota: 100238, parcela: 1, valor: 44562.0, dtVencimento: "2026-07-25", situacao: "Pendente" },
  { nunota: 100239, parcela: 1, valor: 4677.6, dtVencimento: "2026-07-05", situacao: "Vencido" },
];
