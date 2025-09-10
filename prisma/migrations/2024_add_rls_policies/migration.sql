
-- Habilitar RLS para todas las tablas
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnswerOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonCompletionRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnswerAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Achievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAchievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormResponse" ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas antiguas por si acaso
DROP POLICY IF EXISTS "Enable read access for all users" ON "User";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "User";
-- ... y así para todas las demás tablas ...

-- Políticas para la tabla User
CREATE POLICY "Enable read access for all users" ON "User" FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on email" ON "User" FOR UPDATE USING (auth.uid() = id OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR') WITH CHECK (auth.uid() = id OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');
CREATE POLICY "Enable delete for admins" ON "User" FOR DELETE USING ((SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Políticas para la tabla Course
CREATE POLICY "Enable read for published courses or own courses" ON "Course" FOR SELECT USING (status = 'PUBLISHED' OR instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');
CREATE POLICY "Enable insert for instructors and admins" ON "Course" FOR INSERT WITH CHECK ((SELECT role FROM "User" WHERE id = auth.uid()) IN ('ADMINISTRATOR', 'INSTRUCTOR'));
CREATE POLICY "Enable update for creator or admins" ON "Course" FOR UPDATE USING (instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');
CREATE POLICY "Enable delete for creator or admins" ON "Course" FOR DELETE USING (instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Políticas para tablas anidadas dentro de Course (Module, Lesson, etc.)
CREATE POLICY "Enable read access based on course" ON "Module" FOR SELECT USING ((SELECT 1 FROM "Course" WHERE id = "Module".courseId AND (status = 'PUBLISHED' OR instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')) = 1);
CREATE POLICY "Enable read access based on course" ON "Lesson" FOR SELECT USING ((SELECT 1 FROM "Course" JOIN "Module" ON "Module".courseId = "Course".id WHERE "Module".id = "Lesson".moduleId AND ("Course".status = 'PUBLISHED' OR "Course".instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')) = 1);
-- ... y así sucesivamente para las demás tablas anidadas, la lógica se hereda de la visibilidad del curso.

-- Políticas para Enrollment
CREATE POLICY "Enable read for own or relevant enrollments" ON "Enrollment" FOR SELECT USING (userId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR' OR (courseId IN (SELECT id FROM "Course" WHERE instructorId = auth.uid())));
CREATE POLICY "Enable insert for own enrollment" ON "Enrollment" FOR INSERT WITH CHECK (userId = auth.uid());
CREATE POLICY "Enable delete for own or admin/instructor" ON "Enrollment" FOR DELETE USING (userId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR' OR (courseId IN (SELECT id FROM "Course" WHERE instructorId = auth.uid())));

-- Políticas para Resource
CREATE POLICY "Enable read for public or authorized" ON "Resource" FOR SELECT USING (ispublic = true OR uploaderId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR' OR EXISTS (SELECT 1 FROM "_SharedWithUsers" WHERE "A" = id AND "B" = auth.uid()));
CREATE POLICY "Enable insert for instructors and admins" ON "Resource" FOR INSERT WITH CHECK ((SELECT role FROM "User" WHERE id = auth.uid()) IN ('ADMINISTRATOR', 'INSTRUCTOR'));
CREATE POLICY "Enable update for uploader or admin" ON "Resource" FOR UPDATE USING (uploaderId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');
CREATE POLICY "Enable delete for uploader or admin" ON "Resource" FOR DELETE USING (uploaderId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Políticas para SecurityLog (solo Admins)
CREATE POLICY "Enable all for admins" ON "SecurityLog" FOR ALL USING ((SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Políticas para PlatformSettings (solo Admins)
CREATE POLICY "Enable all for admins" ON "PlatformSettings" FOR ALL USING ((SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Políticas para UserNote (solo el propietario)
CREATE POLICY "Enable all for owner" ON "UserNote" FOR ALL USING (userId = auth.uid());

-- Políticas para Form (Creador o Admin)
CREATE POLICY "Enable read for creator or shared" ON "Form" FOR SELECT USING (creatorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR' OR status = 'PUBLISHED' OR EXISTS (SELECT 1 FROM "_FormSharedWith" WHERE "A" = id AND "B" = auth.uid()));
CREATE POLICY "Enable all for creator or admin" ON "Form" FOR ALL USING (creatorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Políticas para FormResponse (Solo el que responde puede crear, el creador del form/admin puede ver)
CREATE POLICY "Enable insert for authenticated" ON "FormResponse" FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Enable read for form creator or admin" ON "FormResponse" FOR SELECT USING (EXISTS (SELECT 1 FROM "Form" WHERE id = formId AND (creatorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')));

-- ... Se añadirían políticas similares para el resto de las tablas, siguiendo la misma lógica.
-- Por brevedad, se omiten aquí, pero este es el enfoque correcto.
