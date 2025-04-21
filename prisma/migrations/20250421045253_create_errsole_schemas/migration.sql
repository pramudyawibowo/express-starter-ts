-- CreateTable
CREATE TABLE "errsole_config" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "errsole_config_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "errsole_logs_v3" (
    "id" BIGSERIAL NOT NULL,
    "hostname" VARCHAR(63),
    "pid" INTEGER,
    "source" VARCHAR(31),
    "timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "level" VARCHAR(31) DEFAULT 'info',
    "message" TEXT,
    "message_tsv" tsvector,
    "meta" TEXT,
    "errsole_id" BIGINT,

    CONSTRAINT "errsole_logs_v3_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "errsole_config_key_key" ON "errsole_config"("key");

-- CreateIndex
CREATE INDEX "idx_errsole_notifications_created_at" ON "errsole_notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_errsole_notifications_host_hashed_created" ON "errsole_notifications"("hostname", "hashed_message", "created_at");

-- CreateIndex
CREATE INDEX "idx_errsole_notifications_hostname_hashed_message_created_at" ON "errsole_notifications"("hostname", "hashed_message", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "errsole_users_email_key" ON "errsole_users"("email");

-- CreateIndex
CREATE INDEX "idx_errsole_logs_v3_errsole_id" ON "errsole_logs_v3"("errsole_id");

-- CreateIndex
CREATE INDEX "idx_errsole_logs_v3_hostname" ON "errsole_logs_v3"("hostname");

-- CreateIndex
CREATE INDEX "idx_errsole_logs_v3_hostname_source_level_timestamp_id" ON "errsole_logs_v3"("hostname", "source", "level", "timestamp", "id");

-- CreateIndex
CREATE INDEX "idx_errsole_logs_v3_hostname_timestamp_id" ON "errsole_logs_v3"("hostname", "timestamp", "id");

-- CreateIndex
CREATE INDEX "idx_errsole_logs_v3_message_tsv" ON "errsole_logs_v3" USING GIN ("message_tsv");

-- CreateIndex
CREATE INDEX "idx_errsole_logs_v3_source_level_timestamp_id" ON "errsole_logs_v3"("source", "level", "timestamp", "id");

-- CreateIndex
CREATE INDEX "idx_errsole_logs_v3_timestamp_id" ON "errsole_logs_v3"("timestamp", "id");
