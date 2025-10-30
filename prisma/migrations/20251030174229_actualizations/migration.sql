/*
  Warnings:

  - You are about to drop the `GameSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlayerResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_formId_fkey";

-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_hostId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_gameSessionId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_userId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerResponse" DROP CONSTRAINT "PlayerResponse_optionId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerResponse" DROP CONSTRAINT "PlayerResponse_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerResponse" DROP CONSTRAINT "PlayerResponse_questionId_fkey";

-- DropTable
DROP TABLE "GameSession";

-- DropTable
DROP TABLE "Player";

-- DropTable
DROP TABLE "PlayerResponse";
