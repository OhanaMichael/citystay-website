-- ================================================
-- CITY STAY TIBERIAS — Supabase Database Setup
-- ================================================
-- הרץ SQL זה ב-Supabase Dashboard → SQL Editor
-- ================================================

-- ════════════════════════════════════════
-- 1. טבלת חברי מועדון לקוחות
-- ════════════════════════════════════════

CREATE TABLE IF NOT EXISTS club_members (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- פרטים אישיים
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT NOT NULL,
  city            TEXT,

  -- תאריכים חשובים (לשליחת הפתעות)
  birthday        DATE,
  anniversary     DATE,

  -- מקור ההרשמה
  source          TEXT DEFAULT 'website_form',
  notes           TEXT,

  -- ניהול
  is_active       BOOLEAN DEFAULT TRUE,
  is_unsubscribed BOOLEAN DEFAULT FALSE,
  language        TEXT DEFAULT 'he',  -- he / en

  -- חותמות זמן
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════
-- 2. מניעת כפילויות לפי מייל
-- ════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS club_members_email_idx ON club_members (LOWER(email));
CREATE INDEX IF NOT EXISTS club_members_phone_idx ON club_members (phone);
CREATE INDEX IF NOT EXISTS club_members_birthday_idx ON club_members (
  EXTRACT(MONTH FROM birthday),
  EXTRACT(DAY FROM birthday)
);

-- ════════════════════════════════════════
-- 3. עדכון updated_at אוטומטי
-- ════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER club_members_updated_at
  BEFORE UPDATE ON club_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- 4. טבלת הזמנות (לעתיד — מאגר מלא)
-- ════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bookings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id       UUID REFERENCES club_members(id) ON DELETE SET NULL,

  -- פרטי ההזמנה
  wubook_ref      TEXT,               -- מזהה ההזמנה ב-WuBook
  room_type       TEXT,               -- 'family_suite' / 'comfort_room'
  package_type    TEXT,               -- 'room_only' / 'bed_breakfast' / 'attractions'
  attraction      TEXT,               -- אם חבילת אטרקציות

  -- תאריכים
  check_in        DATE,
  check_out       DATE,
  nights          INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,

  -- תמחור
  base_price      NUMERIC(10,2),      -- מחיר לפני מע"מ
  vat_amount      NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(base_price * 0.18, 2)) STORED,
  total_price     NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(base_price * 1.18, 2)) STORED,
  currency        TEXT DEFAULT 'ILS',

  -- אורחים
  adults          INTEGER DEFAULT 2,
  children        INTEGER DEFAULT 0,
  guest_name      TEXT,
  guest_email     TEXT,
  guest_phone     TEXT,

  -- סטטוס
  status          TEXT DEFAULT 'pending', -- pending / confirmed / cancelled
  notes           TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookings_check_in_idx ON bookings (check_in);
