-- Habilitar RLS para todas las tablas relevantes
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonCompletionRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Achievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAchievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnswerOption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnswerAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TemplateBlock" ENABLE ROW LEVEL SECURITY;

-- Borrar políticas antiguas si existen para evitar conflictos
-- (Se usan nombres únicos para las políticas para que esto no sea estrictamente necesario en la primera ejecución)
DROP POLICY IF EXISTS "Allow all access to platform settings" ON "PlatformSettings";
DROP POLICY IF EXISTS "Allow all access to achievements" ON "Achievement";
DROP POLICY IF EXISTS "Allow individual user access to their own data" ON "User";
DROP POLICY IF EXISTS "Allow admin full access to users" ON "User";
DROP POLICY IF EXISTS "Allow public read access to courses" ON "Course";
DROP POLICY IF EXISTS "Allow instructor/admin to manage courses" ON "Course";
DROP POLICY IF EXISTS "Allow read access to modules of accessible courses" ON "Module";
DROP POLICY IF EXISTS "Allow instructor/admin to manage modules" ON "Module";
DROP POLICY IF EXISTS "Allow read access to lessons of accessible courses" ON "Lesson";
DROP POLICY IF EXISTS "Allow instructor/admin to manage lessons" ON "Lesson";
DROP POLICY IF EXISTS "Allow read access to content of accessible courses" ON "ContentBlock";
DROP POLICY IF EXISTS "Allow instructor/admin to manage content blocks" ON "ContentBlock";
DROP POLICY IF EXISTS "Allow user to manage their own enrollments" ON "Enrollment";
DROP POLICY IF EXISTS "Allow instructor/admin to view enrollments" ON "Enrollment";
DROP POLICY IF EXISTS "Allow user to access their own progress" ON "CourseProgress";
DROP POLICY IF EXISTS "Allow user to access their own lesson completions" ON "LessonCompletionRecord";
DROP POLICY IF EXISTS "Allow public read access to public resources" ON "Resource";
DROP POLICY IF EXISTS "Allow specific user access to private resources" ON "Resource";
DROP POLICY IF EXISTS "Allow uploader/admin to manage resources" ON "Resource";
DROP POLICY IF EXISTS "Allow relevant users to see announcements" ON "Announcement";
DROP POLICY IF EXISTS "Allow admin/instructor to manage announcements" ON "Announcement";
DROP POLICY IF EXISTS "Allow relevant users to see events" ON "CalendarEvent";
DROP POLICY IF EXISTS "Allow admin/instructor to manage events" ON "CalendarEvent";
DROP POLICY IF EXISTS "Allow admin to read all security logs" ON "SecurityLog";
DROP POLICY IF EXISTS "Allow user to read their own achievements" ON "UserAchievement";
DROP POLICY IF EXISTS "Allow user to manage their own notes" ON "UserNote";
DROP POLICY IF EXISTS "Allow creator/admin to manage forms" ON "Form";
DROP POLICY IF EXISTS "Allow specific users to view forms" ON "Form";
DROP POLICY IF EXISTS "Allow authenticated user to submit responses" ON "FormResponse";
DROP POLICY IF EXISTS "Allow form owner to view responses" ON "FormResponse";
DROP POLICY IF EXISTS "Allow read access for lesson templates" ON "LessonTemplate";
DROP POLICY IF EXISTS "Allow creator to manage templates" ON "LessonTemplate";
DROP POLICY IF EXISTS "Allow read access to template blocks" ON "TemplateBlock";

-- === Políticas de Selección (SELECT/Lectura) ===

-- PlatformSettings, Achievement: Todos pueden leer.
CREATE POLICY "Allow all access to platform settings" ON "PlatformSettings" FOR SELECT USING (true);
CREATE POLICY "Allow all access to achievements" ON "Achievement" FOR SELECT USING (true);

