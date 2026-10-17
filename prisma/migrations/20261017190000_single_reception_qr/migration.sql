-- Switch to a single reception QR code: remove per-room codes.
DELETE FROM "QrCode" WHERE "roomId" IS NOT NULL;
