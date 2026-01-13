-- Strava連携用テーブルを追加
-- 既存のデータを保持したまま新しいテーブルのみを作成

-- 1. user_integrations テーブル（Strava/Garmin等との連携情報）
CREATE TABLE IF NOT EXISTS "user_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "providerUserId" TEXT,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_integrations_pkey" PRIMARY KEY ("id")
);

-- ユニーク制約
CREATE UNIQUE INDEX IF NOT EXISTS "user_integrations_userId_provider_key" 
ON "user_integrations"("userId", "provider");

-- 外部キー制約
ALTER TABLE "user_integrations" 
ADD CONSTRAINT "user_integrations_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. user_shoes テーブル（ユーザーのシューズ管理）
CREATE TABLE IF NOT EXISTS "user_shoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shoeId" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDistance" DOUBLE PRECISION NOT NULL DEFAULT 800,
    "purchaseDate" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "stravaGearId" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shoes_pkey" PRIMARY KEY ("id")
);

-- インデックス
CREATE INDEX IF NOT EXISTS "user_shoes_userId_retiredAt_idx" 
ON "user_shoes"("userId", "retiredAt");

-- 外部キー制約
ALTER TABLE "user_shoes" 
ADD CONSTRAINT "user_shoes_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_shoes" 
ADD CONSTRAINT "user_shoes_shoeId_fkey" 
FOREIGN KEY ("shoeId") REFERENCES "shoes"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. running_activities テーブル（ランニングアクティビティ）
CREATE TABLE IF NOT EXISTS "running_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userShoeId" TEXT,
    "stravaActivityId" TEXT,
    "name" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "pace" DOUBLE PRECISION,
    "elevationGain" DOUBLE PRECISION,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "running_activities_pkey" PRIMARY KEY ("id")
);

-- ユニーク制約（Stravaアクティビティの重複防止）
CREATE UNIQUE INDEX IF NOT EXISTS "running_activities_stravaActivityId_key" 
ON "running_activities"("stravaActivityId");

-- インデックス
CREATE INDEX IF NOT EXISTS "running_activities_userId_activityDate_idx" 
ON "running_activities"("userId", "activityDate");

-- 外部キー制約
ALTER TABLE "running_activities" 
ADD CONSTRAINT "running_activities_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "running_activities" 
ADD CONSTRAINT "running_activities_userShoeId_fkey" 
FOREIGN KEY ("userShoeId") REFERENCES "user_shoes"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;
