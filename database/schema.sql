-- MySQL 8.4 LTS. Select/create a dedicated database before running this file.
-- DDL commits independently; the seed script uses a separate data transaction.
-- Never DROP, TRUNCATE or disable foreign key checks during import.
CREATE TABLE IF NOT EXISTS schema_versions (
  version VARCHAR(40) PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seed_imports (
  seed_key VARCHAR(80) PRIMARY KEY,
  content_hash CHAR(64) NOT NULL,
  counts JSON NOT NULL,
  imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dataset_documents (
  id VARCHAR(80) PRIMARY KEY,
  document JSON NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS meals (
  id VARCHAR(32) PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  source_record JSON NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cuisines (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  cover_dish_id VARCHAR(100) NULL,
  icon VARCHAR(32) NULL,
  source_record JSON NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dishes (
  id VARCHAR(100) PRIMARY KEY,
  cuisine_id VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NULL,
  photo_id VARCHAR(255) NULL,
  photo_author VARCHAR(255) NULL,
  photo_crop VARCHAR(255) NULL,
  image_source JSON NULL,
  provenance JSON NULL,
  source_record JSON NOT NULL,
  INDEX idx_dishes_name (name),
  CONSTRAINT fk_dish_cuisine FOREIGN KEY (cuisine_id) REFERENCES cuisines(id)
) ENGINE=InnoDB;

-- Added after dishes exists to break the cuisine -> cover -> dish -> cuisine cycle.
-- For repeat application, use npm run db:setup (it checks this constraint first).
ALTER TABLE cuisines ADD CONSTRAINT fk_cuisine_cover
  FOREIGN KEY (cover_dish_id) REFERENCES dishes(id);

CREATE TABLE IF NOT EXISTS dish_meals (
  dish_id VARCHAR(100) NOT NULL,
  meal_id VARCHAR(32) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (dish_id, meal_id),
  UNIQUE KEY uq_dish_meal_order (dish_id, sort_order),
  CONSTRAINT fk_dm_dish FOREIGN KEY (dish_id) REFERENCES dishes(id),
  CONSTRAINT fk_dm_meal FOREIGN KEY (meal_id) REFERENCES meals(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS restaurants (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  original_category VARCHAR(120) NOT NULL,
  address TEXT NOT NULL,
  area VARCHAR(120) NOT NULL,
  price_label VARCHAR(255) NULL,
  price_tier VARCHAR(120) NULL,
  website TEXT NULL,
  verification VARCHAR(80) NOT NULL,
  photo JSON NOT NULL,
  provenance JSON NOT NULL,
  source_record JSON NOT NULL,
  INDEX idx_restaurants_category (category),
  INDEX idx_restaurants_price (price_tier),
  INDEX idx_restaurants_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS restaurant_meals (
  restaurant_id VARCHAR(100) NOT NULL,
  meal_id VARCHAR(32) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (restaurant_id, meal_id),
  CONSTRAINT fk_rm_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_rm_meal FOREIGN KEY (meal_id) REFERENCES meals(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS restaurant_dishes (
  dish_id VARCHAR(100) NOT NULL,
  restaurant_id VARCHAR(100) NOT NULL,
  match_type ENUM('dish','related') NOT NULL,
  offering VARCHAR(500) NOT NULL,
  price_vnd DECIMAL(12,0) NULL,
  source_record JSON NOT NULL,
  PRIMARY KEY (dish_id, restaurant_id),
  INDEX idx_rd_restaurant (restaurant_id, match_type),
  CONSTRAINT ck_rd_price CHECK (price_vnd IS NULL OR price_vnd >= 0),
  CONSTRAINT fk_rd_dish FOREIGN KEY (dish_id) REFERENCES dishes(id),
  CONSTRAINT fk_rd_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipes (
  dish_id VARCHAR(100) PRIMARY KEY,
  base_servings SMALLINT UNSIGNED NOT NULL,
  prep_time VARCHAR(255) NOT NULL,
  cook_time VARCHAR(255) NOT NULL,
  soak_note TEXT NULL,
  tip TEXT NOT NULL,
  source_label VARCHAR(500) NOT NULL,
  source_url TEXT NOT NULL,
  source_record JSON NOT NULL,
  CONSTRAINT ck_recipe_servings CHECK (base_servings BETWEEN 1 AND 12),
  CONSTRAINT fk_recipe_dish FOREIGN KEY (dish_id) REFERENCES dishes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  dish_id VARCHAR(100) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount_min DECIMAL(12,4) NULL,
  amount_max DECIMAL(12,4) NULL,
  unit VARCHAR(80) NULL,
  amount_text VARCHAR(500) NULL,
  PRIMARY KEY (dish_id, sort_order),
  CONSTRAINT ck_ingredient_amount CHECK (
    (amount_text IS NOT NULL AND amount_min IS NULL AND amount_max IS NULL)
    OR (amount_text IS NULL AND amount_min IS NOT NULL AND amount_min > 0 AND unit IS NOT NULL
      AND (amount_max IS NULL OR amount_max >= amount_min))
  ),
  CONSTRAINT fk_ingredient_recipe FOREIGN KEY (dish_id) REFERENCES recipes(dish_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipe_steps (
  dish_id VARCHAR(100) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  instruction TEXT NOT NULL,
  PRIMARY KEY (dish_id, sort_order),
  CONSTRAINT fk_step_recipe FOREIGN KEY (dish_id) REFERENCES recipes(dish_id)
) ENGINE=InnoDB;

-- Evidence is scoped to a reference variant, never a blanket restaurant claim.
CREATE TABLE IF NOT EXISTS dish_reviews (
  dish_id VARCHAR(100) NOT NULL,
  review_key VARCHAR(40) NOT NULL,
  status ENUM('reviewed','source-declared','verified') NOT NULL,
  evidence JSON NOT NULL,
  PRIMARY KEY (dish_id, review_key),
  CONSTRAINT fk_review_dish FOREIGN KEY (dish_id) REFERENCES dishes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dish_nutrition_profiles (
  dish_id VARCHAR(100) PRIMARY KEY,
  profile JSON NOT NULL,
  CONSTRAINT fk_profile_dish FOREIGN KEY (dish_id) REFERENCES dishes(id)
) ENGINE=InnoDB;

-- Prepared for future authentication; no sample users, passwords or admins seeded.
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorite_dishes (
  user_id BIGINT UNSIGNED NOT NULL,
  dish_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, dish_id),
  CONSTRAINT fk_fd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fd_dish FOREIGN KEY (dish_id) REFERENCES dishes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favorite_restaurants (
  user_id BIGINT UNSIGNED NOT NULL,
  restaurant_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, restaurant_id),
  CONSTRAINT fk_fr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fr_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
) ENGINE=InnoDB;
