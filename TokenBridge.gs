/**
 * ============================================================
 *  TokenBridge.gs — Ponte de Tokens entre Sheets e RayShopee
 * ============================================================
 *
 *  INSTRUÇÕES:
 *  1. Cole este código no seu projeto Google Apps Script
 *     (mesmo projeto do ShopeeManager.gs)
 *  2. Faça Deploy > New Deployment > Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  3. Copie a URL gerada e cole no .env do RayShopee:
 *     GOOGLE_TOKEN_BRIDGE_URL=https://script.google.com/macros/s/SEU_ID/exec
 *
 *  Isso permite que RayShopee e Google Sheets compartilhem
 *  o mesmo access_token automaticamente.
 * ============================================================
 */

// ── Web App Endpoints ──

/**
 * GET — Retorna os tokens atuais
 * Chamado pelo RayShopee para pegar o token mais recente
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'getTokens';

    if (action === 'getTokens') {
      var props = PropertiesService.getScriptProperties();
      var response = {
        accessToken: props.getProperty('SHOPEE_ACCESS_TOKEN') || '',
        refreshToken: props.getProperty('SHOPEE_REFRESH_TOKEN') || '',
        shopId: props.getProperty('SHOPEE_SHOP_ID') || '',
        expiresAt: props.getProperty('TOKEN_EXPIRES_AT') || '',
        updatedBy: props.getProperty('TOKEN_UPDATED_BY') || '',
        updatedAt: props.getProperty('TOKEN_UPDATED_AT') || '',
      };

      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST — Atualiza os tokens
 * Chamado pelo RayShopee ou Sheets após um refresh
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();

    if (data.accessToken) {
      props.setProperty('SHOPEE_ACCESS_TOKEN', data.accessToken);
    }
    if (data.refreshToken) {
      props.setProperty('SHOPEE_REFRESH_TOKEN', data.refreshToken);
    }
    if (data.shopId) {
      props.setProperty('SHOPEE_SHOP_ID', String(data.shopId));
    }
    if (data.expiresAt) {
      props.setProperty('TOKEN_EXPIRES_AT', String(data.expiresAt));
    }

    props.setProperty('TOKEN_UPDATED_BY', data.source || 'unknown');
    props.setProperty('TOKEN_UPDATED_AT', new Date().toISOString());

    Logger.log('TokenBridge: Tokens atualizados por ' + (data.source || 'unknown'));

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
//  Funções para uso interno no Google Apps Script
// ============================================================

/**
 * Salva tokens no PropertiesService (chamado após refresh no Sheets)
 * Use isso no ShopeeManager.gs após cada refresh de token
 */
function saveTokensToBridge(accessToken, refreshToken, expiresInSeconds) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SHOPEE_ACCESS_TOKEN', accessToken);
  props.setProperty('SHOPEE_REFRESH_TOKEN', refreshToken);
  props.setProperty('TOKEN_EXPIRES_AT', String(Date.now() + (expiresInSeconds || 14400) * 1000));
  props.setProperty('TOKEN_UPDATED_BY', 'google-sheets');
  props.setProperty('TOKEN_UPDATED_AT', new Date().toISOString());
  Logger.log('TokenBridge: Tokens salvos pelo Google Sheets');
}

/**
 * Lê os tokens mais recentes do PropertiesService
 * Use isso no ShopeeManager.gs antes de cada chamada API
 */
function getTokensFromBridge() {
  var props = PropertiesService.getScriptProperties();
  return {
    accessToken: props.getProperty('SHOPEE_ACCESS_TOKEN') || '',
    refreshToken: props.getProperty('SHOPEE_REFRESH_TOKEN') || '',
    shopId: props.getProperty('SHOPEE_SHOP_ID') || '',
    expiresAt: parseInt(props.getProperty('TOKEN_EXPIRES_AT') || '0'),
    updatedBy: props.getProperty('TOKEN_UPDATED_BY') || '',
    updatedAt: props.getProperty('TOKEN_UPDATED_AT') || '',
  };
}

/**
 * Inicializa a bridge com tokens atuais (rodar uma vez)
 * Preencha com seus tokens atuais antes de fazer o deploy
 */
function initializeBridge() {
  var props = PropertiesService.getScriptProperties();

  // Preencha aqui com seus tokens atuais (ou deixe vazio para autorizar via RayShopee)
  props.setProperties({
    'SHOPEE_ACCESS_TOKEN': '',
    'SHOPEE_REFRESH_TOKEN': '',
    'SHOPEE_SHOP_ID': '263124677',
    'TOKEN_EXPIRES_AT': '0',
    'TOKEN_UPDATED_BY': 'manual',
    'TOKEN_UPDATED_AT': new Date().toISOString(),
  });

  Logger.log('TokenBridge inicializada!');
}
