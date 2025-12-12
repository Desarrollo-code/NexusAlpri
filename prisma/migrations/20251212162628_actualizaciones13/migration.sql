-- DropForeignKey
ALTER TABLE "enterprise_resources" DROP CONSTRAINT "enterprise_resources_parentId_fkey";

-- AddForeignKey
ALTER TABLE "enterprise_resources" ADD CONSTRAINT "enterprise_resources_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "enterprise_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
