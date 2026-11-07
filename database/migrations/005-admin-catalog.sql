CREATE TABLE IF NOT EXISTS admin_catalog_versions (
 kind ENUM('links','recipes','reviews') NOT NULL,
 entity_key VARCHAR(255) NOT NULL,
 revision INT UNSIGNED NOT NULL DEFAULT 1,
 last_request_id CHAR(36) NULL,
 last_actor_id BIGINT UNSIGNED NULL,
 last_payload JSON NULL,
 PRIMARY KEY(kind,entity_key)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS admin_catalog_audit (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 kind ENUM('links','recipes','reviews') NOT NULL,
 entity_key VARCHAR(255) NOT NULL,
 actor_user_id BIGINT UNSIGNED NOT NULL,
 before_data JSON NULL,
 after_data JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX idx_catalog_audit(kind,entity_key,created_at),
 CONSTRAINT fk_catalog_actor FOREIGN KEY(actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;
