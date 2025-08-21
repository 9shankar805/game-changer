-- Database optimizations for faster loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stores_active ON stores(is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;