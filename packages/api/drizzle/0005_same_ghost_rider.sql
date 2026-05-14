ALTER TABLE "brands" ADD COLUMN "background_color" text;

-- Set up background colors based on the logos we currently have.
UPDATE brands SET background_color = '#FFD100' WHERE name = 'AA';
UPDATE brands SET background_color = '#000000' WHERE name = 'Air New Zealand';
UPDATE brands SET background_color = '#000000' WHERE name = 'City Chic';
UPDATE brands SET background_color = '#ED6A02' WHERE name = 'Everyday Rewards';
UPDATE brands SET background_color = '#FFFFFF' WHERE name = 'Farmers';
UPDATE brands SET background_color = '#ED1D26' WHERE name = 'Hoyts';
UPDATE brands SET background_color = '#000000' WHERE name = 'Living Rewards';
UPDATE brands SET background_color = '#4C1125' WHERE name = 'Muffin Break';
UPDATE brands SET background_color = '#FFFFFF' WHERE name = 'New World';
UPDATE brands SET background_color = '#000000' WHERE name = 'Strandbags';
UPDATE brands SET background_color = '#038736' WHERE name = 'Subway';
UPDATE brands SET background_color = '#D70000' WHERE name = 'Supercheap Auto';
UPDATE brands SET background_color = '#FF0D33' WHERE name = 'The Athlete''s Foot';
UPDATE brands SET background_color = '#FDD300' WHERE name = 'PAK''nSAVE';