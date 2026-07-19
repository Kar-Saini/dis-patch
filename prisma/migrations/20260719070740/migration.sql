/*
  Warnings:

  - You are about to drop the column `created_at` on the `PayslipLog` table. All the data in the column will be lost.
  - You are about to drop the column `message_id` on the `PayslipLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PayslipLog" DROP COLUMN "created_at",
DROP COLUMN "message_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "messageId" TEXT;
