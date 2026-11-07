ALTER TABLE dishes ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE dishes ADD COLUMN admin_image_url TEXT NULL;
ALTER TABLE dishes ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
CREATE TABLE IF NOT EXISTS dish_audit (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 dish_id VARCHAR(100) NOT NULL,
 actor_user_id BIGINT UNSIGNED NOT NULL,
 action ENUM('create','update') NOT NULL,
 before_data JSON NULL,
 after_data JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX idx_dish_audit(dish_id,created_at),
 CONSTRAINT fk_dish_audit_dish FOREIGN KEY(dish_id) REFERENCES dishes(id),
 CONSTRAINT fk_dish_audit_actor FOREIGN KEY(actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;
