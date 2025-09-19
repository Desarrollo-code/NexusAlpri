# Plan de Pruebas Funcionales - Módulo de Formularios

Este documento describe las acciones a verificar para la gestión de **Formularios y Evaluaciones**, principalmente desde la perspectiva de un **Administrador** o **Instructor**.

**Credenciales de Prueba:**
*   **Email:** `admin@nexus.com`
*   **Contraseña:** `nexuspro`

---

### 1. Creación y Configuración de Formularios (`/forms`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **1.1. Crear un formulario nuevo** | Haz clic en "Crear Nuevo Formulario". Introduce un título y descripción. El formulario debe aparecer en la lista en estado "Borrador". |
| **1.2. Editar información básica** | Entra a editar el formulario recién creado. Cambia el título y la descripción. Los cambios deben persistir al volver a la lista. |
| **1.3. Cambiar estado del formulario** | En el menú de acciones del formulario, cambia su estado a "Publicado". La insignia debe actualizarse. Luego, cámbialo a "Archivado" y finalmente de vuelta a "Borrador". |

### 2. Edición de Campos y Preguntas (`/forms/[id]/edit`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **2.1. Añadir campo de "Texto Corto"** | Añade un campo de texto corto. Configúralo como "Requerido" y añade un texto de ejemplo (placeholder). Guarda los cambios. |
| **2.2. Añadir campo de "Párrafo"** | Añade un campo de tipo párrafo. Verifica que se guarde correctamente. |
| **2.3. Añadir campo de "Opción Única"** | Añade un campo de opción única. Añade 3 opciones. Marca una de ellas como la correcta. |
| **2.4. Añadir campo de "Múltiples Casillas"** | Añade un campo de casillas de verificación. Añade 4 opciones y marca dos de ellas como correctas. |
| **2.5. Reordenar campos** | Arrastra y suelta los campos para cambiar su orden. Guarda los cambios y verifica que el nuevo orden se mantenga al recargar la página. |
| **2.6. Eliminar un campo** | Elimina uno de los campos añadidos. El campo debe desaparecer de la vista de edición. Guarda y confirma que ha sido eliminado. |

### 3. Modo Evaluación (Quiz)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **3.1. Activar Modo Quiz** | En la pestaña de "Configuración", activa el interruptor de "Habilitar Puntuación (Modo Quiz)". |
| **3.2. Asignar puntos a respuestas** | Vuelve a la pestaña de "Campos". En la pregunta de "Opción Única", asigna una puntuación (ej. 10 puntos) a la respuesta correcta. |
| **3.3. Guardar y verificar** | Guarda los cambios. Al volver a entrar, el modo quiz debe seguir activo y los puntos asignados deben aparecer. |

### 4. Compartir y Probar la Vista del Estudiante

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **4.1. Publicar el formulario** | Asegúrate de que el formulario esté en estado "Publicado". |
| **4.2. Obtener y usar enlace** | En la pestaña de "Configuración", copia el "Enlace para Compartir". Abre una nueva ventana de incógnito e inicia sesión como un estudiante (ej. `laura.gomez@nexus.com`). Pega el enlace. |
| **4.3. Responder el formulario** | Como estudiante, responde el formulario. Verifica que los campos requeridos son validados. Envía el formulario. |
| **4.4. Verificar resultado (si es quiz)** | Si el modo quiz estaba activado, el sistema debe mostrar la puntuación obtenida inmediatamente después de enviarlo. |

### 5. Revisión de Resultados (`/forms/[id]/results`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **5.1. Volver como Administrador** | Inicia sesión de nuevo como administrador y ve a la sección de "Resultados" del formulario. |
| **5.2. Ver resumen general** | Debes ver las métricas actualizadas: "Total de Respuestas" debe ser al menos 1. Si era un quiz, la "Puntuación Promedio" debe mostrar un valor. |
| **5.3. Analizar respuestas por pregunta** | Revisa los gráficos para las preguntas de opción única/múltiple. Deben mostrar la distribución de las respuestas enviadas por el estudiante. |
| **5.4. Ver respuestas de texto** | Para las preguntas de texto, debes ver una lista con la respuesta que envió el estudiante. |

---
Este plan nos ayudará a cubrir a fondo todo el ciclo de vida de un formulario.

Ahora dime, **¿por dónde te gustaría empezar a probar?** Podemos seguir uno de los planes o explorar libremente. ¡Tú mandas!