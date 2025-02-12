-- CreateTable
CREATE TABLE "errsole_config" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "errsole_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "errsole_logs_v2" (
    "id" BIGSERIAL NOT NULL,
    "hostname" VARCHAR(255),
    "pid" INTEGER,
    "source" VARCHAR(255),
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "level" VARCHAR(255) DEFAULT 'info',
    "message" TEXT,
    "meta" TEXT,
    "errsole_id" BIGINT,

    CONSTRAINT "errsole_logs_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "errsole_notifications" (
    "id" BIGSERIAL NOT NULL,
    "errsole_id" BIGINT,
    "hostname" VARCHAR(255),
    "hashed_message" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "errsole_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "errsole_users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) NOT NULL,

    CONSTRAINT "errsole_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "errsole_config_key_key" ON "errsole_config"("key");

-- CreateIndex
CREATE INDEX "errsole_logs_v2_hostname_pid_id_idx" ON "errsole_logs_v2"("hostname", "pid", "id");

-- CreateIndex
CREATE INDEX "errsole_logs_v2_source_level_id_idx" ON "errsole_logs_v2"("source", "level", "id");

-- CreateIndex
CREATE INDEX "errsole_logs_v2_source_level_timestamp_idx" ON "errsole_logs_v2"("source", "level", "timestamp");

-- CreateIndex
CREATE INDEX "idx_errsole_id" ON "errsole_logs_v2"("errsole_id");

-- CreateIndex
CREATE INDEX "idx_errsole_notifications_created_at" ON "errsole_notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_errsole_notifications_host_hashed_created" ON "errsole_notifications"("hostname", "hashed_message", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "errsole_users_email_key" ON "errsole_users"("email");
