-- Add NZ brands with static barcodes or QR codes (issue #170).
-- default_view is left null where the barcode type is unknown.
INSERT INTO brands (name, logo_file, background_color, default_view)
VALUES
  ('Mitre 10 Club', 'mitre-10-v2.png', '#000000', '2D'),
  ('Spotlight VIP Club', 'spotlight-v2.png', '#FFFFFF', '2D'),
  ('IKEA Family', 'ikea-v2.png', '#0058A3', NULL),
  ('Cinebuzz Rewards', 'cinebuzz-v2.png', '#FFFFFF', NULL),
  ('SuperGold Card', 'supergold-v2.png', '#2B2B2B', '2D');
