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
      description: 'Aquí tienes un resumen rápido del estado de tu plataforma: usuarios totales, cursos, actividad reciente y nuevos registros.'
    }
  },
  {
    target: '#course-activity-chart',
    content: {
      title: 'Actividad de Cursos',
      description: 'Este gráfico muestra la tendencia de creación y publicación de cursos en los últimos 30 días.'
    }
  },
   {
    target: '#security-activity',
    content: {
      title: 'Actividad de Seguridad',
      description: 'Revisa los últimos eventos de seguridad importantes, como inicios de sesión o cambios de rol.'
    }
  },
  {
    target: '#quick-access',
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
      description: 'Aquí puedes ver cuántos cursos has creado y el número total de estudiantes (próximamente).'
    }
  },
  {
    target: '#my-taught-courses',
    content: {
      title: 'Mis Cursos Impartidos',
      description: 'Accede y edita rápidamente los cursos que has creado. ¡El corazón de tu trabajo como instructor!'
    }
  },
  {
    target: '#quick-access-instructor',
    content: {
      title: 'Herramientas de Gestión',
      description: 'Usa estos accesos directos para ir a la gestión completa de cursos o para ver las inscripciones de tus alumnos.'
    }
  }
];

export const studentDashboardTour: TourStep[] = [
  {
    target: '#student-stats-cards',
    content: {
      title: 'Tu Progreso',
      description: 'Aquí puedes ver un resumen de cuántos cursos has iniciado y cuántos has completado. ¡Sigue así!'
    }
  },
  {
    target: '#continue-learning-section',
    content: {
      title: 'Continuar Aprendiendo',
      description: 'Tus cursos más recientes aparecerán aquí para que puedas retomarlos fácilmente donde los dejaste.'
    }
  },
  {
    target: '#quick-access-student',
    content: {
      title: 'Explora y Organiza',
      description: 'Desde aquí puedes acceder al catálogo completo de cursos, ver todos tus cursos inscritos o revisar tus apuntes.'
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
      description: 'Cada curso que creas aparece aquí. Puedes ver su estado y acceder a las opciones de edición.',
    },
    placement: 'right',
  },
];


export const profileTour: TourStep[] = [
  {
    target: '#profile-card-display',
    content: {
      title: 'Tu Tarjeta de Perfil',
      description: 'Aquí puedes ver tu información principal y cambiar tu foto de perfil haciendo clic en el icono de la cámara.'
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
    target: '#security-card-desktop',
    content: {
      title: 'Seguridad de la Cuenta',
      description: 'Gestiona tu contraseña y activa la Autenticación de Dos Factores (2FA) para una capa extra de seguridad.'
    }
  },
   {
    target: '#gamification-card-desktop',
    content: {
      title: 'Tus Logros',
      description: '¡Revisa tus puntos de experiencia (XP) y los logros que has desbloqueado en la plataforma!'
    }
  }
];


export const calendarTour: TourStep[] = [
  {
    target: '#calendar-nav-controls',
    content: {
      title: 'Navegación del Calendario',
      description: 'Usa estos botones para moverte entre los meses o volver rápidamente al día de hoy.'
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
      description: 'Aquí puedes ver todos los eventos del mes. Haz clic en un día para ver sus eventos en detalle.'
    }
  },
  {
    target: '#calendar-event-list',
    content: {
      title: 'Eventos del Día',
      description: 'Los eventos para el día que hayas seleccionado aparecerán aquí. Haz clic en uno para ver toda la información.'
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
            description: 'Busca, filtra por categoría, cambia entre vista de cuadrícula o lista, y (si tienes permisos) crea carpetas y sube nuevos recursos.',
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
            description: 'Un vistazo rápido a los números más importantes de tu plataforma: usuarios, cursos, inscripciones y la tasa de finalización promedio.'
        }
    },
    {
        target: '#analytics-course-rankings',
        content: {
            title: 'Ranking de Cursos',
            description: 'Identifica rápidamente qué cursos son los más populares (más inscritos) y cuáles tienen el mejor (y peor) rendimiento en finalización.'
        }
    },
    {
        target: '#analytics-distribution-charts',
        content: {
            title: 'Distribución',
            description: 'Estos gráficos te muestran cómo se distribuyen tus usuarios por rol y tus cursos por estado (borrador, publicado, etc.).'
        }
    },
    {
        target: '#analytics-registration-trend',
        content: {
            title: 'Tendencia de Registros',
            description: 'Observa cuántos nuevos usuarios se han registrado en la plataforma durante los últimos 30 días.'
        }
    }
];

export const enrollmentsTour: TourStep[] = [
    {
        target: '#enrollments-course-selector',
        content: {
            title: 'Selecciona un Curso',
            description: 'Elige el curso del que quieres ver las inscripciones. Si eres instructor, solo verás tus propios cursos.'
        }
    },
    {
        target: '#enrollments-stats-cards',
        content: {
            title: 'Estadísticas del Curso',
            description: 'Aquí tienes un resumen de los inscritos, el porcentaje de finalización promedio y la nota media de los quizzes para el curso seleccionado.'
        }
    },
    {
        target: '#enrollments-student-list',
        content: {
            title: 'Lista de Estudiantes',
            description: 'Busca y visualiza el progreso individual de cada estudiante inscrito en este curso.'
        }
    }
];

export const settingsTour: TourStep[] = [
    {
        target: '#settings-tabs',
        content: {
            title: 'Pestañas de Configuración',
            description: 'Navega entre las diferentes secciones: Apariencia, Seguridad y configuraciones Generales de la plataforma.'
        }
    },
     {
        target: '#settings-identity',
        content: {
            title: 'Identidad Visual',
            description: 'Personaliza la plataforma subiendo tu propio logo, marca de agua e imágenes para las páginas públicas.'
        }
    },
    {
        target: '#settings-security',
        content: {
            title: 'Políticas de Seguridad',
            description: 'Define cómo funcionará la seguridad en tu plataforma, desde la complejidad de las contraseñas hasta el cierre de sesión por inactividad.'
        }
    },
    {
        target: '#settings-categories',
        content: {
            title: 'Categorías',
            description: 'Gestiona la lista de categorías que se usarán al crear cursos y recursos en la biblioteca.'
        }
    },
     {
        target: '#settings-save-button',
        content: {
            title: 'Guardar Cambios',
            description: '¡No olvides guardar! Haz clic aquí para aplicar todas las modificaciones que hayas realizado en esta página.'
        }
    }
];