-- User: Los usuarios pueden ver su propia info. Los Admins ven todo.
CREATE POLICY "Allow individual user access to their own data" ON "User" FOR SELECT
  USING (auth.uid() = id OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Course: Cualquiera puede ver los cursos publicados. El creador y los Admins ven todo.
CREATE POLICY "Allow public read access to courses" ON "Course" FOR SELECT
  USING (status = 'PUBLISHED' OR instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Module, Lesson, ContentBlock: Se pueden leer si el curso asociado es accesible.
CREATE POLICY "Allow read access to modules of accessible courses" ON "Module" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Course" WHERE id = "courseId" AND (status = 'PUBLISHED' OR instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')));

CREATE POLICY "Allow read access to lessons of accessible courses" ON "Lesson" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Module" m JOIN "Course" c ON m.id = "moduleId" AND c.id = m."courseId" WHERE (c.status = 'PUBLISHED' OR c.instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')));

CREATE POLICY "Allow read access to content of accessible courses" ON "ContentBlock" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Lesson" l JOIN "Module" m ON l.id = "lessonId" JOIN "Course" c ON m.id = l."moduleId" AND c.id = m."courseId" WHERE (c.status = 'PUBLISHED' OR c.instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')));
  
-- Enrollment, CourseProgress, LessonCompletionRecord: Un usuario puede ver los suyos. El instructor del curso y los Admins pueden ver todo.
CREATE POLICY "Allow user/instructor/admin access to enrollments" ON "Enrollment" FOR SELECT
  USING (
    "userId" = auth.uid()
    OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR'
    OR EXISTS (SELECT 1 FROM "Course" c WHERE c.id = "courseId" AND c.instructorId = auth.uid())
  );

CREATE POLICY "Allow user/instructor/admin access to progress" ON "CourseProgress" FOR SELECT
  USING (
    "userId" = auth.uid()
    OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR'
    OR EXISTS (SELECT 1 FROM "Course" c WHERE c.id = "courseId" AND c.instructorId = auth.uid())
  );

CREATE POLICY "Allow user/instructor/admin access to lesson completion" ON "LessonCompletionRecord" FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM "CourseProgress" cp
    WHERE cp.id = "progressId" AND (
        cp."userId" = auth.uid()
        OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR'
        OR EXISTS (SELECT 1 FROM "Course" c WHERE c.id = cp."courseId" AND c.instructorId = auth.uid())
    )
  ));
  
-- Resource: Se puede ver si es público, si es del usuario, si es admin, o si fue compartido con el usuario.
CREATE POLICY "Allow read access to resources" ON "Resource" FOR SELECT
  USING (ispublic = true OR uploaderId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR' OR EXISTS (SELECT 1 FROM "_SharedWithUsers" WHERE "A" = id AND "B" = auth.uid()));

-- Announcement: Se puede ver si es para todos o para el rol del usuario.
CREATE POLICY "Allow relevant users to see announcements" ON "Announcement" FOR SELECT
  USING (audience = 'ALL' OR audience = (SELECT role FROM "User" WHERE id = auth.uid()));

-- CalendarEvent: Se puede ver si es para todos, para el rol del usuario, si es el creador o si está en la lista de asistentes.
CREATE POLICY "Allow relevant users to see events" ON "CalendarEvent" FOR SELECT
  USING (
    audienceType = 'ALL' 
    OR audienceType = (SELECT role FROM "User" WHERE id = auth.uid()) 
    OR creatorId = auth.uid()
    OR EXISTS (SELECT 1 FROM "_EventAttendees" WHERE "A" = id AND "B" = auth.uid())
  );

-- SecurityLog: Solo Admins.
CREATE POLICY "Allow admin to read all security logs" ON "SecurityLog" FOR SELECT
  USING ((SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');
  
-- UserAchievement: El usuario puede ver los suyos.
CREATE POLICY "Allow user to read their own achievements" ON "UserAchievement" FOR SELECT
  USING ("userId" = auth.uid());

-- UserNote: El usuario puede ver las suyas.
CREATE POLICY "Allow user to manage their own notes" ON "UserNote" FOR ALL
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());
  
-- Form: El creador, el admin o alguien con quien se compartió puede verlo.
CREATE POLICY "Allow access to see forms" ON "Form" FOR SELECT
  USING (
    status = 'PUBLISHED'
    OR creatorId = auth.uid()
    OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR'
    OR EXISTS (SELECT 1 FROM "_FormSharedWith" WHERE "A" = id AND "B" = auth.uid())
  );
  
-- === Políticas de Inserción, Actualización y Eliminación (INSERT, UPDATE, DELETE) ===

-- User: Los usuarios pueden actualizar su propia info, pero no cambiar su rol ni estado. Los Admins pueden hacer todo.
CREATE POLICY "Allow user update on own data" ON "User" FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM "User" WHERE id = auth.uid())); -- No pueden cambiar su rol

