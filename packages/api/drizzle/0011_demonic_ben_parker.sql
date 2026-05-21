ALTER TABLE "brands" ADD COLUMN "default_view" text;

UPDATE "brands" SET "default_view" = '1D' WHERE "name" IN (
    'AA',
    'Air New Zealand',
    'City Chic',
    'Everyday Rewards',
    'Farmers',
    'Hoyts',
    'Living Rewards',
    'Mecca',
    'Muffin Break',
    'New World',
    'PAK''nSAVE',
    'Strandbags',
    'Supercheap Auto',
    'The Athlete''s Foot'
);

UPDATE "brands" SET "default_view" = '2D' WHERE "name" IN (
    'Subway'
);