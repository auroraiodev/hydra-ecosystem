
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SearchService } from '../src/search/search.service';

async function testSearch() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const searchService = app.get(SearchService);

  console.log('Searching for "The One Ring"...');
  try {
    const results = await searchService.searchHybrid('the one ring', 1, 12, {
      tcgId: 'bd789d3f-5569-4971-890e-e261e145e42c'
    });
    console.log('Results success:', results.success);
    console.log('Data length:', results.data.length);
    console.log('Local count:', results.localCount);
    console.log('Importation count:', results.importationCount);
    console.log('First result:', results.data[0]?.cardName);
  } catch (err) {
    console.error('Search failed:', err);
  }
  await app.close();
}

testSearch();
