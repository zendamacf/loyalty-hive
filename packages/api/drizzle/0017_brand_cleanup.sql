-- Remove brands that no longer have a card.
-- Subway closed Subcard on 31 August 2026.
-- Club+ replaced New World Clubcard and now covers PAK'nSAVE.
-- Cards that use a removed brand keep their data. Their brand_id becomes null.
DELETE FROM brands WHERE name IN ('Subway', 'New World', 'PAK''nSAVE');

-- Air New Zealand renamed Airpoints to Koru in April 2026.
UPDATE brands SET name = 'Air New Zealand Koru' WHERE name = 'Air New Zealand';
