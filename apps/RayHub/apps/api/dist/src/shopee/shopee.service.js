"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopeeService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
let ShopeeService = class ShopeeService {
    prisma;
    partnerId;
    partnerKey;
    redirectUrl;
    baseUrl;
    constructor(prisma) {
        this.prisma = prisma;
        this.partnerId = parseInt(process.env.SHOPEE_PARTNER_ID || '0', 10);
        this.partnerKey = process.env.SHOPEE_PARTNER_KEY || '';
        this.redirectUrl = process.env.SHOPEE_REDIRECT_URL || 'https://unpaining-transcriptionally-patrick.ngrok-free.dev/api/auth/callback';
        this.baseUrl = process.env.SHOPEE_BASE_URL || 'https://partner.shopeemobile.com';
    }
    sign(baseString) {
        return (0, crypto_1.createHmac)('sha256', this.partnerKey)
            .update(baseString)
            .digest('hex');
    }
    getAuthUrl() {
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
    async getAccessToken(code, shopId) {
        const timest = Math.floor(Date.now() / 1000);
        const path = '/api/v2/auth/token/get';
        const baseString = `${this.partnerId}${path}${timest}`;
        const sign = this.sign(baseString);
        const response = await axios_1.default.post(`${this.baseUrl}${path}`, {
            code,
            shop_id: shopId,
            partner_id: this.partnerId,
        }, {
            params: {
                partner_id: this.partnerId,
                timestamp: timest,
                sign,
            },
        });
        return response.data;
    }
    async saveTokens(shopId, accessToken, refreshToken, expireIn) {
        const company = await this.prisma.company.findFirst();
        if (!company)
            return;
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
    async refreshAccessToken(shopId, refreshToken) {
        const timest = Math.floor(Date.now() / 1000);
        const path = '/api/v2/auth/access_token/get';
        const baseString = `${this.partnerId}${path}${timest}`;
        const sign = this.sign(baseString);
        const response = await axios_1.default.post(`${this.baseUrl}${path}`, {
            shop_id: shopId,
            refresh_token: refreshToken,
            partner_id: this.partnerId,
        }, {
            params: {
                partner_id: this.partnerId,
                timestamp: timest,
                sign,
            },
        });
        if (response.data.error) {
            throw new Error(`Refresh Error: ${response.data.error}`);
        }
        await this.saveTokens(shopId, response.data.access_token, response.data.refresh_token, response.data.expire_in);
        return response.data;
    }
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
                return { connected: true, shopId: company.shopee_shop_id };
            }
            catch (err) {
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
    async requestBusinessApi(method, path, params = {}, body = {}) {
        const status = await this.getIntegrationStatus();
        if (!status.connected) {
            throw new Error('Shopee is not connected or token expired');
        }
        const company = await this.prisma.company.findFirst();
        const accessToken = company.shopee_access_token;
        const shopId = Number(company.shopee_shop_id);
        const timest = Math.floor(Date.now() / 1000);
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
        const response = await (0, axios_1.default)({
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
    async syncProducts() {
        let offset = 0;
        const pageSize = 50;
        let hasMore = true;
        let allItemIds = [];
        while (hasMore) {
            const response = await this.requestBusinessApi('get', '/api/v2/product/get_item_list', {
                offset,
                page_size: pageSize,
                item_status: 'NORMAL',
            });
            const items = response.response?.item || [];
            const itemIds = items.map((i) => i.item_id);
            allItemIds = allItemIds.concat(itemIds);
            hasMore = response.response?.has_next_page || false;
            offset = response.response?.next_offset || (offset + pageSize);
            if (allItemIds.length >= 10000)
                break;
        }
        if (allItemIds.length === 0)
            return 0;
        let syncedCount = 0;
        for (let i = 0; i < allItemIds.length; i += 50) {
            const chunkIds = allItemIds.slice(i, i + 50);
            const response = await this.requestBusinessApi('get', '/api/v2/product/get_item_base_info', {
                item_id_list: chunkIds.join(','),
            });
            const items = response.response?.item_list || [];
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
                    },
                    create: {
                        item_id: BigInt(item.item_id),
                        model_id: 0n,
                        name: item.item_name,
                        sku: sku,
                        shopee_price: price,
                        shopee_stock: stock,
                        cost: 0,
                        ncm: '',
                        is_active: item.item_status === 'NORMAL',
                    },
                });
                syncedCount++;
            }
        }
        return syncedCount;
    }
    async syncOrders() {
        console.log('[syncOrders] Iniciando...');
        const timeTo = Math.floor(Date.now() / 1000);
        const timeFrom = timeTo - 15 * 24 * 60 * 60;
        let cursor = '';
        let hasMore = true;
        let allOrderSns = [];
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
            const sns = orders.map((o) => o.order_sn);
            allOrderSns = allOrderSns.concat(sns);
            console.log(`[syncOrders] Encontrados ${orders.length} pedidos nesta página. Total acumulado: ${allOrderSns.length}`);
            hasMore = response.response?.more || false;
            const nextCursor = response.response?.next_cursor || '';
            if (cursor === nextCursor || !nextCursor) {
                console.log('[syncOrders] Quebrando loop da Shopee (cursor igual ou vazio).');
                break;
            }
            cursor = nextCursor;
            if (allOrderSns.length >= 10000) {
                console.log('[syncOrders] Limite de segurança de 10000 atingido. Interrompendo busca.');
                break;
            }
        }
        console.log(`[syncOrders] Fase 1 Concluída. Total de Pedidos: ${allOrderSns.length}`);
        if (allOrderSns.length === 0)
            return 0;
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
            for (const shopeeOrder of orderDetails) {
                await this.prisma.$transaction(async (tx) => {
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
                    const statusMap = {
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
                    const subtotal = shopeeOrder.item_list?.reduce((acc, item) => acc + (item.model_discounted_price * item.model_quantity_purchased), 0) || 0;
                    const frete = shopeeOrder.estimated_shipping_fee || 0;
                    const total = shopeeOrder.total_amount || (subtotal + frete);
                    const dataPedido = new Date(shopeeOrder.create_time * 1000);
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
};
exports.ShopeeService = ShopeeService;
exports.ShopeeService = ShopeeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShopeeService);
//# sourceMappingURL=shopee.service.js.map