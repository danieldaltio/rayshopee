import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ShopeeService } from './shopee/shopee.service';

async function bootstrap() {
  console.log('Iniciando script de teste de sincronização...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const shopeeService = app.get(ShopeeService);

  console.log('Chamando syncOrders()...');
  try {
    const timeTo = Math.floor(Date.now() / 1000);
    const timeFrom = timeTo - 15 * 24 * 60 * 60;
    console.log(`Buscando pedidos de ${new Date(timeFrom * 1000).toLocaleString()} até ${new Date(timeTo * 1000).toLocaleString()}`);
    
    const count = await shopeeService.syncOrders();
    console.log('Sincronização concluída! Pedidos importados:', count);
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
