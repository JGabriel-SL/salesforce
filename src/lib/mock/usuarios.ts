import type { Usuario } from "./types";

/**
 * Personas de demonstração — cada uma evidencia um recorte de
 * segregação/permissão da Central de Certificação:
 *  - Marina: vendedora restrita à Matriz SP e às linhas Tecnologia/Industrial
 *  - Rafael: vendedor restrito à Filial RJ e às linhas Industrial/Alimentos
 *  - Carla:  gerente multiempresa, aprova liberações/Flow e fatura
 *  - Admin:  acesso total, inclusive configuração de limites
 */
export const usuariosMock: Usuario[] = [
  {
    id: "U001",
    nome: "Marina Costa",
    iniciais: "MC",
    cargo: "Vendedora — Matriz SP",
    email: "marina.costa@grupohl.com.br",
    perfil: {
      nome: "Vendedor Interno",
      empresasAutorizadas: ["M001"],
      linhasProdutoAutorizadas: ["Tecnologia", "Industrial"],
      locaisEstoqueBloqueados: ["09"],
      topsPermitidas: ["1010", "1020", "1030"],
      podeAprovarLiberacoes: false,
      podeAprovarFlow: false,
      podeConfigurarLimites: false,
      podeFaturar: true,
      cardsDashboard: ["retira", "flow", "agenda", "powerbi"],
    },
  },
  {
    id: "U002",
    nome: "Rafael Menezes",
    iniciais: "RM",
    cargo: "Vendedor — Filial RJ",
    email: "rafael.menezes@grupohl.com.br",
    perfil: {
      nome: "Vendedor Interno",
      empresasAutorizadas: ["F002"],
      linhasProdutoAutorizadas: ["Industrial", "Alimentos"],
      locaisEstoqueBloqueados: ["09"],
      topsPermitidas: ["1010", "1020", "1030"],
      podeAprovarLiberacoes: false,
      podeAprovarFlow: false,
      podeConfigurarLimites: false,
      podeFaturar: true,
      cardsDashboard: ["retira", "flow", "agenda", "powerbi"],
    },
  },
  {
    id: "U003",
    nome: "Carla Dias",
    iniciais: "CD",
    cargo: "Gerente Comercial",
    email: "carla.dias@grupohl.com.br",
    perfil: {
      nome: "Gerência Comercial",
      empresasAutorizadas: ["M001", "F002"],
      linhasProdutoAutorizadas: ["Tecnologia", "Industrial", "Alimentos"],
      locaisEstoqueBloqueados: [],
      topsPermitidas: ["1010", "1020", "1030", "1090"],
      podeAprovarLiberacoes: true,
      podeAprovarFlow: true,
      podeConfigurarLimites: false,
      podeFaturar: true,
      cardsDashboard: ["liberacoes", "flow", "retira", "powerbi"],
    },
  },
  {
    id: "U004",
    nome: "Administrador HL",
    iniciais: "HL",
    cargo: "Administrador do Portal",
    email: "admin@grupohl.com.br",
    perfil: {
      nome: "Administrador",
      empresasAutorizadas: ["M001", "F002", "F003"],
      linhasProdutoAutorizadas: ["Tecnologia", "Industrial", "Alimentos"],
      locaisEstoqueBloqueados: [],
      topsPermitidas: ["1010", "1020", "1030", "1090"],
      podeAprovarLiberacoes: true,
      podeAprovarFlow: true,
      podeConfigurarLimites: true,
      podeFaturar: true,
      cardsDashboard: ["liberacoes", "flow", "retira", "agenda", "powerbi"],
    },
  },
];
