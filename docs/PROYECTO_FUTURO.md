# Propuestas y Hoja de Ruta Futura para NexusAlpri

Este documento detalla, analiza y prioriza las nuevas funcionalidades propuestas para la plataforma NexusAlpri. Cada propuesta incluye una descripción, una estimación de su complejidad técnica, una lista de tareas a realizar y una sugerencia sobre su orden de implementación.

---

## Análisis de Propuestas

A continuación, se desglosa cada una de las funcionalidades solicitadas.

### 1. Alertas y Eventos Periódicos
*   **Propuesta:** Crear eventos que se repitan automáticamente (ej. "Reunión de equipo" todos los lunes a las 7 AM) y alertas interactivas como "Pausas Activas" diarias, donde el usuario pueda confirmar su participación.
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Editor de Eventos:** Añadir opciones en el formulario para que se pueda elegir si un evento se repite (diariamente, semanalmente) y hasta qué fecha.
    *   **Calendario:** Actualizar la vista del calendario para que muestre correctamente todas las repeticiones de un evento programado.
    *   **Alertas Interactivas:** Diseñar un nuevo tipo de notificación o ventana emergente donde el usuario pueda ver una alerta (como "Pausa Activa") y hacer clic en un botón para confirmar su participación.
    *   **Registro de Asistencia:** Crear un sistema interno para guardar un registro de qué usuarios confirmaron su participación en un evento o alerta, para futuras consultas.
*   **Prioridad Sugerida:** **1 (Alta).** Es una extensión natural de la funcionalidad de calendario existente y aporta un valor de planificación muy alto.

### 2. Cursos con Prerrequisitos (Escalables)
*   **Propuesta:** Impedir que un usuario pueda inscribirse o realizar un curso (ej. "Nivel 2") si no ha completado previamente otro curso requerido (ej. "Nivel 1").
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Editor de Cursos:** Añadir una nueva opción en la configuración de un curso para poder seleccionar cuál es su "curso prerrequisito".
    *   **Catálogo de Cursos:** Modificar la vista del catálogo para que, en los cursos que tengan un prerrequisito, se muestre claramente cuál es y se deshabilite el botón de "Inscribir" si el usuario no lo ha completado.
    *   **Lógica de Inscripción:** Validar en el sistema que un usuario no pueda inscribirse a un curso si no ha aprobado el curso anterior requerido.
*   **Prioridad Sugerida:** **2 (Alta).** Es fundamental para crear rutas de aprendizaje estructuradas y asegurar una progresión lógica del conocimiento.

### 3. Cursos Opcionales vs. Obligatorios y Asignación a Usuarios Específicos
*   **Propuesta:** Marcar cursos como "obligatorios" y poder asignarlos no solo a roles, sino también a usuarios individuales.
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Gestión de Cursos:** Añadir un interruptor o una opción para marcar un curso como "Obligatorio".
    *   **Nueva Interfaz de Asignación:** Crear una nueva pantalla o sección donde un administrador pueda seleccionar un curso obligatorio y asignarlo a una lista de usuarios específicos.
    *   **Dashboard del Estudiante:** Modificar el panel principal del estudiante para que muestre una sección destacada y prioritaria para los "Cursos Obligatorios Pendientes".
    *   **Notificaciones:** Crear notificaciones automáticas para informar a un usuario cuando se le ha asignado un nuevo curso obligatorio.
*   **Prioridad Sugerida:** **3 (Alta).** Aumenta drásticamente la capacidad de la plataforma para gestionar planes de formación personalizados y de cumplimiento normativo.

### 4. Certificados de Participación
*   **Propuesta:** Generar automáticamente un certificado (ej. en PDF) cuando un usuario completa un curso.
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Diseñador de Plantillas:** Crear una nueva sección donde un administrador pueda subir una imagen de fondo o diseñar una plantilla base para los certificados (con logo, firmas, etc.).
    *   **Generación de PDF:** Implementar la lógica para tomar la plantilla, añadir los datos del usuario (nombre, curso, fecha) y generar un archivo PDF.
    *   **Vista del Curso:** Al completar un curso, mostrar un nuevo botón de "Descargar Certificado" al estudiante.
    *   **Perfil de Usuario:** Añadir una nueva sección en el perfil del usuario donde pueda ver y descargar todos los certificados que ha obtenido.
*   **Prioridad Sugerida:** **4 (Media).** Aporta un gran valor de gamificación y reconocimiento, pero depende de que el sistema de progreso esté 100% pulido.

### 5. Documentos: Auditoría de Cambios y Ciclo de Vida
*   **Propuesta:** Poder crear y editar documentos directamente en la plataforma (no solo subirlos) y llevar un registro de quién y cuándo hizo cambios. Añadir analíticas sobre la vigencia de los documentos.
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Editor de Texto Avanzado:** Integrar un editor de texto enriquecido (similar a Google Docs) dentro de la sección de "Biblioteca de Recursos" para crear documentos desde cero.
    *   **Historial de Versiones:** Crear una nueva vista o un panel lateral donde se pueda ver una lista de todas las versiones guardadas de un documento, con la fecha y el autor de cada cambio.
    *   **Analíticas de Vigencia:** Añadir una nueva sección en el panel de "Analíticas" que muestre un gráfico o una tabla alertando sobre los documentos que están próximos a su fecha de expiración o que no han sido revisados en mucho tiempo.
*   **Prioridad Sugerida:** **5 (Media).** Es una funcionalidad muy potente para la gestión documental, pero técnicamente exigente.

