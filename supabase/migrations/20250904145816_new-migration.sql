// --- ENUMS ---

enum UserRole {
  ADMINISTRATOR
  INSTRUCTOR
  STUDENT
}

enum LessonType {
  TEXT
  VIDEO
  QUIZ
  FILE
}

enum QuestionType {
  MULTIPLE_CHOICE
  SINGLE_CHOICE
  TRUE_FALSE
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
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

enum SecurityLogEvent {
  SUCCESSFUL_LOGIN
  FAILED_LOGIN_ATTEMPT
  PASSWORD_CHANGE_SUCCESS
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED
  USER_ROLE_CHANGED
}

enum AchievementSlug {
  FIRST_ENROLLMENT
  FIRST_COURSE_COMPLETED
  PERFECT_QUIZ_SCORE
  FIVE_COURSES_COMPLETED
}

enum EventAudienceType {
    ALL
    ADMINISTRATOR
    INSTRUCTOR
    STUDENT
    SPECIFIC
}

enum FormStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum FormFieldType {
  SHORT_TEXT
  LONG_TEXT
  SINGLE_CHOICE
  MULTIPLE_CHOICE
}


// --- MODELS ---

model User {
  id                  String           @id @default(cuid())
  email               String           @unique
  name                String
  password            String
  role                UserRole         @default(STUDENT)
  avatar              String?
  registeredDate      DateTime?        @default(now())
  lastLogin           DateTime?
  isActive            Boolean          @default(true)
  xp                  Int              @default(0)
  // 2FA
  isTwoFactorEnabled  Boolean          @default(false)
  twoFactorSecret     String?

  // Relationships
  coursesCreated      Course[]         @relation("CreatedCourses")
  enrollments         Enrollment[]
  progress            CourseProgress[]
  notes               UserNote[]
  achievements        UserAchievement[]
  resourcesUploaded   Resource[]       @relation("UploadedResources")
  announcements       Announcement[]
  createdEvents       CalendarEvent[]
  attendedEvents      CalendarEvent[]  @relation("EventAttendees")
  notifications       Notification[]
  securityLogs        SecurityLog[]
  quizAttempts        QuizAttempt[]
  createdForms        Form[]           @relation("CreatedForms")
  formResponses       FormResponse[]
  sharedResources     Resource[]       @relation("SharedResources")
  sharedForms         Form[]           @relation("SharedForms")
}

model Course {
  id              String      @id @default(cuid())
  title           String
  description     String      @db.Text
  imageUrl        String?
  category        String?
  status          CourseStatus @default(DRAFT)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  publicationDate DateTime?

  // Relationships
  instructorId    String
  instructor      User        @relation("CreatedCourses", fields: [instructorId], references: [id], onDelete: Cascade)
  modules         Module[]
  enrollments     Enrollment[]
  progress        CourseProgress[]
}

model Module {
  id        String   @id @default(cuid())
  title     String
  order     Int
  courseId  String

  // Relationships
  course  Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons Lesson[]
}

model Lesson {
  id        String    @id @default(cuid())
  title     String
  order     Int
  moduleId  String

  // Relationships
  module             Module                   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  contentBlocks      ContentBlock[]
  completedBy        LessonCompletionRecord[]
  notes              UserNote[]
}

model ContentBlock {
  id       String     @id @default(cuid())
  type     LessonType
  content  String?    @db.Text
  order    Int
  lessonId String
  
  // Relationships
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  quiz   Quiz?
}

model Quiz {
  id          String   @id @default(cuid())
  title       String
  description String?
  contentBlockId String  @unique
  maxAttempts Int?     // Nullable field for unlimited attempts

  // Relationships
  contentBlock ContentBlock @relation(fields: [contentBlockId], references: [id], onDelete: Cascade)
  questions    Question[]
  attempts     QuizAttempt[]
}

model Question {
  id      String   @id @default(cuid())
  text    String   @db.Text
  order   Int
  quizId  String

  // Relationships
  quiz    Quiz           @relation(fields: [quizId], references: [id], onDelete: Cascade)
  options AnswerOption[]
  attempts AnswerAttempt[]
}

model AnswerOption {
  id         String  @id @default(cuid())
  text       String
  isCorrect  Boolean @default(false)
  feedback   String?
  points     Int     @default(0)
  questionId String

  // Relationships
  question      Question        @relation(fields: [questionId], references: [id], onDelete: Cascade)
  AnswerAttempt AnswerAttempt[]
}

model QuizAttempt {
    id            String   @id @default(cuid())
    userId        String
    quizId        String
    attemptNumber Int
    score         Float // Percentage score
    submittedAt   DateTime @default(now())

    // Relationships
    user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    quiz          Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
    answers       AnswerAttempt[]
}

model AnswerAttempt {
    id                  String        @id @default(cuid())
    attemptId           String
    questionId          String
    selectedOptionId    String

    // Relationships
    attempt             QuizAttempt   @relation(fields: [attemptId], references: [id], onDelete: Cascade)
    question            Question      @relation(fields: [questionId], references: [id], onDelete: Cascade)
    selectedOption      AnswerOption  @relation(fields: [selectedOptionId], references: [id], onDelete: Cascade)
}


model Enrollment {
  id          String   @id @default(cuid())
  userId      String
  courseId    String
  enrolledAt  DateTime @default(now())
  
  // Relationships
  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  course   Course          @relation(fields: [courseId], references: [id], onDelete: Cascade)
  progress CourseProgress?

  @@unique([userId, courseId])
}

model CourseProgress {
  id                 String   @id @default(cuid())
  userId             String
  courseId           String
  enrollmentId       String   @unique
  progressPercentage Float    @default(0)
  completedAt        DateTime?
  
  // Relationships
  user             User                     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course           Course                   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  enrollment       Enrollment               @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  completedLessons LessonCompletionRecord[]

  @@unique([userId, courseId])
}

model LessonCompletionRecord {
    id          String   @id @default(cuid())
    progressId  String
    lessonId    String
    completedAt DateTime @default(now())
    type        String   @default("view") // 'view', 'quiz', 'video'
    score       Float?   // Score for quiz-type completions

    // Relationships
    progress CourseProgress @relation(fields: [progressId], references: [id], onDelete: Cascade)
    lesson   Lesson         @relation(fields: [lessonId], references: [id], onDelete: Cascade)

    @@unique([progressId, lessonId])
}

model Resource {
  id            String   @id @default(cuid())
  title         String
  description   String?  @db.Text
  type          ResourceType
  url           String?
  uploadDate    DateTime @default(now())
  uploaderId    String?
  category      String?
  tags          String?
  pin           String?
  ispublic      Boolean    @default(true)
  sharedWith    User[]     @relation("SharedResources")
  parentId      String?

  // Self-relation for folders
  parent       Resource?     @relation("FolderContent", fields: [parentId], references: [id], onDelete: Restrict, onUpdate: Restrict)
  children     Resource[]    @relation("FolderContent")
  
  // Relationships
  uploader     User?      @relation("UploadedResources", fields: [uploaderId], references: [id], onDelete: SetNull)
}

model SecurityLog {
  id           String           @id @default(cuid())
  event        SecurityLogEvent
  ipAddress    String?
  userAgent    String?
  details      String?          @db.Text
  createdAt    DateTime         @default(now())
  
  // Optional relationship to a user
  userId       String?
  emailAttempt String?
  country      String?
  city         String?

  // Relationships
  user         User?            @relation(fields: [userId], references: [id], onDelete: SetNull)
}

model UserNote {
    id        String   @id @default(cuid())
    userId    String
    lessonId  String
    content   String   @db.Text
    color     String   @default("yellow")
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // Relationships
    user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
    lesson  Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

    @@unique([userId, lessonId])
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String?
  link        String?
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  // Relationships
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Announcement {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  date      DateTime @default(now())
  authorId  String
  audience  String   // 'ALL' o un array de UserRole en formato string
  priority  String   @default("Normal") // 'Normal', 'Urgente'

  // Relationships
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

model CalendarEvent {
    id                  String           @id @default(cuid())
    title               String
    description         String?          @db.Text
    start               DateTime
    end                 DateTime
    allDay              Boolean          @default(false)
    location            String?
    videoConferenceLink String?
    audienceType        EventAudienceType @default(ALL)
    color               String?          @default("blue")
    attachments         Json?            // [{ name: string, url: string }]
    creatorId           String

    // Relationships
    creator             User             @relation(fields: [creatorId], references: [id], onDelete: Cascade)
    attendees           User[]           @relation("EventAttendees")
}

model Achievement {
    id          String   @id @default(cuid())
    slug        AchievementSlug @unique
    name        String
    description String
    icon        String
    points      Int

    // Relationships
    users       UserAchievement[]
}

model UserAchievement {
    id            String    @id @default(cuid())
    userId        String
    achievementId String
    unlockedAt    DateTime  @default(now())

    // Relationships
    user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
    achievement Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

    @@unique([userId, achievementId])
}


// --- FORM MODELS ---
model Form {
  id            String   @id @default(cuid())
  title         String
  description   String?  @db.Text
  status        FormStatus     @default(DRAFT)
  isQuiz        Boolean  @default(false) // If true, enables scoring
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  creatorId     String

  // Relationships
  creator       User           @relation("CreatedForms", fields: [creatorId], references: [id], onDelete: Cascade)
  fields        FormField[]
  responses     FormResponse[]
  sharedWith    User[]         @relation("SharedForms")
}

model FormField {
  id            String        @id @default(cuid())
  label         String
  type          FormFieldType
  required      Boolean       @default(false)
  placeholder   String?
  options       Json? // [{ id, text, isCorrect, points }, ...]
  order         Int
  formId        String
  // Relationships
  form          Form          @relation(fields: [formId], references: [id], onDelete: Cascade)
  answers       FormAnswer[]
}

model FormResponse {
  id          String          @id @default(cuid())
  formId      String
  userId      String
  submittedAt DateTime        @default(now())
  score       Float? // Percentage score if it's a quiz
  
  // Relationships
  form        Form            @relation(fields: [formId], references: [id], onDelete: Cascade)
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers     FormAnswer[]
}

model FormAnswer {
    id             String @id @default(cuid())
    formResponseId String
    fieldId        String
    value          String @db.Text // Can store simple text or stringified JSON for multiple choices
    
    // Relationships
    formResponse   FormResponse @relation(fields: [formResponseId], references: [id], onDelete: Cascade)
    field          FormField    @relation(fields: [fieldId], references: [id], onDelete: Cascade)
}


model PlatformSettings {
  id                        String    @id @default(cuid())
  platformName              String    @default("NexusAlpri")
  logoUrl                   String?
  faviconUrl                String?
  primaryColor              String?
  secondaryColor            String?
  accentColor               String?
  fontHeadline              String?   @default("Space Grotesk")
  fontBody                  String?   @default("Inter")
  allowPublicRegistration   Boolean   @default(true)
  enableEmailNotifications  Boolean   @default(true)
  updatedAt                 DateTime  @updatedAt
  emailWhitelist            String? // Comma-separated domains
  passwordMinLength         Int       @default(8)
  passwordRequireUppercase  Boolean   @default(true)
  passwordRequireLowercase  Boolean   @default(true)
  passwordRequireNumber     Boolean   @default(true)
  passwordRequireSpecialChar Boolean  @default(false)
  enableIdleTimeout         Boolean   @default(true)
  idleTimeoutMinutes        Int       @default(20)
  require2faForAdmins       Boolean   @default(false)
  resourceCategories        String    @default("General,Recursos Humanos,TI,Marketing") @db.Text
  backgroundColorLight      String?
  primaryColorDark          String?
  backgroundColorDark       String?
  watermarkUrl              String?
  landingImageUrl           String?
  authImageUrl              String?
  aboutImageUrl             String?
  benefitsImageUrl          String?
}

model LessonTemplate {
  id              String         @id @default(cuid())
  name            String
  description     String?
  type            String         @default("USER") // SYSTEM or USER
  creatorId       String?        // Null for system templates
  
  // Relationships
  templateBlocks  TemplateBlock[]
}

model TemplateBlock {
  id                String  @id @default(cuid())
  type              LessonType
  order             Int
  lessonTemplateId  String

  // Relationships
  lessonTemplate LessonTemplate @relation(fields: [lessonTemplateId], references: [id], onDelete: Cascade)
}
