/**
 * ============================================================
 *  SupabaseAutoSync.gs — Salva custo no banco automaticamente!
 * ============================================================
 * 
 * COMO USAR:
 * 1. Cole este código no seu Google Apps Script (pode ser no mesmo 
 *    arquivo do SupabaseSync.gs, ou em um novo, tanto faz).
 * 2. SALVE o projeto (Ctrl + S).
 * 3. Pronto! Não precisa clicar em executar. Toda vez que você
 *    digitar um custo e der "Enter" na planilha, ele vai pro banco.
 */

function onEdit(e) {
  // Verifica se o objeto de evento existe e se a aba é a "Produtos"
  if (!e || !e.source) return;
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== "Produtos") return;
  
  // Pega a linha e a coluna da célula que você acabou de editar
  var editedRow = e.range.getRow();
  var editedCol = e.range.getColumn();
  
  // Não faz nada se a edição foi no cabeçalho (linha 1)
  if (editedRow === 1) return;
  
  // Encontra dinamicamente em qual coluna estão o Item ID, Model ID e Custo
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colItemId = -1, colModelId = -1, colCusto = -1;
  
  for (var c = 0; c < headers.length; c++) {
    var title = String(headers[c]).toLowerCase().trim();
    // Atenção: no Google Sheets as colunas começam no 1, e não no 0. Por isso o +1.
    if (title === 'item id' || title === 'item_id') colItemId = c + 1;
    if (title === 'model id' || title === 'model_id' || title === 'variation id') colModelId = c + 1;
    if (title === 'custo' || title === 'custo (r$)') colCusto = c + 1;
  }
  
  // Se não achou as colunas essenciais ou se a coluna editada NÃO foi a do Custo, para por aqui.
  if (colItemId === -1 || colCusto === -1) return;
  if (editedCol !== colCusto) return;
  
  // Pega o valor que você acabou de digitar
  // Se você apagou a célula, e.value vem como undefined
  var custoValue = parseFloat(e.value);
  if (isNaN(custoValue) || custoValue < 0) return;
  
  // Pega o Item ID e Model ID daquela mesma linha
  var itemId = sheet.getRange(editedRow, colItemId).getValue();
  var modelId = colModelId !== -1 ? sheet.getRange(editedRow, colModelId).getValue() : 0;
  
  if (!itemId) return; // Se a linha tá vazia sem ID de produto, ignora
  
  // Tudo certo! Dispara a atualização para a nuvem de forma invisível.
  enviarCustoEmTempoReal(itemId, modelId, custoValue);
}

function enviarCustoEmTempoReal(itemId, modelId, custo) {
  var SUPABASE_URL = 'https://xcvazbfjkiddzlxwynni.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_RTWk8m9hY8S6KAhFBCY3rw_d9Kw3-Fw';
  
  var url = SUPABASE_URL + '/rest/v1/products?on_conflict=item_id,model_id';
  
  var payload = [{
    item_id: String(itemId),
    model_id: String(modelId || 0),
    cost: custo,
    name: 'Sincronizado Auto via Google Sheets',
    shopee_price: 0,
    shopee_stock: 0
  }];
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'resolution=merge-duplicates'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  // Envia a requisição sem travar a planilha
  UrlFetchApp.fetch(url, options);
}
