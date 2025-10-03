-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "certificateTemplateId" TEXT;

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "background_image_url" TEXT NOT NULL,
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "student_name_position" JSONB NOT NULL DEFAULT '{"x": 100, "y": 200, "fontSize": 32, "fontWeight": "bold"}',
    "course_name_position" JSONB NOT NULL DEFAULT '{"x": 100, "y": 300, "fontSize": 24, "fontWeight": "normal"}',
    "date_position" JSONB NOT NULL DEFAULT '{"x": 100, "y": 400, "fontSize": 18, "fontWeight": "normal"}',
    "score_position" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_name_key" ON "certificate_templates"("name");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_certificateTemplateId_fkey" FOREIGN KEY ("certificateTemplateId") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
