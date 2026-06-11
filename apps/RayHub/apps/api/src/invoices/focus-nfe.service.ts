/**
 * FocusNfeService — Adapter para a API da Focus NFe
 * 
 * Responsável por:
 * 1. Montar o payload da NF-e com dados fiscais dinâmicos (CFOP, CST, PIS/COFINS)
 * 2. Enviar à SEFAZ via API da Focus NFe
 * 3. Fazer polling do status até autorização ou rejeição
 * 
 * Base legal: Manual de Orientação do Contribuinte (MOC) NF-e v7.0
 * Integração: https://focusnfe.com.br/doc/
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { determineCfopVenda } from '../common/fiscal/cfop-router';
import { selectCst, parseRegimeTributario } from '../common/fiscal/cst-selector';

@Injectable()
export class FocusNfeService {
  private readonly apiUrl: string;
  private readonly token: string | undefined;
  /** Flag explícita para permitir mock em caso de erro (apenas homologação) */
  private readonly allowMockOnError: boolean;

  constructor() {
    const ambiente = process.env.NFE_AMBIENTE || 'homologacao';
    this.apiUrl = ambiente === 'producao'
      ? 'https://api.focusnfe.com.br/v2/nfe'
      : 'https://homologacao.focusnfe.com.br/v2/nfe';
    this.token = process.env.FOCUS_NFE_TOKEN;
    // Só permite mock se explicitamente habilitado via env — nunca ativa por padrão
    this.allowMockOnError = process.env.NFE_ALLOW_MOCK_ON_ERROR === 'true';
  }

  private getHeaders() {
    if (!this.token) {
      console.warn('[FocusNfe] ATENÇÃO: FOCUS_NFE_TOKEN não está definido no .env');
    }
    return {
      Authorization: `Basic ${Buffer.from(this.token + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    };
  }

  async createNfe(order: any, company: any) {
    if (!this.token) {
      throw new InternalServerErrorException('Token da Focus NFe não configurado no .env (FOCUS_NFE_TOKEN).');
    }

    if (!company) {
      throw new InternalServerErrorException('Dados da empresa emissora não configurados no RayHub.');
    }

    const payload = this.buildFocusPayload(order, company);
    const ref = `RAYHUB_${order.id}`;

    try {
      console.log(`[FocusNfe] Enviando NF-e ref ${ref} para a Sefaz...`);
      console.log(`[FocusNfe] CNPJ emitente: ${payload.emitente.cnpj} | UF: ${payload.emitente.uf}`);
      console.log(`[FocusNfe] Regime: ${payload.emitente.regime_tributario} | Itens: ${payload.itens.length}`);

      const response = await axios.post(`${this.apiUrl}?ref=${ref}`, payload, {
        headers: this.getHeaders(),
      });

      console.log(`[FocusNfe] Resposta inicial de envio:`, response.data);
      return await this.pollNfeStatus(ref);
    } catch (error: any) {
      console.error(`[FocusNfe] Erro ao enviar NF-e:`, error.response?.data || error.message);

      const errorMessage = error.response?.data?.erros
        ? JSON.stringify(error.response.data.erros)
        : error.message;

      // Mock controlado: só se a flag NFE_ALLOW_MOCK_ON_ERROR=true está no .env
      if (this.allowMockOnError && error.response?.status) {
        console.warn(`[FocusNfe] ⚠️ NFE_ALLOW_MOCK_ON_ERROR=true — Simulando emissão para testes.`);
        return {
          chave_nfe: `43260644156548000109550010000000011${Math.floor(100000000 + Math.random() * 900000000)}`,
          caminho_xml_nota_fiscal: `https://homologacao.focusnfe.com.br/v2/nfe/${ref}.xml`,
          caminho_danfe: `https://homologacao.focusnfe.com.br/v2/nfe/${ref}.pdf`,
          status: 'autorizado',
          mensagem_sefaz: '[MOCK] Autorizado o uso da NF-e (simulação)',
        };
      }

      throw new InternalServerErrorException(`Focus NFe Rejeição: ${errorMessage}`);
    }
  }

  /**
   * Cancela uma NF-e autorizada na SEFAZ.
   * Prazo legal: até 24 horas após a autorização (Art. 20 do Ajuste SINIEF 07/05).
   */
  async cancelNfe(ref: string, justificativa: string): Promise<any> {
    if (!this.token) {
      throw new InternalServerErrorException('Token da Focus NFe não configurado.');
    }

    if (!justificativa || justificativa.trim().length < 15) {
      throw new InternalServerErrorException(
        'Justificativa de cancelamento deve ter no mínimo 15 caracteres (exigência SEFAZ).',
      );
    }

    try {
      console.log(`[FocusNfe] Cancelando NF-e ref ${ref}...`);
      const response = await axios.delete(`${this.apiUrl}/${ref}`, {
        headers: this.getHeaders(),
        data: { justificativa: justificativa.trim() },
      });

      console.log(`[FocusNfe] Resposta de cancelamento:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[FocusNfe] Erro ao cancelar NF-e:`, error.response?.data || error.message);
      const errorMessage = error.response?.data?.erros
        ? JSON.stringify(error.response.data.erros)
        : error.message;
      throw new InternalServerErrorException(`Erro ao cancelar NF-e: ${errorMessage}`);
    }
  }

  private async pollNfeStatus(ref: string, maxRetries = 5, delayMs = 2000): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      await new Promise((res) => setTimeout(res, delayMs));

      try {
        const response = await axios.get(`${this.apiUrl}/${ref}`, {
          headers: this.getHeaders(),
        });

        const status = response.data.status;
        console.log(`[FocusNfe] Polling status para ${ref}: ${status} (tentativa ${i + 1}/${maxRetries})`);

        if (status === 'autorizado') {
          return response.data;
        }

        if (status === 'erro_autorizacao') {
          throw new InternalServerErrorException(`SEFAZ Rejeitou a nota: ${JSON.stringify(response.data.erros)}`);
        }

        if (status === 'denegado') {
          throw new InternalServerErrorException(`SEFAZ Denegou a nota (Irregularidade fiscal)`);
        }
      } catch (error: any) {
        if (error instanceof InternalServerErrorException) {
          throw error;
        }
        console.warn(`[FocusNfe] Erro de rede no polling, tentando novamente...`, error.message);
      }
    }

    throw new InternalServerErrorException(`Tempo esgotado aguardando o processamento da NF-e na Sefaz.`);
  }

  /**
   * Monta o payload da NF-e com dados fiscais dinâmicos.
   * Agora usa:
   * - CFOP automático baseado em UF origem/destino
   * - CST/CSOSN automático baseado no regime tributário
   * - PIS/COFINS automáticos
   */
  private buildFocusPayload(order: any, company: any) {
    // Determina o regime tributário da empresa
    const regime = parseRegimeTributario(company.regime_tributario);

    // Determina CST/CSOSN global (pode ser overridden por produto)
    const cstGlobal = selectCst({
      regime,
      cstOverride: company.cst_csosn_padrao || undefined,
    });

    // UF do emitente
    const ufOrigem = (company.endereco_uf || 'SP').toUpperCase();
    // UF do destinatário
    const ufDestino = (order.customer.endereco_uf || ufOrigem).toUpperCase();

    return {
      natureza_operacao: 'VENDA DE MERCADORIA',
      data_emissao: new Date().toISOString(),
      tipo_documento: 1,       // 1 = Saída
      local_destino: ufOrigem === ufDestino ? 1 : 2, // 1 = Interna, 2 = Interestadual
      finalidade_emissao: 1,   // 1 = Normal
      consumidor_final: 1,     // 1 = Sim (e-commerce é sempre consumidor final)
      presenca_comprador: 2,   // 2 = Internet
      notas_referenciadas: [],
      emitente: {
        cnpj: (company.cnpj || '').replace(/\D/g, ''),
        nome: company.razao_social || 'Empresa não configurada',
        nome_fantasia: company.nome_fantasia || company.razao_social || 'Empresa não configurada',
        logradouro: company.endereco_rua || 'Rua não informada',
        numero: company.endereco_numero || 'S/N',
        bairro: company.endereco_bairro || 'Centro',
        municipio: company.endereco_cidade || 'São Paulo',
        uf: ufOrigem,
        cep: (company.endereco_cep || '01000000').replace(/\D/g, ''),
        inscricao_estadual: company.ie || 'ISENTO',
        regime_tributario: cstGlobal.crt,
      },
      destinatario: {
        nome: order.customer.name,
        cpf: order.customer.cpf_cnpj
          ? order.customer.cpf_cnpj.replace(/\D/g, '')
          : undefined,
        logradouro: order.customer.endereco_rua || 'Rua sem nome',
        numero: order.customer.endereco_numero || 'S/N',
        bairro: order.customer.endereco_bairro || 'Centro',
        municipio: order.customer.endereco_cidade || 'São Paulo',
        uf: ufDestino,
        cep: order.customer.endereco_cep
          ? order.customer.endereco_cep.replace(/\D/g, '')
          : '01000000',
        indicador_inscricao_estadual: 9, // 9 = Não Contribuinte
      },
      itens: order.items.map((item: any, index: number) => {
        // CFOP dinâmico por item (baseado em UF e ST do produto)
        const cfopResult = determineCfopVenda(
          ufOrigem,
          ufDestino,
          !!item.product?.cst_csosn?.includes('500') || !!item.product?.cst_csosn?.includes('60'),
        );

        // CST/CSOSN por produto (override do produto ou global)
        const itemCst = selectCst({
          regime,
          cstOverride: item.product?.cst_csosn || company.cst_csosn_padrao || undefined,
        });

        return {
          numero_item: index + 1,
          codigo_produto: item.product?.sku || `ITEM-${item.product_id?.substring(0, 6) || index}`,
          descricao: item.product?.name || 'Produto Diverso',
          ncm: item.product?.ncm || '61091000',
          cfop: item.product?.cfop || cfopResult.cfop,
          unidade_comercial: item.product?.unidade || 'UN',
          quantidade_comercial: item.quantidade,
          valor_unitario_comercial: Number(item.preco_unitario),
          valor_bruto: Number(item.subtotal),
          unidade_tributavel: item.product?.unidade || 'UN',
          quantidade_tributavel: item.quantidade,
          valor_unitario_tributavel: Number(item.preco_unitario),
          icms_origem: itemCst.icmsOrigem,
          icms_situacao_tributaria: itemCst.icmsSituacaoTributaria,
          pis_situacao_tributaria: itemCst.pisSituacaoTributaria,
          cofins_situacao_tributaria: itemCst.cofinsSituacaoTributaria,
        };
      }),
      valor_frete: Number(order.frete || 0),
      valor_desconto: Number(order.desconto || 0),
      valor_total: Number(order.total),
      pagamentos: [
        {
          forma_pagamento: '99', // 99 = Outros (Marketplace)
          valor_pagamento: Number(order.total),
        },
      ],
    };
  }
}
