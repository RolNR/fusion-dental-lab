-- Step 1: Convert column to TEXT to decouple from enum
ALTER TABLE "Tooth"
  ALTER COLUMN "tipoRestauracion" TYPE TEXT
  USING ("tipoRestauracion"::TEXT);

-- Step 2: Migrate data while column is TEXT
UPDATE "Tooth" SET "tipoRestauracion" = 'incrustacion' WHERE "tipoRestauracion" IN ('inlay', 'onlay');

-- Step 3: Drop old enum and create new one
DROP TYPE "RestorationType";

CREATE TYPE "RestorationType" AS ENUM (
  'corona',
  'puente',
  'incrustacion',
  'maryland',
  'carilla',
  'provisional',
  'pilar',
  'barra',
  'hibrida',
  'toronto',
  'removible',
  'parcial',
  'total',
  'sobredentadura',
  'encerado',
  'mockup',
  'guia_quirurgica',
  'prototipo',
  'guarda_oclusal'
);

-- Step 4: Convert column back to enum
ALTER TABLE "Tooth"
  ALTER COLUMN "tipoRestauracion" TYPE "RestorationType"
  USING ("tipoRestauracion"::"RestorationType");