### 6. Ranking de Competencia en Cursos
*   **Propuesta:** Generar un ranking de usuarios dentro de un curso específico, basado en su rendimiento (puntuaciones de quizzes, velocidad de completado, etc.).
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Nueva Pestaña en Cursos:** Añadir una nueva pestaña llamada "Ranking" o "Clasificación" dentro de la vista de un curso (visible para los inscritos).
    *   **Diseño del Ranking:** Crear una interfaz visual atractiva para la tabla de clasificación, que podría incluir un podio para los 3 primeros puestos y una lista con el resto de participantes.
    *   **Cálculo de Puntuación:** Definir y programar la fórmula que calculará la posición de cada usuario, combinando variables como las notas de los quizzes y el tiempo de finalización.
*   **Prioridad Sugerida:** **6 (Media).** Es una excelente mejora de gamificación que puede implementarse una vez que el sistema de quizzes y progreso sea robusto.

### 7. Formularios Periódicos
*   **Propuesta:** Programar que un formulario (ej. encuesta de satisfacción) se envíe o se active automáticamente en una fecha periódica (ej. el día 30 de cada mes).
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Configuración del Formulario:** Añadir nuevas opciones en la configuración de un formulario para permitir al creador establecer una frecuencia de repetición (mensual, trimestral, etc.).
    *   **Automatización de Tareas:** Configurar un sistema de "trabajos programados" (Cron Jobs) en el servidor para que se ejecute automáticamente y envíe o active los formularios en las fechas programadas.
    *   **Notificaciones:** Crear un sistema de notificaciones para avisar a los usuarios correspondientes cada vez que un nuevo formulario periódico esté disponible para ser respondido.
*   **Prioridad Sugerida:** **7 (Baja).** Es una automatización útil pero muy específica, adecuada para una fase de madurez de la plataforma.

### 8. Mensajes de Motivación (Ventanas Emergentes)
*   **Propuesta:** Mostrar mensajes emergentes de felicitación o ánimo en momentos clave (ej. al completar un curso, al subir de nivel).
*   **Complejidad:** **Baja.**
*   **Tareas a Realizar:**
    *   **Diseño de Alertas:** Crear diferentes estilos visuales para los mensajes emergentes (conocidos como "toasts") para distinguir entre felicitaciones, información o ánimo.
    *   **Integración en Flujos Clave:** Programar la aparición de estos mensajes en los momentos adecuados, por ejemplo, justo después de que un usuario presione el botón "Calcular Puntuación Final" y apruebe, o cuando su perfil suba de nivel.
*   **Prioridad Sugerida:** **8 (Baja).** Es un "quick win" (victoria rápida) que mejora significativamente la experiencia del usuario con un esfuerzo de desarrollo relativamente bajo.

### 9. Evaluaciones de Cursos Externos
*   **Propuesta:** Permitir crear y asignar evaluaciones que no estén ligadas a un curso de la plataforma, para validar conocimientos adquiridos por fuera.
*   **Complejidad:** **Baja-Media.**
*   **Tareas a Realizar:**
    *   **Flexibilizar Formularios:** Modificar el sistema de formularios para que no sea obligatorio asociar una evaluación a un curso o lección específica.
    *   **Nueva Categoría en Formularios:** En la página de `/forms`, crear una nueva sección o pestaña para listar estos "formularios independientes" o "evaluaciones externas".
    *   **Lógica de Asignación:** Permitir que estas evaluaciones se puedan compartir y asignar a usuarios de la misma forma que los formularios actuales.
*   **Prioridad Sugerida:** **9 (Baja).** Extiende una funcionalidad ya existente para un nuevo y útil caso de uso con un esfuerzo moderado.

### 10. Chats y Videollamadas en Vivo
*   **Propuesta:** Añadir chats (públicos y privados) y la capacidad de realizar cursos en vivo con grabación de pantalla y videollamadas.
*   **Complejidad:** **Muy Alta.**
*   **Tareas a Realizar:**
    *   **Integración de Servicios Externos:** Contratar e integrar servicios especializados de terceros para la gestión de video en tiempo real (ej. Mux, Twilio Video) y de WebSockets para los chats.
    *   **Nueva Sección de Chat:** Diseñar y construir una interfaz de chat completamente nueva, que incluya lista de conversaciones, ventana de mensajes, indicador de "escribiendo", envío de archivos, etc.
    *   **Nueva Interfaz de "Aula Virtual":** Crear una nueva página donde el instructor pueda iniciar una transmisión en vivo (compartiendo su pantalla y cámara) y los estudiantes puedan unirse como espectadores e interactuar a través de un chat en vivo.
    *   **Sistema de Grabación:** Implementar la lógica para grabar las sesiones en vivo y luego subirlas a la plataforma para que puedan ser consultadas posteriormente.
*   **Prioridad Sugerida:** **10 (Largo Plazo).** Es una funcionalidad de enorme envergadura, a considerar una vez que el resto de la plataforma esté completamente maduro y probado.

---

## Hoja de Ruta Sugerida

Basado en el análisis anterior, este sería un posible orden de implementación para maximizar el valor en cada fase:

1.  **Fase 1 (Fundacional):**
    *   Eventos Periódicos.
    *   Cursos con Prerrequisitos.
    *   Asignación de Cursos Opcionales/Obligatorios a usuarios.

2.  **Fase 2 (Gamificación y Reconocimiento):**
    *   Certificados de Participación.
    *   Ranking de Competencia por Curso.
    *   Mensajes de Motivación.

3.  **Fase 3 (Gestión de Contenido Avanzada):**
    *   Auditoría de Cambios en Documentos.
    *   Evaluaciones para Cursos Externos.
    *   Formularios Periódicos.

4.  **Fase 4 (Largo Plazo - Tiempo Real):**
    *   Sistema de Chats.
    *   Cursos en Vivo y Videollamadas.
