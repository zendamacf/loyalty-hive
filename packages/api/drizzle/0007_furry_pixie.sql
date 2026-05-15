UPDATE brands SET background_color = '#000000' WHERE background_color IS NULL;
ALTER TABLE "brands" ALTER COLUMN "background_color" SET NOT NULL;