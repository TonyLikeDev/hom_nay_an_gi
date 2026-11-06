-- Additive migration: preserve imported fields and photo provenance.
ALTER TABLE restaurants ADD COLUMN admin_details JSON NULL;
ALTER TABLE restaurants ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE restaurants ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
CREATE TABLE IF NOT EXISTS restaurant_audit (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 restaurant_id VARCHAR(100) NOT NULL,
 actor_user_id BIGINT UNSIGNED NOT NULL,
 action ENUM('create','update') NOT NULL,
 before_data JSON NULL,
 after_data JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX idx_restaurant_audit(restaurant_id,created_at),
 CONSTRAINT fk_audit_restaurant FOREIGN KEY(restaurant_id) REFERENCES restaurants(id),
 CONSTRAINT fk_audit_actor FOREIGN KEY(actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;
