import { RedisService } from './redis';
import { AuthService } from './auth';
import securityItems from '@/seed/security-items.json';

export async function seedDatabase() {
  try {
    await AuthService.initializeAdminUser();
    console.log('Admin user initialized');

    const existingItems = await RedisService.getAllSecurityItems();
    
    if (existingItems.length === 0) {
      console.log('Seeding security items...');
      
      for (const item of securityItems) {
        await RedisService.createSecurityItem(item);
      }
      
      console.log(`Seeded ${securityItems.length} security items`);
    } else {
      console.log('Security items already exist, skipping seed');
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}