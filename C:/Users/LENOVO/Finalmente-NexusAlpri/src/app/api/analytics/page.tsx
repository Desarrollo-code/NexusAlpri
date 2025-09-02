// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id                    String                 @id @default(cuid())
  email                 String                 @unique
  name                  String
  password              String
  role                  UserRole               @default(STUDENT)
  avatar                String?
  xp                    Int                    @default(0)
  registeredDate        DateTime               @default(now())
  isActive              Boolean                @default(true)
  isTwoFactorEnabled    Boolean                @default(false)
  twoFactorSecret       String?
  theme                 String?
  enrollments           Enrollment[]
  coursesAsInstructor   Course[]               @relation("InstructorCourses")
  uploadedResources     Resource[]             @relation("Uploader")
  announcements         Announcement[]         @relation("Author")
  createdEvents         CalendarEvent[]        @relation("Creator")
  attendedEvents        CalendarEvent[]        @relation("Attendees")
  courseProgress        CourseProgress[]
  userNotes             UserNote[]
  securityLogs          SecurityLog[]
  createdLessonTemplates LessonTemplate[]
  createdForms          Form[]                 @relation("FormCreator")
  sharedForms           Form[]                 @relation("FormSharedWith")
  formResponses         FormResponse[]
  quizAttempts          QuizAttempt[]
  achievements          UserAchievement[]
  notifications         Notification[]
  sharedResources       Resource[]             @relation("ResourceSharedWith")
}

enum UserRole {
  ADMINISTRATOR
  INSTRUCTOR
  STUDENT
}

model Course {
  id              String           @id @default(cuid())
  title           String
  description     String           @db.Text
  imageUrl        String?
  category        String?
  status          CourseStatus     @default(DRAFT)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  publicationDate DateTime?
  instructor      User             @relation("InstructorCourses", fields: [instructorId], references: [id], onDelete: Cascade)
  instructorId    String
  modules         Module[]
  enrollments     Enrollment[]
  progress        CourseProgress[]
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Module {
  id        String   @id @default(cuid())
  title     String
  order     Int
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId  String
  lessons   Lesson[]
}

model Lesson {
  id            String                 @id @default(cuid())
  title         String
  order         Int
  module        Module                 @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  moduleId      String
  contentBlocks ContentBlock[]
  completions   LessonCompletionRecord[]
  userNotes     UserNote[]
  templates     LessonTemplate[]
}

model ContentBlock {
  id        String     @id @default(cuid())
  type      LessonType
  content   String?    @db.Text
  order     Int
  lesson    Lesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  lessonId  String
  quiz      Quiz?
}

enum LessonType {
  TEXT
  VIDEO
  QUIZ
  FILE
}

model Quiz {
  id           String        @id @default(cuid())
  title        String
  description  String?       @db.Text
  maxAttempts  Int?
  contentBlock ContentBlock  @relation(fields: [contentBlockId], references: [id], onDelete: Cascade)
  contentBlockId String      @unique
  questions    Question[]
  attempts     QuizAttempt[]
}

model Question {
  id       String         @id @default(cuid())
  text     String         @db.Text
  order    Int
  quiz     Quiz           @relation(fields: [quizId], references: [id], onDelete: Cascade)
  quizId   String
  options  AnswerOption[]
  attempts AnswerAttempt[]
}

model AnswerOption {
  id          String          @id @default(cuid())
  text        String
  isCorrect   Boolean         @default(false)
  feedback    String?         @db.Text
  question    Question        @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionId  String
  AnswerAttempt AnswerAttempt[]
}

model QuizAttempt {
  id            String          @id @default(cuid())
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String
  quiz          Quiz            @relation(fields: [quizId], references: [id], onDelete: Cascade)
  quizId        String
  attemptNumber Int
  score         Float
  submittedAt   DateTime        @default(now())
  answers       AnswerAttempt[]
}

model AnswerAttempt {
  id               String       @id @default(cuid())
  attempt          QuizAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  attemptId        String
  question         Question     @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionId       String
  selectedOption   AnswerOption @relation(fields: [selectedOptionId], references: [id], onDelete: Cascade)
  selectedOptionId String
}

model Enrollment {
  id          String         @id @default(cuid())
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String
  course      Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId    String
  enrolledAt  DateTime       @default(now())
  progress    CourseProgress?

  @@unique([userId, courseId])
}

model CourseProgress {
  id                  String                   @id @default(cuid())
  user                User                     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId              String
  course              Course                   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId            String
  progressPercentage  Float?
  completedAt         DateTime?
  enrollment          Enrollment               @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  enrollmentId        String                   @unique
  completedLessons    LessonCompletionRecord[]
}

model LessonCompletionRecord {
  id           String         @id @default(cuid())
  progress     CourseProgress @relation(fields: [progressId], references: [id], onDelete: Cascade)
  progressId   String
  lesson       Lesson         @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  lessonId     String
  type         String // "view", "quiz", "video"
  score        Float? // Score for quiz type
  completedAt  DateTime       @default(now())

  @@unique([progressId, lessonId])
}

model UserNote {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  lessonId  String
  content   String   @db.Text
  color     String   @default("yellow")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, lessonId])
}

