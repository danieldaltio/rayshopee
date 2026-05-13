import { DistribuicaoDFe } from 'node-mde';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

let distribuicaoDFe = null;

export async function initSefazService() {
  const SEFAZ_CERT_PATH = process.env.SEFAZ_CERT_PATH;
  const SEFAZ_CERT_PASSWORD = process.env.SEFAZ_CERT_PASSWORD;
  const SEFAZ_CNPJ = process.env.SEFAZ_CNPJ;
  const SEFAZ_UF = String(process.env.SEFAZ_UF || '35');

  console.log('[SEFAZ] Verificando configuração...');
  console.log('[SEFAZ] CERT_PATH:', SEFAZ_CERT_PATH);
  console.log('[SEFAZ] CNPJ:', SEFAZ_CNPJ);
  console.log('[SEFAZ] UF:', SEFAZ_UF);

  if (!SEFAZ_CERT_PATH || !SEFAZ_CERT_PASSWORD || !SEFAZ_CNPJ) {
    console.warn('[SEFAZ] Certificado não configurado');
    return false;
  }

  try {
    const certBuffer = fs.readFileSync(SEFAZ_CERT_PATH);
    distribuicaoDFe = new DistribuicaoDFe({
      pfx: certBuffer,
      passphrase: SEFAZ_CERT_PASSWORD,
      cnpj: SEFAZ_CNPJ,
      cUFAutor: SEFAZ_UF,
      tpAmb: '1',
    });
    console.log('[SEFAZ] Serviço inicializado com CNPJ:', SEFAZ_CNPJ);
    return true;
  } catch (err) {
    console.error('[SEFAZ] Erro ao inicializar:', err.message);
    return false;
  }
}

export function isSefazConfigured() {
  return !!distribuicaoDFe;
}

export async function downloadXmlByAccessKey(accessKey) {
  if (!distribuicaoDFe) {
    return { success: false, error: 'SEFAZ não configurado', code: 'NOT_CONFIGURED' };
  }

  console.log(`[SEFAZ] Iniciando consultaChNFe para chave: ${accessKey}`);
  try {
    const result = await distribuicaoDFe.consultaChNFe(accessKey);
    const data = result?.data;
    
    if (data?.docZip?.[0]?.xml) {
      return { success: true, content: data.docZip[0].xml };
    }
    
    if (data?.cStat === '656') {
      return { success: false, error: 'Consumo Indevido (656). Aguarde alguns minutos.', code: '656' };
    }

    if (data?.cStat === '137') {
      return { success: false, error: 'Nenhum documento encontrado (137).', code: '137' };
    }

    return { 
      success: false, 
      error: data?.xMotivo || 'XML não encontrado na SEFAZ', 
      code: data?.cStat 
    };
  } catch (err) {
    console.warn('[SEFAZ] Erro ao baixar XML:', err.message);
    return { success: false, error: err.message, code: 'EXCEPTION' };
  }
}

export async function downloadAllXmlsFromCNPJ(timeFrom, timeTo) {
  if (!distribuicaoDFe) {
    throw new Error('SEFAZ não configurado');
  }

  const xmls = [];
  let ultNSU = '000000000000000';
  let hasMore = true;
  const maxIterations = 20;
  let iterations = 0;

  while (hasMore && iterations < maxIterations) {
    iterations++;
    try {
      const result = await distribuicaoDFe.consultaUltNSU(ultNSU);
      
      if (result?.data) {
        const ret = result.data;
        
        if (ret.cStat === '138' || ret.cStat === '137') {
          if (ret.docZip && ret.docZip.length > 0) {
            for (const doc of ret.docZip) {
              if (doc.xml) {
                xmls.push(doc.xml);
              }
            }
          }
          
          ultNSU = ret.ultNSU || ultNSU;
          hasMore = ret.maxNSU && ret.ultNSU < ret.maxNSU;
        } else if (ret.cStat === '139') {
          hasMore = false;
        } else {
          console.warn('[SEFAZ] Status:', ret.cStat, ret.xMotivo);
          hasMore = false;
        }
      }
    } catch (err) {
      console.error('[SEFAZ] Erro na distribuição:', err.message);
      hasMore = false;
    }
  }

  return xmls;
}

