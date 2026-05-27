"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const shopee_service_1 = require("./shopee/shopee.service");
async function bootstrap() {
    console.log('Iniciando script de teste de sincronização...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const shopeeService = app.get(shopee_service_1.ShopeeService);
    console.log('Chamando syncOrders()...');
    try {
        const timeTo = Math.floor(Date.now() / 1000);
        const timeFrom = timeTo - 15 * 24 * 60 * 60;
        console.log(`Buscando pedidos de ${new Date(timeFrom * 1000).toLocaleString()} até ${new Date(timeTo * 1000).toLocaleString()}`);
        const count = await shopeeService.syncOrders();
        console.log('Sincronização concluída! Pedidos importados:', count);
    }
    catch (error) {
        console.error('Erro ao sincronizar:', error);
    }
    finally {
        await app.close();
        process.exit(0);
    }
}
bootstrap();
//# sourceMappingURL=test_sync.js.map