// Modelos para la Biblioteca de Recursos
model Resource {
  id          String     @id @default(cuid())
  title       String
  description String?    @db.Text
  type        ResourceType
  category    String?
  tags        String? // Comma-separated
  url         String?
  uploadDate  DateTime   @default(now())
  uploaderId  String?
  uploader    User?      @relation("Uploader", fields: [uploaderId], references: [id], onDelete: SetNull)
  hasPin      Boolean    @default(false)
  pin         String?
  parentId    String?
  parent      Resource?  @relation("FolderChildren", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children    Resource[] @relation("FolderChildren")
  ispublic    Boolean    @default(true)
  sharedWith  User[]     @relation("ResourceSharedWith")
}

enum ResourceType {
  FOLDER
  DOCUMENT
  GUIDE
  MANUAL
  POLICY
  VIDEO
  EXTERNAL_LINK
  OTHER
}

// Modelos de Comunicación
model Announcement {
  id         String   @id @default(cuid())
  title      String
  content    String   @db.Text
  date       DateTime @default(now())
  authorId   String
  author     User     @relation("Author", fields: [authorId], references: [id], onDelete: Cascade)
  audience   Json     @default("\"ALL\"") // "ALL", ["STUDENT"], ["INSTRUCTOR"], etc.
  priority   String   @default("Normal")
}

model CalendarEvent {
  id                  String   @id @default(cuid())
  title               String
  description         String?  @db.Text
  start               DateTime
  end                 DateTime
  allDay              Boolean  @default(false)
  location            String?
  videoConferenceLink String?
  attachments         Json?
  color               String   @default("blue")
  creatorId           String
  creator             User     @relation("Creator", fields: [creatorId], references: [id], onDelete: Cascade)
  audienceType        String // ALL, ADMINISTRATOR, INSTRUCTOR, STUDENT, SPECIFIC
  attendees           User[]   @relation("Attendees")
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String
  link        String?
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
}

// Modelos para Plantillas
model LessonTemplate {
  id             String          @id @default(cuid())
  name           String
  description    String?         @db.Text
  type           TemplateType    @default(USER) // SYSTEM or USER
  creatorId      String?
  creator        User?           @relation(fields: [creatorId], references: [id], onDelete: SetNull)
  lessonId       String?         @unique // Original lesson this was created from
  lesson         Lesson?         @relation(fields: [lessonId], references: [id], onDelete: SetNull)
  templateBlocks TemplateBlock[]
}

enum TemplateType {
  SYSTEM
  USER
}

model TemplateBlock {
  id         String         @id @default(cuid())
  type       LessonType
  order      Int
  template   LessonTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  templateId String
}

// Modelos para Formularios
model Form {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  status      FormStatus @default(DRAFT)
  isQuiz      Boolean  @default(false)
  creatorId   String
  creator     User     @relation("FormCreator", fields: [creatorId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  fields      FormField[]
  responses   FormResponse[]
  sharedWith  User[]       @relation(name: "FormSharedWith")
}

enum FormStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model FormField {
  id          String        @id @default(cuid())
  label       String
  type        FormFieldType
  options     Json? // [{ id, text, isCorrect, points }]
  required    Boolean       @default(false)
  placeholder String?
  order       Int
  form        Form          @relation(fields: [formId], references: [id], onDelete: Cascade)
  formId      String
  answers     FormResponseAnswer[]
}

enum FormFieldType {
  SHORT_TEXT
  LONG_TEXT
  SINGLE_CHOICE
  MULTIPLE_CHOICE
}

model FormResponse {
  id          String   @id @default(cuid())
  formId      String
  form        Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  submittedAt DateTime @default(now())
  score       Float? // Percentage score if it's a quiz
  answers     FormResponseAnswer[]
}

model FormResponseAnswer {
  id         String       @id @default(cuid())
  responseId String
  response   FormResponse @relation(fields: [responseId], references: [id], onDelete: Cascade)
  fieldId    String
  field      FormField    @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  value      String       @db.Text
}

// --- GAMIFICATION ---
model Achievement {
  id          String            @id @default(cuid())
  slug        AchievementSlug   @unique
  name        String
  description String
  points      Int
  icon        String?
  users       UserAchievement[]
}

model UserAchievement {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievementId String
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  unlockedAt    DateTime    @default(now())

  @@unique([userId, achievementId])
}

enum AchievementSlug {
  FIRST_ENROLLMENT
  FIRST_COURSE_COMPLETED
  PERFECT_QUIZ_SCORE
  FIVE_COURSES_COMPLETED
}

// Modelo para Logs de Seguridad
model SecurityLog {
  id           String           @id @default(cuid())
  event        SecurityLogEvent
  ipAddress    String?
  userAgent    String?
  city         String?
  country      String?
  details      String?          @db.Text
  createdAt    DateTime         @default(now())
  userId       String?
  user         User?            @relation(fields: [userId], references: [id], onDelete: SetNull)
  emailAttempt String?
}

enum SecurityLogEvent {
  SUCCESSFUL_LOGIN
  FAILED_LOGIN_ATTEMPT
  PASSWORD_CHANGE_SUCCESS
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED
  USER_ROLE_CHANGED
}

model PlatformSettings {
  id                        String   @id @default(cuid())
  updatedAt                 DateTime @updatedAt
  platformName              String   @default("NexusAlpri")
  allowPublicRegistration   Boolean  @default(true)
  emailWhitelist            String? // Comma-separated domains
  enableEmailNotifications  Boolean  @default(true)
  require2faForAdmins       Boolean  @default(false)
  passwordMinLength         Int      @default(8)
  passwordRequireUppercase  Boolean  @default(true)
  passwordRequireLowercase  Boolean  @default(true)
  passwordRequireNumber     Boolean  @default(true)
  passwordRequireSpecialChar Boolean  @default(true)
  enableIdleTimeout         Boolean  @default(true)
  idleTimeoutMinutes        Int      @default(20)
  resourceCategories        String   @default("General,Recursos Humanos,TI,Marketing,Ventas") @db.Text
  
  // Theme settings
  primaryColor          String?  @default("#6366f1")
  secondaryColor        String?  @default("#a5b4fc")
  accentColor           String?  @default("#ec4899")
  backgroundColorLight  String?  @default("#f8fafc")
  primaryColorDark      String?  @default("#a5b4fc")
  backgroundColorDark   String?  @default("#020617")
  fontHeadline          String?  @default("Space Grotesk")
  fontBody              String?  @default("Inter")
  logoUrl               String?
  watermarkUrl          String?
  landingImageUrl       String?
  authImageUrl          String?
  aboutImageUrl         String?
  benefitsImageUrl      String?
}