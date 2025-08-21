const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    connectionString: "postgresql://doadmin:AVNS_3UkZ6PqedWGFkdV6amW@db-postgresql-blr1-34567-do-user-23211066-0.d.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
  });

  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    
    const storeCount = await pool.query('SELECT COUNT(*) FROM stores');
    console.log('📊 Total stores:', storeCount.rows[0].count);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();