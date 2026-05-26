import { plainToInstance } from 'class-transformer';
import { UpdateSettingsDto } from '../src/admin/dto/update-settings.dto.js';

const payload = {
  site_name: 'Hydra Collectables',
  admin_email: 'darmfma@gmail.com',
  support_email: 'darmfma@gmail.com',
  max_products_per_page: '12',
  tax_rate: 'undefined',
};

const instance = plainToInstance(UpdateSettingsDto, payload);
console.log('Instance:', instance);
console.log('Keys:', Object.keys(instance));
console.log('Entries:', Object.entries(instance));
console.log('site_name:', instance.site_name);
console.log('admin_email:', instance.admin_email);
