-- DropForeignKey
ALTER TABLE "EnterpriseResource" DROP CONSTRAINT "EnterpriseResource_parentId_fkey";

-- AddForeignKey
ALTER TABLE "EnterpriseResource" ADD CONSTRAINT "EnterpriseResource_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EnterpriseResource"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
