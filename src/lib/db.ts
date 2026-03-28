import Database from "better-sqlite3";
import path from "path";
import { ScoredLead } from "./scoring";

const DB_PATH = path.join(process.cwd(), "leads.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initDb(db);
  }
  return db;
}

function initDb(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      website TEXT,
      rating REAL,
      review_count INTEGER,
      business_type TEXT,
      lat REAL,
      lng REAL,
      google_maps_url TEXT,
      has_website TEXT DEFAULT 'none',
      social_facebook TEXT,
      social_instagram TEXT,
      has_social INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      score_breakdown TEXT,
      status TEXT DEFAULT 'new',
      notes TEXT,
      saved_at TEXT DEFAULT (datetime('now')),
      contacted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(total_score DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  `);
}

export function saveLead(lead: ScoredLead): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO leads (
      place_id, name, address, phone, website, rating, review_count,
      business_type, lat, lng, google_maps_url, has_website,
      social_facebook, social_instagram, has_social,
      total_score, score_breakdown, status
    ) VALUES (
      @place_id, @name, @address, @phone, @website, @rating, @review_count,
      @business_type, @lat, @lng, @google_maps_url, @has_website,
      @social_facebook, @social_instagram, @has_social,
      @total_score, @score_breakdown, 'new'
    )
  `);

  stmt.run({
    place_id: lead.place_id,
    name: lead.name,
    address: lead.address,
    phone: lead.phone || null,
    website: lead.website || null,
    rating: lead.rating || null,
    review_count: lead.review_count || null,
    business_type: lead.business_type,
    lat: lead.lat,
    lng: lead.lng,
    google_maps_url: lead.google_maps_url,
    has_website: lead.has_website,
    social_facebook: lead.social_media.facebook || null,
    social_instagram: lead.social_media.instagram || null,
    has_social: lead.social_media.has_any ? 1 : 0,
    total_score: lead.score.total,
    score_breakdown: JSON.stringify(lead.score),
  });
}

export function saveLeads(leads: ScoredLead[]): void {
  const database = getDb();
  const transaction = database.transaction(() => {
    for (const lead of leads) {
      saveLead(lead);
    }
  });
  transaction();
}

export function getLeads(
  options: {
    status?: string;
    minScore?: number;
    businessType?: string;
    limit?: number;
    offset?: number;
  } = {}
): Array<ScoredLead & { id: number; status: string; notes: string; saved_at: string; contacted_at: string }> {
  const database = getDb();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (options.status) {
    conditions.push("status = @status");
    params.status = options.status;
  }
  if (options.minScore !== undefined) {
    conditions.push("total_score >= @minScore");
    params.minScore = options.minScore;
  }
  if (options.businessType) {
    conditions.push("business_type LIKE @businessType");
    params.businessType = `%${options.businessType}%`;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options.limit || 100;
  const offset = options.offset || 0;

  const rows = database
    .prepare(`SELECT * FROM leads ${where} ORDER BY total_score DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset }) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    place_id: row.place_id as string,
    name: row.name as string,
    address: row.address as string,
    phone: row.phone as string | undefined,
    website: row.website as string | undefined,
    rating: row.rating as number | undefined,
    review_count: row.review_count as number | undefined,
    business_type: row.business_type as string,
    lat: row.lat as number,
    lng: row.lng as number,
    google_maps_url: row.google_maps_url as string,
    has_website: row.has_website as "none" | "basic" | "full",
    social_media: {
      facebook: row.social_facebook as string | undefined,
      instagram: row.social_instagram as string | undefined,
      has_any: (row.has_social as number) === 1,
    },
    score: JSON.parse(row.score_breakdown as string),
    id: row.id as number,
    status: row.status as string,
    notes: row.notes as string,
    saved_at: row.saved_at as string,
    contacted_at: row.contacted_at as string,
  }));
}

export function updateLeadStatus(placeId: string, status: string, notes?: string): void {
  const database = getDb();
  if (notes !== undefined) {
    database
      .prepare("UPDATE leads SET status = @status, notes = @notes, contacted_at = datetime('now') WHERE place_id = @placeId")
      .run({ status, notes, placeId });
  } else {
    database
      .prepare("UPDATE leads SET status = @status WHERE place_id = @placeId")
      .run({ status, placeId });
  }
}

export function deleteLead(placeId: string): void {
  const database = getDb();
  database.prepare("DELETE FROM leads WHERE place_id = @placeId").run({ placeId });
}

export function getLeadStats(): { total: number; new: number; contacted: number; converted: number; avgScore: number } {
  const database = getDb();
  const stats = database
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
        AVG(total_score) as avg_score
      FROM leads`
    )
    .get() as Record<string, number>;

  return {
    total: stats.total || 0,
    new: stats.new_count || 0,
    contacted: stats.contacted || 0,
    converted: stats.converted || 0,
    avgScore: Math.round(stats.avg_score || 0),
  };
}
