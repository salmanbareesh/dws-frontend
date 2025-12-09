/*
  # Create scrape_results table

  1. New Tables
    - `scrape_results`
      - `id` (uuid, primary key) - Unique identifier
      - `domain` (text, indexed) - The domain that was scraped
      - `emails` (text array) - Array of email addresses found
      - `socials` (jsonb) - JSON object with social media platforms and links
      - `source` (text) - Source where data was found (e.g., 'footer', 'header')
      - `created_at` (timestamptz) - When the search was performed

  2. Security
    - Enable RLS on `scrape_results` table
    - Add policy to allow public read access (for viewing history)
    - Add policy to allow public insert (for saving new searches)
*/

CREATE TABLE IF NOT EXISTS scrape_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  emails text[] DEFAULT '{}',
  socials jsonb DEFAULT '{}'::jsonb,
  source text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrape_results_domain ON scrape_results(domain);
CREATE INDEX IF NOT EXISTS idx_scrape_results_created_at ON scrape_results(created_at DESC);

ALTER TABLE scrape_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON scrape_results FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert"
  ON scrape_results FOR INSERT
  TO public
  WITH CHECK (true);
