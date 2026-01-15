/*
  Warnings:

  - You are about to drop the column `pendingAction` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "pendingAction",
ADD COLUMN     "intent" TEXT;
