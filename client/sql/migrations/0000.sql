PRAGMA page_size=4096;
PRAGMA journal_mode = WAL;

-- v3: hot/cold split. media is the hot table. everything else is cold (detail layer).
-- soft deletes on profile_media + watch_progress (deleted_at). triggers maintain
-- watch_progress.watched for TV — never the app layer.

CREATE TABLE schema_version (
  version     INTEGER PRIMARY KEY,
  description TEXT    NOT NULL,
  applied_at  INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
) STRICT;
INSERT INTO schema_version (version, description) VALUES (3, 'v3');

CREATE TABLE profiles (
  id   TEXT    PRIMARY KEY CHECK (length(id) <= 64),
  name TEXT    NOT NULL    CHECK (length(name) <= 255),
  open INTEGER NOT NULL DEFAULT 1 CHECK (open IN (0, 1))
) STRICT;

-- hot layer: lean Media summary. last_ep_*/next_ep_* are denorm EpisodeRef display
-- fields — not FKs into episodes, may reference episodes not yet fetched.
CREATE TABLE media (
  id                 TEXT    PRIMARY KEY,
  tmdb_id            INTEGER NOT NULL,
  name               TEXT    NOT NULL,
  language           TEXT    NOT NULL DEFAULT '',
  status             TEXT    NOT NULL CHECK (status IN (
                       'Returning Series', 'Ended', 'Canceled',
                       'In Production', 'Planned', 'Pilot', 'Released'
                     )),
  runtime            INTEGER,
  premiered          TEXT,
  ended              TEXT,
  rating             REAL,
  vote_count         INTEGER,
  network            TEXT,   -- display-only denorm for list views
  overview           TEXT    NOT NULL DEFAULT '',
  tagline            TEXT,
  updated            INTEGER NOT NULL,
  poster             TEXT,
  backdrop           TEXT,
  media_type         TEXT    NOT NULL CHECK (media_type IN ('tv', 'movie')),
  number_of_seasons  INTEGER,  -- TV only
  number_of_episodes INTEGER,  -- TV only
  release_date       TEXT,     -- movie only
  last_ep_season     INTEGER,  -- TV only
  last_ep_episode    INTEGER,
  last_ep_name       TEXT,
  last_ep_air_date   TEXT,
  last_ep_overview   TEXT,
  last_ep_runtime    INTEGER,
  last_ep_still      TEXT,
  next_ep_season     INTEGER,  -- TV only
  next_ep_episode    INTEGER,
  next_ep_name       TEXT,
  next_ep_air_date   TEXT,
  next_ep_overview   TEXT,
  next_ep_runtime    INTEGER,
  next_ep_still      TEXT,
  CONSTRAINT chk_tv_only CHECK (
    media_type = 'tv' OR (
      number_of_seasons IS NULL AND number_of_episodes IS NULL AND
      last_ep_season IS NULL AND next_ep_season IS NULL
    )
  ),
  CONSTRAINT chk_movie_only CHECK (media_type = 'movie' OR release_date IS NULL),
  UNIQUE (tmdb_id, media_type)
) STRICT;

CREATE INDEX idx_media_tmdb    ON media (tmdb_id);
CREATE INDEX idx_media_type    ON media (media_type);
CREATE INDEX idx_media_status  ON media (status);
CREATE INDEX idx_media_updated ON media (updated);

CREATE TABLE media_genres (
  media_id TEXT NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  genre    TEXT NOT NULL,
  PRIMARY KEY (media_id, genre)
) STRICT;

CREATE TABLE profile_media (
  profile_id TEXT    NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  media_id   TEXT    NOT NULL REFERENCES media    (id) ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0,
  added_at   INTEGER NOT NULL,
  deleted_at INTEGER,  -- soft delete: preserves watch_progress on removal
  PRIMARY KEY (profile_id, media_id)
) STRICT;

CREATE INDEX idx_pm_profile ON profile_media (profile_id, deleted_at);
CREATE INDEX idx_pm_media   ON profile_media (media_id);

-- cold layer cache sentinel. watch_providers stays JSON — never queried relationally.
CREATE TABLE media_detail_cache (
  media_id        TEXT    PRIMARY KEY REFERENCES media (id) ON DELETE CASCADE,
  fetched_at      INTEGER NOT NULL,
  fetch_status    TEXT    NOT NULL DEFAULT 'ok' CHECK (fetch_status IN ('ok', 'error', 'partial')),
  watch_providers TEXT    -- JSON: WatchProviders type (display-only, query via TMDB/JustWatch)
) STRICT;

