-- ============================================================
-- LIMPEZA DE DADOS OPERACIONAIS (deixar o sistema "zerado" para uso real)
-- ============================================================
-- ATENCAO: este script APAGA PERMANENTEMENTE todos os registros das
-- tabelas listadas abaixo. Nao ha como desfazer depois de rodar.
-- Faca um backup do banco antes de executar, se tiver duvida.
--
-- O QUE E APAGADO: clientes, orcamentos (e materiais/departamentos/
-- config de papelao ligados), produtos/estoque (e movimentacoes),
-- producoes (e materiais/etapas/imagens/links de compartilhamento),
-- pedidos/remessas/contas a receber, cliches, rotas de entrega,
-- residuos, estoque consignado, configuracoes de frete, pedidos de
-- compra, contas a pagar e fechamentos.
--
-- O QUE NAO E APAGADO (fica preservado):
--   - public.employees / public.teams / public.team_members
--     (login e cadastro de funcionarios/equipes)
--   - public.production_status_stages
--     (catalogo fixo das 5 etapas: Industria, Riscador, Corte,
--      Expedicao, Entrega)
--   - public.waste_price_settings
--     (preco por kg do residuo configurado por voce; se quiser
--      zerar tambem, descomente o UPDATE no final do arquivo)
--
-- Como rodar: psql "$DATABASE_URL" -f sql/20260901_reset_operational_data.sql
-- (ou cole o conteudo no console SQL do seu provedor de banco)
-- ============================================================

BEGIN;

TRUNCATE TABLE
  public.shipment_items,
  public.shipments,
  public.order_items,
  public.orders,
  public.accounts_receivable,
  public.budget_paperboard_configs,
  public.budget_expense_departments,
  public.budget_materials,
  public.budgets,
  public.expense_departments,
  public.production_order_materials,
  public.production_order_statuses,
  public.production_images,
  public.production_share_links,
  public.product_stock_movements,
  public.production_orders,
  public.products,
  public.clients,
  public.cliches,
  public.delivery_route_items,
  public.delivery_routes,
  public.waste_records,
  public.consigned_stock_movements,
  public.consigned_stock,
  public.freight_configs,
  public.purchase_order_items,
  public.purchase_orders,
  public.accounts_payable,
  public.fechamento
RESTART IDENTITY CASCADE;

-- Descomente as duas linhas abaixo se quiser tambem zerar o preco
-- do residuo configurado (volta para R$ 0,00 ate ser editado de novo):
-- UPDATE public.waste_price_settings
-- SET price_per_kg = 0, updated_at = NOW();

COMMIT;
