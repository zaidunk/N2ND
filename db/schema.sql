-- n2nd (Attention Boost) — Supabase schema
-- Apply via: Supabase SQL Editor or psql

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Sources registry ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
    id                  text PRIMARY KEY,
    name                text NOT NULL,
    source_type         text NOT NULL,
    base_url            text,
    tier                text DEFAULT 'B',
    authority_score     float DEFAULT 0.7,
    is_active           boolean DEFAULT true,
    robots_checked_at   timestamptz,
    created_at          timestamptz DEFAULT now()
);

INSERT INTO sources (id, name, source_type, base_url, tier, authority_score) VALUES
    ('antara',       'Antara',          'rss_id',     'https://www.antaranews.com',   'A', 0.9),
    ('kompas',       'Kompas',          'rss_id',     'https://www.kompas.com',       'A', 0.9),
    ('detik',        'Detik',           'rss_id',     'https://www.detik.com',        'B', 0.7),
    ('cnnindonesia', 'CNN Indonesia',   'rss_id',     'https://www.cnnindonesia.com', 'B', 0.7),
    ('tempo',        'Tempo',           'rss_id',     'https://www.tempo.co',         'B', 0.7),
    ('cnbcid',       'CNBC Indonesia',  'rss_id',     'https://www.cnbcindonesia.com','B', 0.7),
    ('reuters',      'Reuters',         'rss_global', 'https://www.reuters.com',      'A', 0.9),
    ('bbc',          'BBC News',        'rss_global', 'https://www.bbc.co.uk',        'A', 0.9),
    ('aljazeera',    'Al Jazeera',      'rss_global', 'https://www.aljazeera.com',    'B', 0.7),
    ('bmkg',         'BMKG',            'bmkg',       'https://data.bmkg.go.id',      'A', 1.0),
    ('gdelt',        'GDELT Project',   'gdelt',      'https://api.gdeltproject.org', 'B', 0.6),
    ('bps',          'BPS Indonesia',   'bps',        'https://www.bps.go.id',        'A', 1.0)
ON CONFLICT (id) DO NOTHING;

-- ─── Main documents table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash    text UNIQUE NOT NULL,
    source_id       text REFERENCES sources(id),
    source_type     text NOT NULL,
    content_type    text NOT NULL DEFAULT 'article',
    -- content_type: 'article' | 'bmkg_earthquake' | 'bps_stat' | 'gdelt_event' | 'market_snapshot'

    title           text,
    body            text,
    published_at    timestamptz,

    lang            text DEFAULT 'id',
    entities        jsonb DEFAULT '[]'::jsonb,
    topics          text[] DEFAULT '{}',
    sentiment       float,
    tension_score   float DEFAULT 0,

    authority_score float DEFAULT 0.7,
    embedding       vector(1536),
    raw             jsonb,

    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- ─── BPS statistics table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bps_stats (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset     text NOT NULL,
    province    text,
    indicator   text NOT NULL,
    value       float,
    unit        text,
    period      text NOT NULL,
    period_type text DEFAULT 'annual',
    category    text,
    source_file text,
    created_at  timestamptz DEFAULT now()
);

-- ─── Entity mentions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entity_mentions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name   text NOT NULL,
    entity_type   text,
    document_id   uuid REFERENCES documents(id) ON DELETE CASCADE,
    source_id     text REFERENCES sources(id),
    mention_count int DEFAULT 1,
    sentiment     float,
    created_at    timestamptz DEFAULT now()
);

-- ─── Search log ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_log (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    query        text NOT NULL,
    query_hash   text NOT NULL,
    result_count int,
    cache_hit    boolean DEFAULT false,
    latency_ms   int,
    user_id      uuid,
    created_at   timestamptz DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_source       ON documents (source_id);
CREATE INDEX IF NOT EXISTS idx_documents_published    ON documents (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_content_type ON documents (content_type);
CREATE INDEX IF NOT EXISTS idx_documents_lang         ON documents (lang);
CREATE INDEX IF NOT EXISTS idx_documents_topics       ON documents USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_documents_entities     ON documents USING GIN (entities);
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm   ON documents USING GIN (title gin_trgm_ops);

-- Vector index (ivfflat — optimal for <1M rows)
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- bps_stats
CREATE INDEX IF NOT EXISTS idx_bps_dataset      ON bps_stats (dataset);
CREATE INDEX IF NOT EXISTS idx_bps_province     ON bps_stats (province);
CREATE INDEX IF NOT EXISTS idx_bps_indicator    ON bps_stats (indicator);
CREATE INDEX IF NOT EXISTS idx_bps_dataset_prov ON bps_stats (dataset, province);

-- entity_mentions
CREATE INDEX IF NOT EXISTS idx_entity_name   ON entity_mentions (entity_name);
CREATE INDEX IF NOT EXISTS idx_entity_doc    ON entity_mentions (document_id);
CREATE INDEX IF NOT EXISTS idx_entity_source ON entity_mentions (source_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_unique ON entity_mentions (entity_name, document_id);

-- search_log
CREATE INDEX IF NOT EXISTS idx_search_hash    ON search_log (query_hash);
CREATE INDEX IF NOT EXISTS idx_search_created ON search_log (created_at DESC);

-- ─── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bps_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_full" ON documents       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "anon_read"    ON documents       FOR SELECT USING (true);
CREATE POLICY "service_full" ON bps_stats       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "anon_read"    ON bps_stats       FOR SELECT USING (true);
CREATE POLICY "service_full" ON entity_mentions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "anon_read"    ON entity_mentions FOR SELECT USING (true);

-- ─── Entity prominence materialized view ──────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS entity_prominence AS
SELECT
    em.entity_name,
    em.entity_type,
    COUNT(DISTINCT em.document_id)                                    AS mention_count,
    COUNT(DISTINCT em.source_id)                                      AS source_count,
    COUNT(DISTINCT em.source_id) * COUNT(DISTINCT em.document_id)     AS prominence_score,
    AVG(em.sentiment)                                                 AS avg_sentiment,
    MAX(d.published_at)                                               AS last_seen
FROM entity_mentions em
JOIN documents d ON d.id = em.document_id
WHERE d.published_at > now() - interval '7 days'
GROUP BY em.entity_name, em.entity_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ep_unique ON entity_prominence (entity_name, entity_type);

-- ─── Semantic search RPC ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding  vector(1536),
    match_count      int     DEFAULT 10,
    min_similarity   float   DEFAULT 0.5,
    content_types    text[]  DEFAULT NULL,
    source_types     text[]  DEFAULT NULL,
    published_after  timestamptz DEFAULT NULL
)
RETURNS TABLE (
    id              uuid,
    title           text,
    body            text,
    source_id       text,
    source_type     text,
    content_type    text,
    published_at    timestamptz,
    entities        jsonb,
    topics          text[],
    sentiment       float,
    tension_score   float,
    authority_score float,
    similarity      float
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.body,
        d.source_id,
        d.source_type,
        d.content_type,
        d.published_at,
        d.entities,
        d.topics,
        d.sentiment,
        d.tension_score,
        d.authority_score,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM documents d
    WHERE
        d.embedding IS NOT NULL
        AND (content_types IS NULL OR d.content_type = ANY(content_types))
        AND (source_types  IS NULL OR d.source_type  = ANY(source_types))
        AND (published_after IS NULL OR d.published_at >= published_after)
        AND 1 - (d.embedding <=> query_embedding) >= min_similarity
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
