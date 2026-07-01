-- Enable pgvector extension and create ivfflat index on Embedding.embedding.
-- This migration is applied after `prisma migrate` creates the base tables.

CREATE EXTENSION IF NOT EXISTS vector;

-- The column is declared as Unsupported("vector(1536)") in schema.prisma,
-- so Prisma will create it. Here we only add the index.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Embedding' AND column_name = 'embedding'
  ) THEN
    CREATE INDEX IF NOT EXISTS "Embedding_embedding_ivfflat_idx"
      ON "Embedding"
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
  END IF;
END $$;