CREATE TABLE networks (
  id             INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL,
  logo           TEXT,
  origin_country TEXT    NOT NULL DEFAULT ''
) STRICT;
CREATE TABLE media_networks (
  media_id   TEXT    NOT NULL REFERENCES media    (id) ON DELETE CASCADE,
  network_id INTEGER NOT NULL REFERENCES networks (id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, network_id)
) STRICT;

CREATE TABLE production_companies (
  id             INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL,
  logo           TEXT,
  origin_country TEXT    NOT NULL DEFAULT ''
) STRICT;
CREATE TABLE media_production_companies (
  media_id   TEXT    NOT NULL REFERENCES media                (id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES production_companies (id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, company_id)
) STRICT;

CREATE TABLE collections (
  id       INTEGER PRIMARY KEY,
  name     TEXT    NOT NULL,
  poster   TEXT,
  backdrop TEXT
) STRICT;
CREATE TABLE media_collection (
  media_id      TEXT    PRIMARY KEY REFERENCES media      (id) ON DELETE CASCADE,
  collection_id INTEGER NOT NULL   REFERENCES collections (id) ON DELETE CASCADE
) STRICT;
CREATE INDEX idx_collection_members ON media_collection (collection_id);

CREATE TABLE external_ids (
  media_id     TEXT PRIMARY KEY REFERENCES media (id) ON DELETE CASCADE,
  imdb_id      TEXT,
  tvdb_id      INTEGER,
  instagram_id TEXT,
  twitter_id   TEXT,
  facebook_id  TEXT,
  wikidata_id  TEXT
) STRICT;

CREATE TABLE media_keywords (
  media_id TEXT NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  keyword  TEXT NOT NULL,
  PRIMARY KEY (media_id, keyword)
) STRICT;
CREATE INDEX idx_keywords_keyword ON media_keywords (keyword);

-- descriptors collapsed to TEXT column — display-only, never queried individually
CREATE TABLE content_ratings (
  id          INTEGER PRIMARY KEY,
  media_id    TEXT    NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  country     TEXT    NOT NULL,
  rating      TEXT    NOT NULL,
  descriptors TEXT    NOT NULL DEFAULT '',  -- comma-separated e.g. "Violence,Language"
  UNIQUE (media_id, country)
) STRICT;
CREATE INDEX idx_content_ratings_media ON content_ratings (media_id);

-- shared person pool for cast, crew, guest stars, created_by
-- known_for is NOT here — it's per-appearance, lives on cast_members
CREATE TABLE people (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  profile_photo TEXT
) STRICT;

CREATE TABLE cast_members (
  id         INTEGER PRIMARY KEY,
  media_id   TEXT    NOT NULL REFERENCES media  (id) ON DELETE CASCADE,
  person_id  INTEGER NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  character  TEXT    NOT NULL DEFAULT '',
  cast_order INTEGER NOT NULL DEFAULT 0,
  known_for  TEXT,  -- CastMember.knownFor: per-appearance, not biographical
  UNIQUE (media_id, person_id, character)
) STRICT;
CREATE INDEX idx_cast_media  ON cast_members (media_id, cast_order);
CREATE INDEX idx_cast_person ON cast_members (person_id);

CREATE TABLE crew_members (
  id         INTEGER PRIMARY KEY,
  media_id   TEXT    NOT NULL REFERENCES media  (id) ON DELETE CASCADE,
  person_id  INTEGER NOT NULL REFERENCES people (id) ON DELETE CASCADE,
  job        TEXT    NOT NULL,
  department TEXT    NOT NULL,
  UNIQUE (media_id, person_id, job)
) STRICT;
CREATE INDEX idx_crew_media  ON crew_members (media_id);
CREATE INDEX idx_crew_person ON crew_members (person_id);


CREATE TABLE videos (
  id           TEXT    PRIMARY KEY,
  media_id     TEXT    NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  key          TEXT    NOT NULL,
  site         TEXT    NOT NULL CHECK (site IN ('YouTube', 'Vimeo')),
  type         TEXT    NOT NULL CHECK (type IN (
                 'Trailer', 'Teaser', 'Clip', 'Featurette',
                 'Behind the Scenes', 'Bloopers'
               )),
  official     INTEGER NOT NULL DEFAULT 0 CHECK (official IN (0, 1)),
  published_at TEXT    NOT NULL
) STRICT;
CREATE INDEX idx_videos_media ON videos (media_id, type);

-- width/height/aspect_ratio dropped — tracker, not image CDN
-- vote_average kept for best-image selection
CREATE TABLE media_images (
  id           INTEGER PRIMARY KEY,
  media_id     TEXT    NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  image_type   TEXT    NOT NULL CHECK (image_type IN ('poster', 'backdrop', 'logo')),
  file_path    TEXT    NOT NULL,
  vote_average REAL    NOT NULL DEFAULT 0,
  language     TEXT
) STRICT;
CREATE INDEX idx_images_media_type ON media_images (media_id, image_type);

-- name+poster stored for unsynced targets so UI can render without a second fetch
CREATE TABLE media_related (
  media_id         TEXT    NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  related_media_id TEXT    REFERENCES media (id) ON DELETE SET NULL,  -- lazy FK
  tmdb_id          INTEGER NOT NULL,
  media_type       TEXT    NOT NULL CHECK (media_type IN ('tv', 'movie')),
  relation_type    TEXT    NOT NULL CHECK (relation_type IN ('similar', 'recommendation')),
  name             TEXT    NOT NULL DEFAULT '',
  poster           TEXT,
  PRIMARY KEY (media_id, tmdb_id, media_type, relation_type)
) STRICT;
CREATE INDEX idx_related_media ON media_related (media_id, relation_type);




-- episode_count is TMDB-sourced, not COUNT(episodes) — may exceed local rows
CREATE TABLE seasons (
  id            INTEGER PRIMARY KEY,
  media_id      TEXT    NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  name          TEXT    NOT NULL DEFAULT '',
  overview      TEXT    NOT NULL DEFAULT '',
  poster        TEXT,
  air_date      TEXT,
  episode_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (media_id, season_number)
) STRICT;
CREATE INDEX idx_seasons_media ON seasons (media_id);

-- media_id + season_number denormed to avoid joining through seasons on hot queries
CREATE TABLE episodes (
  id             INTEGER PRIMARY KEY,
  season_id      INTEGER NOT NULL REFERENCES seasons (id) ON DELETE CASCADE,
  media_id       TEXT    NOT NULL REFERENCES media   (id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  season_number  INTEGER NOT NULL,
  name           TEXT    NOT NULL DEFAULT '',
  overview       TEXT    NOT NULL DEFAULT '',
  air_date       TEXT,
  runtime        INTEGER,
  still          TEXT,
  rating         REAL,
  vote_count     INTEGER,
  UNIQUE (media_id, season_number, episode_number)
) STRICT;
CREATE INDEX idx_episodes_season ON episodes (season_id);
CREATE INDEX idx_episodes_media  ON episodes (media_id, season_number, episode_number);

-- name stored directly — no lookup table; JOIN cost exceeds dedup benefit for short strings
-- role is open TEXT: TMDB returns 'director','writer','screenplay','story','creator', etc.
CREATE TABLE episode_crew (
  episode_id INTEGER NOT NULL REFERENCES episodes (id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  role       TEXT    NOT NULL,
  PRIMARY KEY (episode_id, name, role)
) STRICT;
CREATE INDEX idx_episode_crew_name ON episode_crew (name);

CREATE TABLE episode_guest_stars (
  episode_id INTEGER NOT NULL REFERENCES episodes (id) ON DELETE CASCADE,
  person_id  INTEGER NOT NULL REFERENCES people   (id) ON DELETE CASCADE,
  character  TEXT    NOT NULL DEFAULT '',
  cast_order INTEGER NOT NULL DEFAULT 0,
  known_for  TEXT,
  PRIMARY KEY (episode_id, person_id, character)
) STRICT;


-- watch_progress.watched for TV is trigger-maintained — never set by app layer.
-- fully_watched = 1 iff episodes table has rows AND every one has ewp.watched=1.
-- deleted_at: soft delete preserves history when title removed from list.
CREATE TABLE watch_progress (
  profile_id TEXT    NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  media_id   TEXT    NOT NULL REFERENCES media    (id) ON DELETE CASCADE,
  watched    INTEGER NOT NULL DEFAULT 0 CHECK (watched IN (0, 1)),
  watched_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  deleted_at INTEGER,
  PRIMARY KEY (profile_id, media_id)
) STRICT;
CREATE INDEX idx_watch_progress_profile ON watch_progress (profile_id, watched, deleted_at);

CREATE TABLE episode_watch_progress (
  profile_id    TEXT    NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  episode_id    INTEGER NOT NULL REFERENCES episodes (id) ON DELETE CASCADE,
  media_id      TEXT    NOT NULL REFERENCES media    (id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,  -- denorm for per-season rollup without extra join
  watched       INTEGER NOT NULL DEFAULT 0 CHECK (watched IN (0, 1)),
  watched_at    INTEGER,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000),
  PRIMARY KEY (profile_id, episode_id)
) STRICT;
CREATE INDEX idx_ewp_season ON episode_watch_progress (profile_id, media_id, season_number);

-- These three triggers keep watch_progress.watched accurate for TV shows.
-- watched = 1 only when every episode row for this show has ewp.watched = 1.
-- SQLite doesn't support INSERT...ON CONFLICT inside triggers, hence the
-- INSERT OR IGNORE + UPDATE pattern. The logic is the same in all three:
--   total  = how many episodes exist for this show
--   seen   = how many the profile has marked watched
--   result = 1 iff total > 0 AND total = seen

CREATE TRIGGER trg_ewp_after_insert
AFTER INSERT ON episode_watch_progress BEGIN
  INSERT OR IGNORE INTO watch_progress (profile_id, media_id, watched, updated_at)
    VALUES (NEW.profile_id, NEW.media_id, 0, unixepoch('now') * 1000);
  UPDATE watch_progress SET
    watched = (
      WITH
        total(n) AS (SELECT COUNT(*) FROM episodes WHERE media_id = NEW.media_id),
        seen(n)  AS (SELECT COUNT(*) FROM episode_watch_progress
                     WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id AND watched = 1)
      SELECT CASE WHEN total.n > 0 AND total.n = seen.n THEN 1 ELSE 0 END FROM total, seen
    ),
    watched_at = CASE
      WHEN watched = 0 AND (
        WITH
          total(n) AS (SELECT COUNT(*) FROM episodes WHERE media_id = NEW.media_id),
          seen(n)  AS (SELECT COUNT(*) FROM episode_watch_progress
                       WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id AND watched = 1)
        SELECT total.n > 0 AND total.n = seen.n FROM total, seen
      ) THEN unixepoch('now') * 1000
      WHEN watched = 0 THEN NULL
      ELSE watched_at
    END,
    updated_at = unixepoch('now') * 1000
  WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id;
END;

CREATE TRIGGER trg_ewp_after_update
AFTER UPDATE OF watched ON episode_watch_progress BEGIN
  INSERT OR IGNORE INTO watch_progress (profile_id, media_id, watched, updated_at)
    VALUES (NEW.profile_id, NEW.media_id, 0, unixepoch('now') * 1000);
  UPDATE watch_progress SET
    watched = (
      WITH
        total(n) AS (SELECT COUNT(*) FROM episodes WHERE media_id = NEW.media_id),
        seen(n)  AS (SELECT COUNT(*) FROM episode_watch_progress
                     WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id AND watched = 1)
      SELECT CASE WHEN total.n > 0 AND total.n = seen.n THEN 1 ELSE 0 END FROM total, seen
    ),
    watched_at = CASE
      WHEN watched = 0 AND (
        WITH
          total(n) AS (SELECT COUNT(*) FROM episodes WHERE media_id = NEW.media_id),
          seen(n)  AS (SELECT COUNT(*) FROM episode_watch_progress
                       WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id AND watched = 1)
        SELECT total.n > 0 AND total.n = seen.n FROM total, seen
      ) THEN unixepoch('now') * 1000
      WHEN watched = 1 AND (
        WITH
          total(n) AS (SELECT COUNT(*) FROM episodes WHERE media_id = NEW.media_id),
          seen(n)  AS (SELECT COUNT(*) FROM episode_watch_progress
                       WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id AND watched = 1)
        SELECT total.n = 0 OR total.n != seen.n FROM total, seen
      ) THEN NULL
      ELSE watched_at
    END,
    updated_at = unixepoch('now') * 1000
  WHERE profile_id = NEW.profile_id AND media_id = NEW.media_id;
END;

CREATE TRIGGER trg_ewp_after_delete
AFTER DELETE ON episode_watch_progress BEGIN
  INSERT OR IGNORE INTO watch_progress (profile_id, media_id, watched, updated_at)
    VALUES (OLD.profile_id, OLD.media_id, 0, unixepoch('now') * 1000);
  UPDATE watch_progress SET
    watched = (
      WITH
        total(n) AS (SELECT COUNT(*) FROM episodes WHERE media_id = OLD.media_id),
        seen(n)  AS (SELECT COUNT(*) FROM episode_watch_progress
                     WHERE profile_id = OLD.profile_id AND media_id = OLD.media_id AND watched = 1)
      SELECT CASE WHEN total.n > 0 AND total.n = seen.n THEN 1 ELSE 0 END FROM total, seen
    ),
    watched_at = CASE WHEN watched = 0 THEN NULL ELSE watched_at END,
    updated_at = unixepoch('now') * 1000
  WHERE profile_id = OLD.profile_id AND media_id = OLD.media_id;
END;
