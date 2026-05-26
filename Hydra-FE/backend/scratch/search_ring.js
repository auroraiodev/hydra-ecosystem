const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/apps/catalog/src/app.module.js');
const { ImportationService } = require('./dist/apps/catalog/src/importation/importation.service.js');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(ImportationService);
  const result = await service.searchCards({
    query: 'The One Ring',
    language: 'Japonés',
    includeOutOfStock: true
  });
  console.log('Results:', result.data.map(item => ({
    importationId: item.importationId,
    cardName: item.cardName,
    language: item.language,
    price: item.price,
    finalPrice: item.finalPrice,
    price_mxn_local: item.price_mxn_local,
    price_mxn_importation: item.price_mxn_importation,
    stock: item.stock
  })));
  await app.close();
}

main().catch(console.error);
