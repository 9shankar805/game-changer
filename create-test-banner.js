const { db } = require('./server/db');
const { banners } = require('./shared/schema');

async function createTestBanner() {
  try {
    console.log('🎯 Creating test banner...');
    
    const testBanner = {
      title: 'Flash Sale - 50% Off Everything!',
      imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&h=400&fit=crop&auto=format',
      linkUrl: '/flash-sales',
      description: 'Limited time offer! Get 50% off on all products. Hurry up, sale ends soon!',
      position: 'main',
      isActive: true,
      displayOrder: 1,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
    
    const result = await db.insert(banners).values(testBanner).returning();
    
    console.log('✅ Test banner created successfully:', result[0]);
    console.log('🔔 Banner will trigger push notifications when users visit the website');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test banner:', error);
    process.exit(1);
  }
}

createTestBanner();