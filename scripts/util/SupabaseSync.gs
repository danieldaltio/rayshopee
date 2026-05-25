/**
 * ============================================================
 *  SupabaseSync.gs — Exporta Custos do Sheets para o Banco
 * ============================================================
 * 
 *  COMO USAR:
 *  1. Cole este código no seu Apps Script do Google Sheets
 *  2. Selecione a função "exportarCustosParaSupabase" no menu superior
 *  3. Clique em "Executar" (Run)
 *  4. Ele vai avisar quantos itens foram salvos no banco!
 */

// Chaves do seu banco de dados
var SUPABASE_URL = 'https://xcvazbfjkiddzlxwynni.supabase.co';
var SUPABASE_KEY = 'sb_publishable_RTWk8m9hY8S6KAhFBCY3rw_d9Kw3-Fw';

function exportarCustosParaSupabase() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Produtos");
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Aba 'Produtos' não encontrada.");
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  
  var headers = data[0];
  var colItemId = -1;
  var colModelId = -1;
  var colCusto = -1;
  
  // Procura dinamicamente as colunas pelo nome (ajuste os nomes se necessário)
  for (var c = 0; c < headers.length; c++) {
    var title = String(headers[c]).toLowerCase().trim();
    if (title === 'item id' || title === 'item_id') colItemId = c;
    if (title === 'model id' || title === 'model_id' || title === 'variation id') colModelId = c;
    if (title === 'custo' || title === 'custo (r$)') colCusto = c;
  }
  
  if (colItemId === -1 || colCusto === -1) {
    SpreadsheetApp.getUi().alert("Erro: Não achei a coluna 'Item ID' ou 'Custo' no cabeçalho (linha 1).");
    return;
  }
  
  var payloads = [];
  
  for (var i = 1; i < data.length; i++) {
    var itemId = data[i][colItemId];
    var modelId = colModelId !== -1 ? data[i][colModelId] : 0;
    var custo = parseFloat(data[i][colCusto]);
    
    // Filtro de segurança: Se o custo passar de 1 milhão, ele leu a coluna errada!
    if (itemId && !isNaN(custo) && custo > 0 && custo < 100000) {
      payloads.push({
        item_id: String(itemId),
        model_id: String(modelId || 0),
        cost: custo,
        // Valores genéricos para o banco aceitar a criação direta pelo Sheets!
        // O RayShopee vai atualizar esses dados com os reais depois automaticamente.
        name: 'Sincronizado via Google Sheets',
        shopee_price: 0,
        shopee_stock: 0
      });
    }
  }
  
  if (payloads.length === 0) {
    SpreadsheetApp.getUi().alert("Nenhum custo válido encontrado para exportar.");
    return;
  }

  // Volta a usar POST (Upsert) para CRIAR os itens que não existem
  var url = SUPABASE_URL + '/rest/v1/products?on_conflict=item_id,model_id';
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'resolution=merge-duplicates'
    },
    payload: JSON.stringify(payloads),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() === 200 || response.getResponseCode() === 201) {
    SpreadsheetApp.getUi().alert("Sucesso! " + payloads.length + " custos injetados no Supabase direto do Sheets!");
  } else {
    Logger.log(response.getContentText());
    SpreadsheetApp.getUi().alert("Erro ao exportar: " + response.getContentText());
  }
}
