CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (full_name, email, password)
VALUES
    ('Test User', 'test1@example.com', '12345'),
    ('Demo User', 'test2@example.com', '12345')
ON CONFLICT (email) DO NOTHING;
