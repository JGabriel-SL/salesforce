# Estimativa de Desenvolvimento — API de Integração Portal ↔ Sankhya

**Objetivo:** substituir a camada mock da POC por uma API real (BFF) que consome o ERP Sankhya, mantendo todas as telas e regras já demonstradas no portal.

## Premissas

- Integração via **API oficial Sankhya (Gateway)** com AppKey + Token e usuário de integração, usando os serviços MGE:
  - `DbExplorerSP.executeQuery` / `CRUDServiceProvider.loadRecords` — consultas (parceiros, produtos, estoque, documentos);
  - `CACSP.incluirNota` / `DatasetSP.save` — criação/alteração de orçamentos e itens;
  - `SelecaoDocumentoSP.faturar` — faturamento (orçamento → pedido/nota);
  - `LiberacaoSolicitadaSP` — eventos de liberação (liberar/recusar).
- **BFF (Backend for Frontend)** em Node.js/NestJS (ou .NET) entre o portal e o Sankhya — o front nunca fala direto com o gateway (segurança, cache, normalização, segregação).
- **1 desenvolvedor pleno/sênior dedicado**, com apoio pontual de consultor Sankhya para parametrizações (TOPs, impostos, Central de Certificação).
- Ambiente de **homologação Sankhya disponível** desde o início.
- Estimativas em **dias úteis**, técnica **PERT**: (Otimista + 4×Realista + Pessimista) ÷ 6.

## Estimativa por entrega

| # | Entrega | Tabelas/Serviços Sankhya | Otim. | Real. | Pess. | PERT |
|---|---------|--------------------------|------:|------:|------:|-----:|
| 1 | Fundação do BFF (projeto, auth do portal, conexão gateway, gestão de token, retry/erros, logs) | Gateway, login de integração | 4 | 6 | 9 | **6,2** |
| 2 | Autenticação + perfis/segregação (empresas, linhas, locais PCE, TOPs autorizadas) | TSIUSU, Central de Certificação | 4 | 5 | 8 | **5,3** |
| 3 | Parceiros (lista, ficha, matriz/filial, crédito, edição de limite) | TGFPAR, TGFCTT | 3 | 4 | 6 | **4,2** |
| 4 | Produtos, estoque por empresa/local e preços (tabela + preço mínimo) | TGFPRO, TGFEST, TGFTAB/TGFEXC | 3 | 5 | 7 | **5,0** |
| 5 | Documentos — consulta (filtros, status, NUNOTA/NUMNOTA, abas transporte/financeiro) | TGFCAB, TGFITE, TGFFIN | 3 | 4 | 6 | **4,2** |
| 6 | Documentos — escrita (criar orçamento pela TOP, itens, condição de pagamento c/ recálculo, duplicação) | CACSP.incluirNota, DatasetSP, TGFTPV | 6 | 9 | 13 | **9,2** |
| 7 | Eventos de liberação (fila, liberar/recusar com motivo) | TSILIB, LiberacaoSolicitadaSP | 3 | 5 | 7 | **5,0** |
| 8 | Faturamento (orçamento → pedido, reserva de estoque, NFe) | SelecaoDocumentoSP.faturar | 3 | 5 | 8 | **5,2** |
| 9 | Flow — cadastro de parceiros (workflow de aprovação) | Módulo Flow / tabelas próprias | 3 | 5 | 7 | **5,0** |
| 10 | Telemarketing e agenda | CRM / tabelas custom (AD_) | 2 | 3 | 5 | **3,2** |
| 11 | Relatórios e indicadores do dashboard | Queries agregadas (DbExplorer) | 2 | 3 | 5 | **3,2** |
| 12 | Transversal: cache, paginação, rate-limit do gateway, ambientes, CI/CD, observabilidade | Redis, pipeline | 3 | 5 | 8 | **5,2** |
| 13 | Adaptação do front-end (trocar stores mock por React Query + API, loading/erro) | Portal (TanStack) | 4 | 6 | 9 | **6,2** |
| 14 | Testes integrados, homologação com base do cliente e estabilização | — | 5 | 8 | 12 | **8,2** |
| | **TOTAL** | | **48** | **73** | **110** | **≈ 75** |

## Resumo executivo

| Cenário | Dias úteis | Calendário (1 dev) |
|---------|-----------:|--------------------|
| Otimista | 48 | ~10 semanas (2,2 meses) |
| **Realista (PERT)** | **75** | **~15 semanas (3,5 meses)** |
| Pessimista | 110 | ~22 semanas (5 meses) |
| Com 2 devs (back + front em paralelo, eficiência ~70%) | ~52 | **~10–11 semanas (2,5 meses)** |

**Distribuição do esforço (cenário PERT):**

| Categoria | Dias | % |
|-----------|-----:|---:|
| Integrações Sankhya (itens 2–11) | 49,5 | 66% |
| Fundação e infraestrutura (1, 12) | 11,4 | 15% |
| Adaptação do front-end (13) | 6,2 | 8% |
| Testes e homologação (14) | 8,2 | 11% |

## Faseamento recomendado (entrega de valor incremental)

| Fase | Escopo | Duração (1 dev) | Resultado |
|------|--------|-----------------|-----------|
| **F1 — Modo consulta** | Itens 1–5 + 11 + parte do 13 | ~5–6 semanas | Portal já navegável com dados reais (login, parceiros, produtos, documentos, dashboard) |
| **F2 — Modo operação** | Itens 6–8 + parte do 13 | ~4–5 semanas | Criar orçamento, liberar eventos e faturar de verdade |
| **F3 — Complementos** | Itens 9, 10, 12, 14 | ~3–4 semanas | Flow, telemarketing, hardening e homologação final |

## Principais riscos (o que puxa para o cenário pessimista)

1. **Parametrização do ERP do cliente** — TOPs, impostos e Central de Certificação mal parametrizados fazem o `incluirNota` rejeitar documentos (item 6 é o mais sensível).
2. **Customizações existentes** (campos `AD_`, gatilhos, personalizações) que mudam o payload esperado.
3. **Limites do gateway** — rate limit e latência exigem cache e filas para telas de listagem.
4. **Disponibilidade do ambiente de homologação** e de um usuário de integração com as permissões corretas.
5. **Regras de negócio divergentes** entre o levantado no PDF e o comportamento real do ERP (descoberta tardia em homologação).

---
*Estimativa elaborada a partir do escopo funcional já implementado na POC (11 telas, 8 eventos de liberação, regras de orçamento/pedido do levantamento do Grupo HL).*
