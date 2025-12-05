# Fragmentos para `prisma/schema.prisma`

Aquí están los fragmentos de código que necesitas añadir o modificar en tu archivo `prisma/schema.prisma` para habilitar las nuevas funcionalidades de colaboración, versionamiento y quizzes en recursos.

---

### 1. Modificar el modelo `User`

Dentro de tu modelo `User`, añade estas dos nuevas líneas para establecer la relación con los recursos en los que un usuario colabora y las versiones de documentos que ha creado.

```prisma
// src/prisma/schema.prisma

model User {
  // ... todos tus campos existentes como id, name, email, etc.

  collaboratingResources EnterpriseResource[] @relation("Collaborators")
  resourceVersions     ResourceVersion[]
}
```

---

### 2. Modificar el modelo `EnterpriseResource`

Este es el cambio más grande. Debes añadir varios campos y relaciones a tu modelo `EnterpriseResource`.

*   `version`: Un contador para el historial de cambios.
*   `versions`: La relación con el historial de versiones.
*   `collaborators`: La relación para los usuarios que pueden editar.
*   `quiz` y `quizId`: La relación uno a uno con un `Quiz`.

```prisma
// src/prisma/schema.prisma

model EnterpriseResource {
  // ... todos tus campos existentes como id, title, type, etc.

  version      Int               @default(1)
  versions     ResourceVersion[] @relation("ResourceVersions")
  collaborators User[]            @relation("Collaborators")

  // Relación uno a uno con Quiz
  quiz   Quiz? @relation("ResourceQuiz")
  quizId String?
}
```

---

### 3. Modificar el modelo `Quiz`

Necesitamos hacer que la relación con `ContentBlock` sea opcional y añadir la nueva relación con `EnterpriseResource`.

*   Cambia `contentBlockId String` a `contentBlockId String?`.
*   Añade la relación inversa con `EnterpriseResource`.

```prisma
// src/prisma/schema.prisma

model Quiz {
  // ... todos tus campos existentes como id, title, etc.

  // Haz este campo opcional
  contentBlockId String?
  contentBlock   ContentBlock? @relation(fields: [contentBlockId], references: [id], onDelete: Cascade)

  // Añade esta nueva relación
  resource   EnterpriseResource? @relation("ResourceQuiz", fields: [resourceId], references: [id], onDelete: Cascade)
  resourceId String?             @unique
}
```

---

### 4. Añadir el nuevo modelo `ResourceVersion`

Añade este modelo completo al final de tu archivo. Es la tabla que almacenará el historial de cambios de los documentos editables.

```prisma
// src/prisma/schema.prisma

model ResourceVersion {
  id         String   @id @default(cuid())
  resourceId String
  resource   EnterpriseResource @relation("ResourceVersions", fields: [resourceId], references: [id], onDelete: Cascade)
  version    Int
  content    String
  authorId   String
  author     User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([resourceId, version])
}
```

---

Con estos cambios, tu `schema.prisma` estará listo. Solo necesitas ejecutar `npx prisma migrate dev --name "add_collaboration_versioning_and_resource_quizzes"` para aplicar los cambios a tu base de datos.