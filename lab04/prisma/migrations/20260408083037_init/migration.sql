-- CreateEnum
CREATE TYPE "Power" AS ENUM ('flight', 'strength', 'telepathy', 'speed', 'invisibility');

-- CreateEnum
CREATE TYPE "HeroStatus" AS ENUM ('available', 'busy', 'retired');

-- CreateEnum
CREATE TYPE "IncidentLevel" AS ENUM ('low', 'medium', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'assigned', 'resolved');

-- CreateTable
CREATE TABLE "heroes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "power" "Power" NOT NULL,
    "status" "HeroStatus" NOT NULL DEFAULT 'available',
    "missions_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heroes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" SERIAL NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT,
    "level" "IncidentLevel" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "hero_id" INTEGER,
    "assigned_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution_minutes" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_categories" (
    "incident_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "incident_categories_pkey" PRIMARY KEY ("incident_id","category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "heroes_name_key" ON "heroes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_hero_id_fkey" FOREIGN KEY ("hero_id") REFERENCES "heroes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_categories" ADD CONSTRAINT "incident_categories_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_categories" ADD CONSTRAINT "incident_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
