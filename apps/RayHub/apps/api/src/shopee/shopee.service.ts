import { Inject, Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ShopeeService {
  private readonly partnerId: number;
  private readonly partnerKey: string;
  private readonly redirectUrl: string;
  private readonly baseUrl: string;

  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    this.partnerId = parseInt(process.env.SHOPEE_PARTNER_ID || '0', 10);
    this.partnerKey = process.env.SHOPEE_PARTNER_KEY || '';
    this.redirectUrl = process.env.SHOPEE_REDIRECT_URL || 'https://unpaining-transcriptionally-patrick.ngrok-free.dev/api/auth/callback';
    // Production: https://partner.shopeemobile.com | Sandbox: https://partner.test-stable.shopeemobile.com
    this.baseUrl = process.env.SHOPEE_BASE_URL || 'https://partner.shopeemobile.com';
  }

  /**
   * Generates HMAC-SHA256 signature required by all Shopee API calls.
   */
  private sign(baseString: string): string {
    return createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex');
  }

  /**
   * Returns the Shopee authorization URL to redirect the merchant to.
   * The merchant logs in and grants permissions, then Shopee calls our callback URL.
   */
  getAuthUrl(): string {
    const timest = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const baseString = `${this.partnerId}${path}${timest}`;
    const sign = this.sign(baseString);

    const params = new URLSearchParams({
      partner_id: this.partnerId.toString(),
      timestamp: timest.toString(),
      sign,
      redirect: this.redirectUrl,
    });

    return `${this.baseUrl}${path}?${params.toString()}`;
  }

  /**
   * Exchanges the authorization code for an access_token and refresh_token.
   * Called in the OAuth callback after merchant authorizes our app.
   */
  async getAccessToken(code: string, shopId: number): Promise<{
    access_token: string;
    refresh_token: string;
    expire_in: number;
  }> {
    const timest = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/token/get';
    const baseString = `${this.partnerId}${path}${timest}`;
    const sign = this.sign(baseString);

    const response = await axios.post(
      `${this.baseUrl}${path}`,
      {
        code,
        shop_id: shopId,
        partner_id: this.partnerId,
      },
      {
        params: {
          partner_id: this.partnerId,
          timestamp: timest,
          sign,
        },
      },
    );

    return response.data;
  }

  /**
   * Saves the Shopee tokens to the first Company record.
   * In the future, this will be scoped per user.
   */
  async saveTokens(
    shopId: number,
    accessToken: string,
    refreshToken: string,
    expireIn: number,
  ) {
    const company = await this.prisma.company.findFirst();
    if (!company) return;

    const expiresAt = new Date(Date.now() + expireIn * 1000);

    return this.prisma.company.update({
      where: { id: company.id },
      data: {
        shopee_shop_id: shopId.toString(),
        shopee_access_token: accessToken,
        shopee_refresh_token: refreshToken,
        shopee_token_expires_at: expiresAt,
      },
    });
  }

  /**
   * Refreshes the access token using the refresh_token.
   */
  async refreshAccessToken(shopId: number, refreshToken: string) {
    const timest = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/access_token/get';
    const baseString = `${this.partnerId}${path}${timest}`;
    const sign = this.sign(baseString);

    const response = await axios.post(
      `${this.baseUrl}${path}`,
      {
        shop_id: shopId,
        refresh_token: refreshToken,
        partner_id: this.partnerId,
      },
      {
        params: {
          partner_id: this.partnerId,
          timestamp: timest,
          sign,
        },
      },
    );

    if (response.data.error) {
      throw new Error(`Refresh Error: ${response.data.error}`);
    }

    await this.saveTokens(
      shopId,
      response.data.access_token,
      response.data.refresh_token,
      response.data.expire_in
    );

    return response.data;
  }

  /**
   * Checks if the current Shopee integration is active. Auto-refreshes if needed.
   */
  async getIntegrationStatus() {
    const company = await this.prisma.company.findFirst({
      select: {
        shopee_shop_id: true,
        shopee_access_token: true,
        shopee_refresh_token: true,
        shopee_token_expires_at: true,
      },
    });

    if (!company?.shopee_access_token || !company?.shopee_shop_id) {
      return { connected: false };
    }

    const isExpired = company.shopee_token_expires_at
      ? new Date() > company.shopee_token_expires_at
      : true;

    if (isExpired && company.shopee_refresh_token) {
      try {
        await this.refreshAccessToken(Number(company.shopee_shop_id), company.shopee_refresh_token);
        // Refresh sucessful, we are connected again!
        return { connected: true, shopId: company.shopee_shop_id };
      } catch (err) {
        console.error('Failed to auto-refresh Shopee token:', err);
        return { connected: false };
      }
    }

    return {
      connected: !isExpired,
      shopId: company.shopee_shop_id,
      expiresAt: company.shopee_token_expires_at,
    };
  }

  /**
   * Helper to make authenticated requests to Shopee Business APIs.
   * Business APIs require access_token and shop_id in the signature base string.
   */
  async requestBusinessApi(method: 'get' | 'post', path: string, params: any = {}, body: any = {}) {
    const status = await this.getIntegrationStatus();
    if (!status.connected) {
      throw new Error('Shopee is not connected or token expired');
    }

    const company = await this.prisma.company.findFirst();
    const accessToken = company!.shopee_access_token;
    const shopId = Number(company!.shopee_shop_id);

    const timest = Math.floor(Date.now() / 1000);
    // Base string for business APIs: partner_id + api_path + timestamp + access_token + shop_id
    const baseString = `${this.partnerId}${path}${timest}${accessToken}${shopId}`;
    const sign = this.sign(baseString);

    const commonParams = {
      partner_id: this.partnerId,
      timestamp: timest,
      access_token: accessToken,
      shop_id: shopId,
      sign,
    };

    const finalParams = { ...commonParams, ...params };

    const url = `${this.baseUrl}${path}`;
    const response = await axios({
      method,
      url,
      params: finalParams,
      data: method === 'post' ? body : undefined,
    });

    if (response.data.error) {
      throw new Error(`Shopee API Error: ${response.data.error} - ${response.data.message}`);
    }

    return response.data;
  }

  /**
   * Fetches all products from Shopee and saves/updates them in the database.
   */
  async syncProducts() {
    let offset = 0;
    const pageSize = 50; // max 50 for get_item_list
    let hasMore = true;
    let allItemIds: number[] = [];

    // 1. Fetch all item IDs
    while (hasMore) {
      const response = await this.requestBusinessApi('get', '/api/v2/product/get_item_list', {
        offset,
        page_size: pageSize,
        item_status: 'NORMAL',
      });

      const items = response.response?.item || [];
      const itemIds = items.map((i: any) => i.item_id);
      allItemIds = allItemIds.concat(itemIds);

      hasMore = response.response?.has_next_page || false;
      offset = response.response?.next_offset || (offset + pageSize);

      // Safety break to prevent infinite loop (max 10000 items)
      if (allItemIds.length >= 10000) break;
    }

    if (allItemIds.length === 0) return 0;

    // 2. Fetch detailed info in chunks of 50
    let syncedCount = 0;
    for (let i = 0; i < allItemIds.length; i += 50) {
      const chunkIds = allItemIds.slice(i, i + 50);
      const response = await this.requestBusinessApi('get', '/api/v2/product/get_item_base_info', {
        item_id_list: chunkIds.join(','),
      });

      const items = response.response?.item_list || [];

      // 3. Upsert items to Prisma
      for (const item of items) {
        const price = item.price_info?.[0]?.original_price || 0;
        const stock = item.stock_info?.[0]?.normal_stock || 0;
        const sku = item.item_sku || item.item_id.toString();

        await this.prisma.products.upsert({
          where: {
            item_id_model_id: {
              item_id: BigInt(item.item_id),
              model_id: 0n,
            },
          },
          update: {
            name: item.item_name,
            sku: sku,
            shopee_price: price,
            shopee_stock: stock,
            is_active: item.item_status === 'NORMAL',
            // Do not override local 'cost' if it exists
          },
          create: {
            item_id: BigInt(item.item_id),
            model_id: 0n,
            name: item.item_name,
            sku: sku,
            shopee_price: price,
            shopee_stock: stock,
            cost: 0,
            ncm: '', // Shopee might not provide NCM by default
            is_active: item.item_status === 'NORMAL',
          },
        });
        syncedCount++;
      }
    }

    return syncedCount;
  }

  /**
   * Fetches orders from the last 15 days from Shopee and saves them in the database.
   */
  async syncOrders() {
    console.log('[syncOrders] Iniciando...');
    const timeTo = Math.floor(Date.now() / 1000);
    const timeFrom = timeTo - 15 * 24 * 60 * 60; // 15 days ago
    let cursor = '';
    let hasMore = true;
    let allOrderSns: string[] = [];

    // 1. Fetch Order SNs
    console.log('[syncOrders] Fase 1: Buscando IDs de pedidos...');
    while (hasMore) {
      console.log(`[syncOrders] GET /api/v2/order/get_order_list (cursor: "${cursor}")`);
      const response = await this.requestBusinessApi('get', '/api/v2/order/get_order_list', {
        time_range_field: 'create_time',
        time_from: timeFrom,
        time_to: timeTo,
        page_size: 50,
        cursor: cursor || undefined,
      });

      const orders = response.response?.order_list || [];
      const sns = orders.map((o: any) => o.order_sn);
      allOrderSns = allOrderSns.concat(sns);
      console.log(`[syncOrders] Encontrados ${orders.length} pedidos nesta página. Total acumulado: ${allOrderSns.length}`);

      hasMore = response.response?.more || false;
      const nextCursor = response.response?.next_cursor || '';

      if (cursor === nextCursor || !nextCursor) {
        console.log('[syncOrders] Quebrando loop da Shopee (cursor igual ou vazio).');
        break; // Shopee bug prevention: cursor didn't advance or is empty
      }
      cursor = nextCursor;

      if (allOrderSns.length >= 10000) {
        console.log('[syncOrders] Limite de segurança de 10000 atingido. Interrompendo busca.');
        break;
      }
    }

    console.log(`[syncOrders] Fase 1 Concluída. Total de Pedidos: ${allOrderSns.length}`);
    if (allOrderSns.length === 0) return 0;

    // 2. Fetch Order Details in chunks of 50
    console.log('[syncOrders] Fase 2: Buscando detalhes e salvando no banco...');
    let syncedCount = 0;
    for (let i = 0; i < allOrderSns.length; i += 50) {
      const chunkSns = allOrderSns.slice(i, i + 50);
      console.log(`[syncOrders] Buscando detalhes do lote ${i} a ${i + chunkSns.length}...`);
      
      const response = await this.requestBusinessApi('get', '/api/v2/order/get_order_detail', {
        order_sn_list: chunkSns.join(','),
        response_optional_fields: 'buyer_user_id,buyer_username,estimated_shipping_fee,recipient_address,item_list,total_amount',
      });

      const orderDetails = response.response?.order_list || [];
      console.log(`[syncOrders] Retornados detalhes de ${orderDetails.length} pedidos. Salvando no Prisma...`);

      // 3. Upsert to database via Prisma Transaction
      for (const shopeeOrder of orderDetails) {
        await this.prisma.$transaction(async (tx) => {
          // 1. Find or create Customer
          let customer = await tx.customer.findFirst({
            where: { shopee_buyer_username: shopeeOrder.buyer_username }
          });

          if (!customer) {
            customer = await tx.customer.create({
              data: {
                name: shopeeOrder.recipient_address?.name || shopeeOrder.buyer_username || 'Cliente Shopee',
                shopee_buyer_username: shopeeOrder.buyer_username,
                endereco_rua: shopeeOrder.recipient_address?.full_address,
                endereco_cep: shopeeOrder.recipient_address?.zipcode,
                endereco_cidade: shopeeOrder.recipient_address?.city,
                endereco_uf: shopeeOrder.recipient_address?.state,
              }
            });
          }

          // 2. Map Status and Calculate Totals
          const statusMap: any = {
            UNPAID: 'Pendente',
            READY_TO_SHIP: 'Aprovado',
            RETRY_SHIP: 'Aprovado',
            SHIPPED: 'Enviado',
            TO_CONFIRM_RECEIVE: 'Enviado',
            IN_CANCEL: 'Cancelado',
            CANCELLED: 'Cancelado',
            TO_RETURN: 'Devolvido',
            COMPLETED: 'Concluído',
          };
          const mappedStatus = statusMap[shopeeOrder.order_status] || shopeeOrder.order_status;

          const subtotal = shopeeOrder.item_list?.reduce((acc: number, item: any) => acc + (item.model_discounted_price * item.model_quantity_purchased), 0) || 0;
          const frete = shopeeOrder.estimated_shipping_fee || 0;
          const total = shopeeOrder.total_amount || (subtotal + frete);
          const dataPedido = new Date(shopeeOrder.create_time * 1000);

          // 3. Upsert Order
          const order = await tx.order.upsert({
            where: { shopee_order_sn: shopeeOrder.order_sn },
            update: {
              status: mappedStatus,
              shopee_status: shopeeOrder.order_status,
              subtotal: subtotal,
              frete: frete,
              total: total,
            },
            create: {
              shopee_order_sn: shopeeOrder.order_sn,
              status: mappedStatus,
              shopee_status: shopeeOrder.order_status,
              canal: 'shopee',
              customer_id: customer.id,
              subtotal: subtotal,
              frete: frete,
              total: total,
              data_pedido: dataPedido,
            }
          });

          // 4. Update Order Items
          await tx.orderItem.deleteMany({
            where: { order_id: order.id }
          });

          for (const sItem of shopeeOrder.item_list || []) {
            let localProduct = await tx.products.findUnique({
              where: {
                item_id_model_id: {
                  item_id: BigInt(sItem.item_id),
                  model_id: BigInt(sItem.model_id || 0),
                }
              }
            });

            if (!localProduct && sItem.item_sku) {
               localProduct = await tx.products.findFirst({ where: { sku: sItem.item_sku } });
            }

            if (localProduct) {
              await tx.orderItem.create({
                data: {
                  order_id: order.id,
                  product_id: localProduct.id,
                  quantidade: sItem.model_quantity_purchased,
                  preco_unitario: sItem.model_discounted_price,
                  subtotal: sItem.model_discounted_price * sItem.model_quantity_purchased,
                }
              });
            }
          }
          syncedCount++;
        });
      }
    }
    return syncedCount;
  }
}