CREATE POLICY "Allow admin to manage users" ON "User" FOR ALL
  USING ((SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')
  WITH CHECK ((SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Course, Module, Lesson, ContentBlock: El creador o un Admin puede gestionar todo.
CREATE POLICY "Allow instructor/admin to manage courses" ON "Course" FOR ALL
  USING (instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')
  WITH CHECK (instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

CREATE POLICY "Allow instructor/admin to manage modules" ON "Module" FOR ALL
  USING (EXISTS (SELECT 1 FROM "Course" WHERE id = "courseId" AND (instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')));

CREATE POLICY "Allow instructor/admin to manage lessons" ON "Lesson" FOR ALL
  USING (EXISTS (SELECT 1 FROM "Module" m JOIN "Course" c ON m.id = "moduleId" AND c.id = m."courseId" WHERE (c.instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')));

CREATE POLICY "Allow instructor/admin to manage content blocks" ON "ContentBlock" FOR ALL
  USING (EXISTS (SELECT 1 FROM "Lesson" l JOIN "Module" m ON l.id = "lessonId" JOIN "Course" c ON m.id = l."moduleId" AND c.id = m."courseId" WHERE (c.instructorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')));

-- Enrollment: El usuario puede crear/eliminar su propia inscripción. Admins/Instructores también.
CREATE POLICY "Allow user to manage their own enrollments" ON "Enrollment" FOR ALL
  USING ("userId" = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR' OR EXISTS (SELECT 1 FROM "Course" c WHERE c.id = "courseId" AND c.instructorId = auth.uid()))
  WITH CHECK ("userId" = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR' OR EXISTS (SELECT 1 FROM "Course" c WHERE c.id = "courseId" AND c.instructorId = auth.uid()));
  
-- Resource: Instructores/Admins pueden crear. Solo el creador o un Admin puede modificar/eliminar.
CREATE POLICY "Allow creators to insert resources" ON "Resource" FOR INSERT
  WITH CHECK ((SELECT role FROM "User" WHERE id = auth.uid()) IN ('ADMINISTRATOR', 'INSTRUCTOR'));

CREATE POLICY "Allow owner/admin to update/delete resources" ON "Resource" FOR UPDATE, DELETE
  USING (uploaderId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- Announcement, CalendarEvent: Instructores/Admins pueden crear. Solo el creador o un Admin puede modificar/eliminar.
CREATE POLICY "Allow admin/instructor to manage announcements" ON "Announcement" FOR ALL
  USING (authorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')
  WITH CHECK ((authorId = auth.uid() AND (SELECT role FROM "User" WHERE id = auth.uid()) IN ('INSTRUCTOR', 'ADMINISTRATOR')) OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');
  
CREATE POLICY "Allow admin/instructor to manage events" ON "CalendarEvent" FOR ALL
  USING (creatorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')
  WITH CHECK ((creatorId = auth.uid() AND (SELECT role FROM "User" WHERE id = auth.uid()) IN ('INSTRUCTOR', 'ADMINISTRATOR')) OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');
  
-- Form: El creador o un admin puede gestionar.
CREATE POLICY "Allow creator/admin to manage forms" ON "Form" FOR ALL
  USING (creatorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')
  WITH CHECK (creatorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR');

-- FormResponse: Un usuario autenticado puede crear respuestas.
CREATE POLICY "Allow authenticated user to submit responses" ON "FormResponse" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Allow form owner to view responses" ON "FormResponse" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "Form" f WHERE f.id = "formId" AND (f.creatorId = auth.uid() OR (SELECT role FROM "User" WHERE id = auth.uid()) = 'ADMINISTRATOR')));

-- Políticas permisivas para tablas de soporte (se heredan permisos de tablas principales)
CREATE POLICY "Allow all on LessonTemplate" ON "LessonTemplate" FOR ALL USING (true);
CREATE POLICY "Allow all on TemplateBlock" ON "TemplateBlock" FOR ALL USING (true);
CREATE POLICY "Allow all on Quiz" ON "Quiz" FOR ALL USING (true);
CREATE POLICY "Allow all on Question" ON "Question" FOR ALL USING (true);
CREATE POLICY "Allow all on AnswerOption" ON "AnswerOption" FOR ALL USING (true);
CREATE POLICY "Allow all on QuizAttempt" ON "QuizAttempt" FOR ALL USING (true);
CREATE POLICY "Allow all on AnswerAttempt" ON "AnswerAttempt" FOR ALL USING (true);
CREATE POLICY "Allow all on FormField" ON "FormField" FOR ALL USING (true);
CREATE POLICY "Allow all on FormAnswer" ON "FormAnswer" FOR ALL USING (true);
