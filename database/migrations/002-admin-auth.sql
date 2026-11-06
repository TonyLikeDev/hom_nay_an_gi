-- Additive migration for Better Auth; existing catalog, favorites and users are retained.
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN image TEXT NULL;
ALTER TABLE users ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS auth_sessions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 token VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 expires_at DATETIME(3) NOT NULL,
 created_at DATETIME(3) NOT NULL,
 updated_at DATETIME(3) NOT NULL,
 ip_address VARCHAR(255) NULL,
 user_agent TEXT NULL,
 UNIQUE KEY uq_auth_session_token(token),
 INDEX idx_auth_session_user(user_id),
 INDEX idx_auth_session_expiry(expires_at),
 CONSTRAINT fk_auth_session_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_accounts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 account_id VARCHAR(255) NOT NULL,
 provider_id VARCHAR(80) NOT NULL,
 password VARCHAR(255) NULL,
 access_token TEXT NULL,
 refresh_token TEXT NULL,
 id_token TEXT NULL,
 access_token_expires_at DATETIME(3) NULL,
 refresh_token_expires_at DATETIME(3) NULL,
 scope TEXT NULL,
 created_at DATETIME(3) NOT NULL,
 updated_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_auth_provider_account(provider_id,account_id),
 INDEX idx_auth_account_user(user_id),
 CONSTRAINT fk_auth_account_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_verifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 identifier VARCHAR(255) NOT NULL,
 value TEXT NOT NULL,
 expires_at DATETIME(3) NOT NULL,
 created_at DATETIME(3) NOT NULL,
 updated_at DATETIME(3) NOT NULL,
 INDEX idx_auth_verification_identifier(identifier)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_rate_limits (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 `key` VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 `count` INT NOT NULL,
 last_request BIGINT NOT NULL,
 UNIQUE KEY uq_auth_rate_limit_key(`key`)
) ENGINE=InnoDB;