CREATE INDEX IF NOT EXISTS bookings_member_idx ON bookings (member_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════
-- 5. טבלת מבצעים ודילים
-- ════════════════════════════════════════

CREATE TABLE IF NOT EXISTS deals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_he        TEXT NOT NULL,      -- כותרת בעברית
  title_en        TEXT,               -- כותרת באנגלית
  description_he  TEXT,
  description_en  TEXT,
  discount_pct    INTEGER,            -- אחוז הנחה
  discount_amount NUMERIC(10,2),      -- סכום הנחה קבוע
  valid_from      DATE,
  valid_until     DATE,
  promo_code      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  applies_to      TEXT DEFAULT 'all', -- 'all' / 'comfort_room' / 'family_suite'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════
-- 6. הגדרות אבטחה (Row Level Security)
-- ════════════════════════════════════════

-- הפעל RLS
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals        ENABLE ROW LEVEL SECURITY;

-- מדיניות: INSERT ציבורי לחברי מועדון (טופס האתר)
CREATE POLICY "public_insert_club_member"
  ON club_members FOR INSERT
  TO anon
  WITH CHECK (TRUE);

-- מדיניות: SELECT/UPDATE/DELETE רק לאדמין
CREATE POLICY "admin_all_club_members"
  ON club_members FOR ALL
  TO authenticated
  USING (TRUE);

-- מדיניות: deals ניתן לקריאה ציבורית (לאתר)
CREATE POLICY "public_read_active_deals"
  ON deals FOR SELECT
  TO anon
  USING (is_active = TRUE AND (valid_until IS NULL OR valid_until >= CURRENT_DATE));

-- מדיניות: אדמין מנהל deals
CREATE POLICY "admin_all_deals"
  ON deals FOR ALL
  TO authenticated
  USING (TRUE);

-- מדיניות: bookings רק לאדמין
CREATE POLICY "admin_all_bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (TRUE);

-- ════════════════════════════════════════
-- 7. View — חברי מועדון פעילים
-- ════════════════════════════════════════

CREATE OR REPLACE VIEW active_club_members AS
SELECT
  id,
  full_name,
  email,
  phone,
  city,
  birthday,
  anniversary,
  source,
  language,
  created_at,
  -- ימי הולדת החודש
  (
    EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM birthday) BETWEEN
      EXTRACT(DAY FROM CURRENT_DATE) AND
      EXTRACT(DAY FROM CURRENT_DATE) + 7
  ) AS birthday_this_week,
  -- יום נישואין החודש
  (
    EXTRACT(MONTH FROM anniversary) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM anniversary) BETWEEN
      EXTRACT(DAY FROM CURRENT_DATE) AND
      EXTRACT(DAY FROM CURRENT_DATE) + 7
  ) AS anniversary_this_week
FROM club_members
WHERE is_active = TRUE AND is_unsubscribed = FALSE;

-- ════════════════════════════════════════
-- 8. View — סטטיסטיקות
-- ════════════════════════════════════════

CREATE OR REPLACE VIEW club_stats AS
SELECT
  COUNT(*)                           AS total_members,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_this_month,
  COUNT(*) FILTER (WHERE birthday IS NOT NULL) AS with_birthday,
  COUNT(*) FILTER (WHERE anniversary IS NOT NULL) AS with_anniversary,
  COUNT(*) FILTER (WHERE city IS NOT NULL) AS with_city
FROM club_members
WHERE is_active = TRUE;

-- ════════════════════════════════════════
-- 9. Storage Bucket לתמונות
-- ════════════════════════════════════════
-- הרץ בנפרד ב-Supabase Dashboard → Storage

-- צור buckets:
-- ├── citystay-rooms      (תמונות חדרים)
-- ├── citystay-packages   (תמונות חבילות)
-- ├── citystay-gallery    (גלריה כללית)
-- └── citystay-hero       (תמונות hero)

-- SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('citystay-rooms',    'citystay-rooms',    TRUE, 5242880, ARRAY['image/jpeg','image/webp','image/png']),
  ('citystay-packages', 'citystay-packages', TRUE, 5242880, ARRAY['image/jpeg','image/webp','image/png']),
  ('citystay-gallery',  'citystay-gallery',  TRUE, 5242880, ARRAY['image/jpeg','image/webp','image/png']),
  ('citystay-hero',     'citystay-hero',     TRUE, 10485760, ARRAY['image/jpeg','image/webp','image/png'])
ON CONFLICT (id) DO NOTHING;

-- מדיניות Storage: קריאה ציבורית, כתיבה רק לאדמין
CREATE POLICY "public_read_images"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id IN ('citystay-rooms','citystay-packages','citystay-gallery','citystay-hero'));

CREATE POLICY "admin_write_images"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id IN ('citystay-rooms','citystay-packages','citystay-gallery','citystay-hero'));

-- ════════════════════════════════════════
-- 10. דוגמת נתונים ראשונית (אופציונלי)
-- ════════════════════════════════════════

INSERT INTO deals (title_he, title_en, description_he, description_en, discount_pct, valid_from, valid_until, promo_code, applies_to)
VALUES (
  'הזמנה מוקדמת — 14 יום מראש',
  'Early Bird — 14 Days Advance',
  'הזמן 14 יום מראש ותוך 10% הנחה על המחיר הרגיל. כולל מע"מ.',
  'Book 14 days in advance and save 10%. VAT included.',
  10,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 months',
  'EARLY10',
  'all'
);
