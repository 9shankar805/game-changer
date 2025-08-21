const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://doadmin:AVNS_3UkZ6PqedWGFkdV6amW@db-postgresql-blr1-34567-do-user-23211066-0.d.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
});

async function checkStores() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM stores');
    console.log(`Total stores: ${result.rows[0].count}`);
    
    const stores = await pool.query('SELECT id, name, store_type FROM stores LIMIT 10');
    console.log('\nFirst 10 stores:');
    stores.rows.forEach(store => {
      console.log(`${store.id}: ${store.name} (${store.store_type})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStores();