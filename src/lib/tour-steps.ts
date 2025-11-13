// src/lib/tour-steps.ts

export interface TourStep {
  target: string; // CSS selector for the element to highlight
  content: {
    title: string;
    description: string;
  };
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const adminDashboardTour: TourStep[] = [
  {
    target: '#admin-stats-cards',
    content: {
      title: 'Estadísticas Generales',
      description: 'Aquí tienes un resumen rápido del estado de tu plataforma: usuarios, cursos, inscripciones y la tasa de finalización promedio.'
    }
  },
  {
    target: '#admin-charts-section',
    content: {
      title: 'Gráficos de Actividad',
      description: 'Visualiza la tendencia de registros de usuarios y la distribución de roles dentro de la plataforma.'
    }
  },
  {
    target: '#admin-security-log-widget',
    content: {
      title: 'Actividad de Seguridad',
      description: 'Revisa los últimos eventos de seguridad importantes, como inicios de sesión o cambios de rol. Haz clic en uno para ver más detalles.'
    }
  },
  {
    target: '#admin-quick-actions',
    content: {
      title: 'Accesos Rápidos',
      description: 'Desde aquí puedes navegar directamente a las secciones de gestión más importantes de la plataforma.'
    }
  },
];

export const instructorDashboardTour: TourStep[] = [
  {
    target: '#instructor-stats-cards',
    content: {
      title: 'Resumen Rápido',
      description: 'Aquí puedes ver cuántos cursos has creado y el número total de estudiantes inscritos en ellos.'
    }
  },
  {
    target: '#taught-courses-widget',
    content: {
      title: 'Rendimiento de Cursos',
      description: 'Un vistazo rápido al progreso promedio de tus cursos más recientes.'
    }
  },
  {
    target: '#instructor-side-widgets',
    content: {
      title: 'Comunicados y Eventos',
      description: 'Mantente al día con los últimos anuncios y los próximos eventos en tu calendario.'
    }
  }
];

export const studentDashboardTour: TourStep[] = [
  {
    target: '#student-welcome-card',
    content: {
      title: '¡Bienvenido!',
      description: 'Este es tu panel personal. Aquí puedes ver tu nivel, puntos de experiencia (XP) y un resumen de tu actividad.'
    }
  },
  {
    target: '#student-stats-cards',
    content: {
      title: 'Tu Progreso',
      description: 'Un resumen rápido de cuántos cursos has iniciado y cuántos has completado. ¡Sigue así!'
    }
  },
  {
    target: '#continue-learning-section',
    content: {
      title: 'Continuar Aprendiendo',
      description: 'Tus cursos más recientes aparecerán aquí para que puedas retomarlos fácilmente donde los dejaste.'
    }
  }
];

export const manageCoursesTour: TourStep[] = [
  {
    target: '#create-course-btn',
    content: {
      title: 'Crear un Curso',
      description: 'Haz clic aquí para empezar a crear un nuevo curso desde cero. Se te pedirá la información básica para comenzar.',
    },
    placement: 'bottom',
  },
  {
    target: '#course-status-tabs',
    content: {
      title: 'Filtrar por Estado',
      description: 'Usa estas pestañas para ver tus cursos según su estado: Borradores, Publicados o Archivados.',
    },
    placement: 'bottom',
  },
  {
    target: '#course-list-container',
    content: {
      title: 'Lista de Cursos',
      description: 'Cada curso que creas aparece aquí. Puedes ver su estado y acceder a las opciones de edición desde el menú de tres puntos.',
    },
    placement: 'right',
  },
];

export const profileTour: TourStep[] = [
  {
    target: '#profile-card-display',
    content: {
      title: 'Tu Tarjeta de Perfil',
      description: 'Aquí puedes ver tu información principal, nivel y XP. Haz clic en el icono de la cámara para cambiar tu foto de perfil.'
    }
  },
  {
    target: '#info-card-desktop',
    content: {
      title: 'Información Personal',
      description: 'Edita tu nombre visible para otros usuarios. El correo electrónico no se puede cambiar.'
    }
  },
  {
    target: '#card-2fa-desktop',
    content: {
      title: 'Seguridad de la Cuenta',
      description: 'Gestiona tu contraseña y activa la Autenticación de Dos Factores (2FA) para una capa extra de seguridad.'
    }
  },
];

export const calendarTour: TourStep[] = [
  {
    target: '#calendar-nav-controls',
    content: {
      title: 'Navegación del Calendario',
      description: 'Usa estos botones para moverte entre los meses, semanas o días, y para volver rápidamente a la fecha de hoy.'
    }
  },
  {
    target: '#create-event-btn',
    content: {
      title: 'Crear Nuevo Evento',
      description: 'Si tienes permisos, puedes crear un nuevo evento para ti, para un rol específico o para toda la organización.'
    }
  },
  {
    target: '#calendar-main-view',
    content: {
      title: 'Vista Principal',
      description: 'Aquí puedes ver todos los eventos. Haz clic en un evento para ver sus detalles o en un espacio vacío para crear uno nuevo.'
    }
  },
  {
    target: '#calendar-sidebar',
    content: {
      title: 'Barra Lateral',
      description: 'Usa el mini calendario para navegar rápidamente y ve una lista de los eventos para el día seleccionado.'
    }
  }
];

export const resourcesTour: TourStep[] = [
    {
        target: '#resources-breadcrumbs',
        content: {
            title: 'Navegación por Carpetas',
            description: 'Usa estas "migas de pan" para saber en qué carpeta te encuentras y para volver a las carpetas anteriores fácilmente.',
        }
    },
    {
        target: '#resources-controls',
        content: {
            title: 'Controles de la Biblioteca',
            description: 'Busca, filtra, cambia la vista, y (si tienes permisos) crea carpetas o sube nuevos recursos.',
        }
    },
    {
        target: '#resources-folder-list',
        content: {
            title: 'Carpetas',
            description: 'Las carpetas te ayudan a organizar el contenido. Haz clic en una para entrar y ver los archivos que contiene.',
        }
    },
    {
        target: '#resources-file-list',
        content: {
            title: 'Archivos',
            description: 'Aquí están los documentos, videos y enlaces. Haz clic en uno para previsualizarlo o descargarlo.',
        }
    },
];

export const analyticsTour: TourStep[] = [
    {
        target: '#analytics-metric-cards',
        content: {
            title: 'Métricas Principales',
            description: 'Un vistazo rápido a los números más importantes de tu plataforma en el rango de fechas seleccionado.'
        }
    },
    {
        target: '#analytics-course-rankings',
        content: {
            title: 'Ranking de Cursos',
            description: 'Identifica qué cursos son los más populares y cuáles tienen el mejor (o peor) rendimiento.'
        }
    },
    {
        target: '#analytics-distribution-charts',
        content: {
            title: 'Distribución',
            description: 'Estos gráficos te muestran cómo se distribuyen tus usuarios por rol y tus cursos por estado.'
        }
    },
    {
        target: '#analytics-user-rankings',
        content: {
            title: 'Ranking de Usuarios',
            description: 'Descubre quiénes son los estudiantes e instructores más activos y destacados de la plataforma.'
        }
    }
];

export const enrollmentsTour: TourStep[] = [
    {
        target: '#enrollments-course-selector',
        content: {
            title: 'Selecciona un Curso',
            description: 'Elige el curso del que quieres ver las inscripciones y estadísticas de progreso. Si eres instructor, solo verás tus propios cursos.'
        }
    },
    {
        target: '#enrollments-stats-cards',
        content: {
            title: 'Estadísticas del Curso',
            description: 'Un resumen clave: total de inscritos, el porcentaje de finalización promedio y la nota media de los quizzes para el curso seleccionado.'
        }
    },
    {
        target: '#enrollments-student-list',
        content: {
            title: 'Lista de Estudiantes',
            description: 'Busca un estudiante específico o revisa el progreso individual de cada uno. Usa el menú de acciones para ver detalles o cancelar una inscripción.'
        }
    }
];

export const settingsTour: TourStep[] = [
  {
    target: '#settings-tabs-list',
    content: {
      title: 'Pestañas de Configuración',
      description: 'Navega entre las diferentes secciones: Apariencia, Estilo, Seguridad y configuraciones Generales.'
    },
    placement: 'bottom',
  },
  {
    target: '#settings-identity-card',
    content: {
      title: 'Identidad y Marca',
      description: 'Personaliza la plataforma con el nombre de tu empresa, tu logo y una marca de agua que aparecerá en la aplicación.'
    }
  },
  {
    target: '#settings-empty-states-card',
    content: {
      title: 'Imágenes Personalizadas',
      description: 'Sube tus propias imágenes para las páginas públicas y para cuando las secciones estén vacías, ¡dale un toque único a la plataforma!'
    }
  }
];

export const myNotesTour: TourStep[] = [
    {
        target: '#my-notes-header',
        content: {
            title: 'Tus Apuntes',
            description: 'Este es tu tablero personal. Todas las notas que tomes en las lecciones aparecerán aquí, organizadas por curso y módulo.'
        }
    },
    {
        target: '#my-notes-board',
        content: {
            title: 'Tablero de Notas',
            description: 'Cada nota es como un post-it virtual. Puedes editarlas, cambiarles el color o eliminarlas. Haz clic en "Ir a lección" para volver al contenido original.'
        }
    }
];

export const securityAuditTour: TourStep[] = [
  {
    target: '#security-stats-cards',
    content: {
      title: 'Estadísticas de Seguridad',
      description: 'Aquí ves un resumen de los eventos de seguridad más importantes para el rango de fechas seleccionado.',
    },
  },
  {
    target: '#security-event-filter',
    content: {
      title: 'Filtrar Eventos',
      description: 'Utiliza este selector para filtrar los registros por un tipo de evento específico, como "Inicios de Sesión Fallidos".',
    },
    placement: 'bottom',
  },
  {
    target: '#security-log-timeline',
    content: {
      title: 'Línea de Tiempo',
      description: 'Contiene un registro de cada evento de seguridad. Haz clic en un evento para ver todos sus detalles técnicos.',
    },
  },
];

export const myCoursesTour: TourStep[] = [
  {
    target: '#my-courses-header',
    content: {
      title: 'Tus Cursos Inscritos',
      description: 'Esta es tu biblioteca personal de aprendizaje. Todos los cursos en los que te has inscrito aparecen aquí.',
    },
  },
  {
    target: '#my-courses-filters',
    content: {
      title: 'Filtra tu Progreso',
      description: 'Usa los filtros para encontrar rápidamente tus cursos, ya sea que estén "En Progreso" o "Completados".',
    },
  },
];

export const coursesTour: TourStep[] = [
  {
    target: '#courses-filters',
    content: {
      title: 'Encuentra tu Próximo Curso',
      description: 'Usa la barra de búsqueda y el filtro de categorías para encontrar exactamente el curso que necesitas.',
    },
  },
];

export const formsTour: TourStep[] = [
  {
    target: '#forms-header',
    content: {
      title: 'Gestión de Formularios',
      description: 'Desde aquí puedes crear nuevos formularios, ver los que has creado, los que te han compartido y (si eres admin) todos los de la plataforma.',
    },
  },
  {
    target: '#forms-list',
    content: {
      title: 'Lista de Formularios',
      description: 'Cada tarjeta representa un formulario. Puedes editarlo, ver los resultados, compartirlo o eliminarlo desde el menú de acciones.',
    },
  },
];

export const notificationsTour: TourStep[] = [
  {
    target: '#notifications-list',
    content: {
      title: 'Centro de Notificaciones',
      description: 'Aquí se agrupan todos tus avisos, desde asignaciones de cursos hasta logros desbloqueados. Haz clic en uno para ir a la sección correspondiente.',
    },
  },
];

export const certificatesTour: TourStep[] = [
  {
    target: '#certificates-header',
    content: {
      title: 'Gestor de Plantillas',
      description: 'Crea y personaliza las plantillas que se usarán para generar los certificados de finalización de curso.',
    },
  },
  {
    target: '#certificate-card-example',
    content: {
      title: 'Plantillas de Certificado',
      description: 'Cada tarjeta es una plantilla. Puedes previsualizarla, editarla para ajustar los textos o la imagen de fondo, o eliminarla.',
    },
  },
];

export const motivationsTour: TourStep[] = [
  {
    target: '#motivations-header',
    content: {
      title: 'Mensajes de Motivación',
      description: 'Crea mensajes emergentes (toasts) que aparecerán cuando un usuario alcance un hito, como completar un curso o subir de nivel.',
    },
  },
  {
    target: '#motivations-list',
    content: {
      title: 'Lista de Mensajes',
      description: 'Cada tarjeta representa un mensaje y el "disparador" que lo activa. Puedes editarlos o eliminarlos en cualquier momento.',
    },
  },
];

export const usersTour: TourStep[] = [
  {
    target: '#users-controls',
    content: {
      title: 'Controles de Usuario',
      description: 'Usa la búsqueda, los filtros y los modos de vista para encontrar y organizar a los colaboradores de la plataforma.',
    },
  },
  {
    target: '#users-main-view',
    content: {
      title: 'Área Principal',
      description: 'Aquí puedes ver a todos los usuarios. En la vista de cuadrícula, puedes arrastrar a un usuario y soltarlo sobre un proceso en la barra lateral para asignarlo.',
    },
    placement: 'top'
  },
  {
    target: '#users-sidebar',
    content: {
      title: 'Estructura Organizacional',
      description: 'Define la jerarquía de procesos de tu empresa. También puedes seleccionar usuarios y usar la barra de "Acciones en Lote" para asignarlos a un proceso.',
    },
    placement: 'left'
  },
];

    