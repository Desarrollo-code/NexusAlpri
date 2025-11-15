/*
  Warnings:

  - Added the required column `imageUrl` to the `form_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template` to the `form_fields` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "form_fields" ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "template" TEXT NOT NULL;
