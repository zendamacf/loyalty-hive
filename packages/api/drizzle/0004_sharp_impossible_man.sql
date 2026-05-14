-- Getting rid of some brands that no longer have loyalty cards in New Zealand.
DELETE FROM brands WHERE name IN ('Adairs', 'BP', 'EB Games', 'Flybuys', 'Woolworths');

-- Some brands that don't need to be set up just yet.
DELETE FROM brands WHERE name in (
    'ASOS',
    'Ballantynes',
    'Booking.com',
    'Briscoes',
    'Bunnings Warehouse',
    'Burnsco',
    'Coffee Culture',
    'Cotton On',
    'Culture Kings',
    'Foot Locker',
    'Hachi Hachi',
    'Health 2000',
    'Jaycar',
    'JB Hi-Fi',
    'Just Jeans',
    'Kathmandu',
    'Kmart',
    'Lego',
    'Mecca',
    'Millers',
    'Mitre 10',
    'Mobile City',
    'Mountain Warehouse',
    'Noel Leeming',
    'Paper Plus',
    'PB Tech',
    'PlaceMakers',
    'Postie',
    'Rebel Sport',
    'Repco',
    'Resene',
    'Sephora',
    'SHEIN',
    'Spotlight',
    'SuperGold',
    'Taking Shape',
    'The Warehouse',
    'Uber Eats',
    'Whitcolls'
);

-- Setup brand logo URLs
UPDATE brands SET logo_url = 'aa.png' WHERE name = 'AA';
UPDATE brands SET logo_url = 'air-new-zealand.png' WHERE name = 'Air New Zealand';
UPDATE brands SET logo_url = 'city-chic.jpeg' WHERE name = 'City Chic';
UPDATE brands SET logo_url = 'everyday-rewards.png' WHERE name = 'Everyday Rewards';
UPDATE brands SET logo_url = 'farmers.png' WHERE name = 'Farmers';
UPDATE brands SET logo_url = 'hoyts.png' WHERE name = 'Hoyts';
UPDATE brands SET logo_url = 'living-rewards.png' WHERE name = 'Living Rewards';
UPDATE brands SET logo_url = 'muffin-break.png' WHERE name = 'Muffin Break';
UPDATE brands SET logo_url = 'new-world.png' WHERE name = 'New World';
UPDATE brands SET logo_url = 'pak-n-save.png' WHERE name = 'PAK''nSAVE';
UPDATE brands SET logo_url = 'strandbags.png' WHERE name = 'Strandbags';
UPDATE brands SET logo_url = 'subway.png' WHERE name = 'Subway';
UPDATE brands SET logo_url = 'supercheap-auto.jpg' WHERE name = 'Supercheap Auto';
UPDATE brands SET logo_url = 'the-athlete-s-foot.png' WHERE name = 'The Athlete''s Foot';