export async function findXmlByAccessKey(accessKey, timeFrom, timeTo) {
  if (!distribuicaoDFe) {
    throw new Error('SEFAZ não configurado');
  }

  let ultNSU = '000000000000000';
  let hasMore = true;
  const maxIterations = 50;
  let iterations = 0;

  while (hasMore && iterations < maxIterations) {
    iterations++;
    try {
      const result = await distribuicaoDFe.consultaUltNSU(ultNSU);
      
      if (result?.data) {
        const ret = result.data;
        
        if (ret.cStat === '138' || ret.cStat === '137') {
          if (ret.docZip && ret.docZip.length > 0) {
            for (const doc of ret.docZip) {
              if (doc.xml && doc.xml.includes(accessKey)) {
                return doc.xml;
              }
            }
          }
          
          ultNSU = ret.ultNSU || ultNSU;
          hasMore = ret.maxNSU && ret.ultNSU < ret.maxNSU;
        } else {
          hasMore = false;
        }
      }
    } catch (err) {
      console.error('[SEFAZ] Erro na busca:', err.message);
      hasMore = false;
    }
  }

  return null;
}

export async function downloadXmlFromSefaz(accessKey) {
  if (!distribuicaoDFe) {
    console.warn('[SEFAZ] Serviço não configurado, usando método antigo');
    return null;
  }

  console.log('[SEFAZ] Baixando XML para chave:', accessKey);
  
  try {
    const xml = await findXmlByAccessKey(accessKey);
    if (xml) {
      console.log('[SEFAZ] XML encontrado para:', accessKey);
      return xml;
    }
  } catch (err) {
    console.error('[SEFAZ] Erro:', err.message);
  }

  return null;
}

export async function getXmlsFromSefazByPeriod(timeFrom, timeTo) {
  if (!distribuicaoDFe) {
    console.warn('[SEFAZ] Serviço não configurado');
    return [];
  }

  console.log(`[SEFAZ] Buscando XMLs do período ${new Date(timeFrom * 1000).toISOString()} até ${new Date(timeTo * 1000).toISOString()}`);

  const xmlMap = new Map();
  let ultNSU = '000000000000000';
  let hasMore = true;
  const maxIterations = 50;
  let iterations = 0;

  while (hasMore && iterations < maxIterations) {
    iterations++;
    try {
      const result = await distribuicaoDFe.consultaUltNSU(ultNSU);
      
      if (result?.data) {
        const ret = result.data;
        
        if (ret.cStat === '138' || ret.cStat === '137') {
          if (ret.docZip && ret.docZip.length > 0) {
            for (const doc of ret.docZip) {
              if (doc.xml) {
                const decoded = doc.xml;
                const chaveMatch = decoded.match(/<chNFe>([^<]+)<\/chNFe>/);
                if (chaveMatch) {
                  const chave = chaveMatch[1];
                  const dhEmiMatch = decoded.match(/<dhEmi>([^<]+)<\/dhEmi>/);
                  let emitCnpj = '';
                  const emitMatch = decoded.match(/<CNPJ>([^<]+)<\/CNPJ>|<CPF>([^<]+)<\/CPF>/);
                  if (emitMatch) {
                    emitCnpj = emitMatch[1] || emitMatch[2] || '';
                  }
                  
                  xmlMap.set(chave, {
                    xml: decoded,
                    chave,
                    emitCnpj,
                    dhEmi: dhEmiMatch ? dhEmiMatch[1] : null
                  });
                }
              }
            }
          }
          
          ultNSU = ret.ultNSU || ultNSU;
          hasMore = ret.maxNSU && ret.ultNSU < ret.maxNSU;
        } else if (ret.cStat === '139') {
          hasMore = false;
        } else {
          console.warn('[SEFAZ] Status:', ret.cStat, ret.xMotivo);
          hasMore = false;
        }
      }
    } catch (err) {
      console.error('[SEFAZ] Erro na distribuição:', err.message);
      hasMore = false;
    }
  }

  console.log(`[SEFAZ] Total de XMLs encontrados: ${xmlMap.size}`);
  return Array.from(xmlMap.values());
}

export async function tryDownloadInvoice(orderSn, accessKey) {
  return downloadXmlByAccessKey(accessKey);
}