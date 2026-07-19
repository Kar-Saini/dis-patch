/*
  Warnings:

  - You are about to drop the column `message` on the `PayslipLog` table. All the data in the column will be lost.
  - Added the required column `message_id` to the `PayslipLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PayslipLog" DROP COLUMN "message",
ADD COLUMN     "message_id" TEXT NOT NULL;
