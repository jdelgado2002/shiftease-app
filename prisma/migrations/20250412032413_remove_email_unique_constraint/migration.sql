-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_locations" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
