
// src/lib/tour-steps.ts
import type { UserRole } from '@/types';

export interface TourStep {
  target: string; // Un selector CSS para el elemento a resaltar
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
      title: "Métricas Clave",
      description: "Aquí tienes un resumen rápido de la actividad más importante de la plataforma."
    }
  },
  {
    target: '#course-activity-chart',
    content: {
      title: "Actividad de Cursos",
      description: "Visualiza la tendencia de creación y publicación de cursos a lo largo del tiempo."
    },
    placement: 'bottom'
  },
  {
    target: '#security-activity',
    content: {
      title: "Actividad de Seguridad",
      description: "Revisa los últimos eventos de seguridad importantes, como inicios de sesión y cambios de rol."
    },
    placement: 'left'
  },
  {
    target: '#quick-access',
    content: {
      title: "Accesos Rápidos",
      description: "Usa estos enlaces para ir directamente a las secciones de administración más comunes."
    },
    placement: 'left'
  }
];

export const studentDashboardTour: TourStep[] = [
  {
    target: '#student-stats-cards',
    content: {
      title: "Tu Progreso",
      description: "Aquí puedes ver un resumen de cuántos cursos has iniciado y completado."
    },
  },
  {
    target: '#continue-learning-section',
    content: {
      title: "Continuar Aprendiendo",
      description: "Accede rápidamente a los últimos cursos en los que te has inscrito para no perder el ritmo."
    },
    placement: 'bottom'
  },
  {
    target: '#quick-access-student',
    content: {
      title: "Accesos Rápidos",
      description: "Usa estos enlaces para explorar el catálogo completo de cursos o revisar tus apuntes."
    },
    placement: 'left'
  }
];

export const instructorDashboardTour: TourStep[] = [
   {
    target: '#instructor-stats-cards',
    content: {
      title: "Tus Estadísticas",
      description: "Un resumen rápido de los cursos que has creado y el total de estudiantes (próximamente)."
    },
  },
   {
    target: '#my-taught-courses',
    content: {
      title: "Tus Cursos",
      description: "Aquí ves los cursos que has impartido. Puedes editarlos directamente desde aquí."
    },
    placement: 'bottom'
  },
  {
    target: '#quick-access-instructor',
    content: {
      title: "Accesos Rápidos",
      description: "Gestiona todos tus cursos o revisa las inscripciones de tus estudiantes."
    },
    placement: 'left'
  }
];

export const settingsTour: TourStep[] = [
  {
    target: '#settings-tabs-list',
    content: {
      title: "Navegación",
      description: "Usa estas pestañas para cambiar entre las configuraciones de Apariencia, Seguridad y Generales."
    }
  },
  {
    target: '#settings-identity',
    content: {
      title: "Identidad Visual",
      description: "Personaliza el nombre, logos y las imágenes que ven tus usuarios en las páginas públicas."
    },
    placement: 'bottom'
  },
  {
    target: '#settings-security',
    content: {
      title: "Políticas de Seguridad",
      description: "Controla quién puede registrarse, la complejidad de las contraseñas y el cierre de sesión por inactividad."
    },
    placement: 'top'
  },
   {
    target: '#settings-categories',
    content: {
      title: "Categorías",
      description: "Define las categorías que se usarán para organizar cursos y recursos en toda la plataforma."
    },
    placement: 'top'
  },
  {
    target: '#settings-save-button',
    content: {
      title: "¡No olvides guardar!",
      description: "Después de hacer tus cambios, haz clic aquí para aplicarlos en toda la plataforma."
    },
    placement: 'left'
  }
];

export const analyticsTour: TourStep[] = [
    {
        target: '#analytics-metric-cards',
        content: {
            title: 'Métricas Generales',
            description: 'Un vistazo rápido a los números más importantes de tu plataforma: usuarios, cursos, inscripciones y finalización.'
        }
    },
    {
        target: '#analytics-course-rankings',
        content: {
            title: 'Rendimiento de Cursos',
            description: 'Identifica qué cursos son los más populares, cuáles tienen la mejor tasa de finalización y cuáles necesitan un empujón.'
        },
        placement: 'bottom'
    },
    {
        target: '#analytics-user-rankings',
        content: {
            title: 'Actividad de Usuarios',
            description: 'Descubre a tus estudiantes más activos, a los que mejor rendimiento tienen y a los instructores más destacados.'
        },
        placement: 'top'
    },
    {
        target: '#analytics-distribution-charts',
        content: {
            title: 'Distribución',
            description: 'Comprende cómo se distribuyen tus usuarios por rol y en qué estado se encuentran tus cursos (borrador, publicado, etc.).'
        },
        placement: 'bottom'
    },
    {
        target: '#analytics-registration-trend',
        content: {
            title: 'Tendencia de Registros',
            description: 'Observa cómo ha crecido tu base de usuarios a lo largo del tiempo. Puedes cambiar el rango de fechas arriba.'
        },
        placement: 'top'
    }
];

export const calendarTour: TourStep[] = [
    {
        target: '#calendar-nav-controls',
        content: {
            title: 'Navega por el Tiempo',
            description: 'Usa estos botones para moverte entre meses o volver rápidamente al día de hoy.'
        },
        placement: 'bottom'
    },
    {
        target: '#calendar-main-view',
        content: {
            title: 'Vista del Calendario',
            description: 'Aquí ves todos los eventos del mes. Los eventos que duran varios días se expandirán a lo largo de la semana. Haz clic en un día para ver sus eventos.'
        },
        placement: 'right'
    },
    {
        target: '#calendar-event-list',
        content: {
            title: 'Eventos del Día',
            description: 'La lista de eventos para el día que hayas seleccionado aparecerá aquí. Haz clic en un evento para ver todos sus detalles.'
        },
        placement: 'left'
    },
    {
        target: '#create-event-btn',
        content: {
            title: 'Crea Eventos',
            description: 'Si eres Instructor o Administrador, puedes crear nuevos eventos para diferentes audiencias desde aquí.'
        },
        placement: 'bottom'
    }
];

export const enrollmentsTour: TourStep[] = [
    {
        target: '#enrollments-course-selector',
        content: {
            title: 'Selecciona un Curso',
            description: 'Elige el curso del cual quieres ver los estudiantes inscritos y su progreso.'
        },
        placement: 'bottom'
    },
    {
        target: '#enrollments-student-list',
        content: {
            title: 'Lista de Estudiantes',
            description: 'Aquí verás a todos los inscritos, su progreso y su estado. Puedes buscar un estudiante específico o ver los detalles de su avance.'
        },
        placement: 'top'
    }
];

export const manageCoursesTour: TourStep[] = [
    {
        target: '#create-course-btn',
        content: {
            title: 'Crea un Nuevo Curso',
            description: 'Empieza a construir tu próximo curso desde aquí. Se creará como un borrador para que puedas añadir contenido.'
        },
        placement: 'bottom'
    },
    {
        target: '#course-status-tabs',
        content: {
            title: 'Filtra por Estado',
            description: 'Usa estas pestañas para encontrar rápidamente los cursos que están publicados, en borrador o archivados.'
        },
        placement: 'bottom'
    },
    {
        target: '#course-list-container',
        content: {
            title: 'Tus Cursos',
            description: 'Aquí se listan todos tus cursos. Haz clic en uno para editar su contenido o usa el menú (...) para ver más opciones como publicar o eliminar.'
        },
        placement: 'top'
    }
];

export const myNotesTour: TourStep[] = [
    {
        target: '#my-notes-header',
        content: {
            title: 'Tu Tablero de Apuntes',
            description: 'Este es tu espacio personal. Todas las notas que tomes en las lecciones aparecerán aquí, organizadas por curso y módulo.'
        },
        placement: 'bottom'
    },
    {
        target: '#my-notes-board',
        content: {
            title: 'Notas Adhesivas',
            description: 'Cada nota es como un post-it virtual. Puedes editarlas directamente, eliminarlas o usar el enlace para saltar directamente a la lección correspondiente.'
        },
        placement: 'top'
    }
];

export const resourcesTour: TourStep[] = [
    {
        target: '#resources-breadcrumbs',
        content: {
            title: 'Navegación por Carpetas',
            description: 'Usa esta "ruta de migas" para saber en qué carpeta te encuentras y para volver fácilmente a las carpetas anteriores.'
        },
        placement: 'bottom'
    },
    {
        target: '#resources-controls',
        content: {
            title: 'Controles y Acciones',
            description: 'Busca archivos, filtra por categoría, cambia entre vista de cuadrícula o lista y, si tienes permisos, sube nuevos recursos o crea carpetas.'
        },
        placement: 'bottom'
    },
    {
        target: '#resources-folder-list',
        content: {
            title: 'Carpetas',
            description: 'Haz clic en una carpeta para abrirla y ver su contenido.'
        },
        placement: 'top'
    },
    {
        target: '#resources-file-list',
        content: {
            title: 'Archivos',
            description: 'Haz clic en un archivo para previsualizarlo. Usa el menú de opciones (...) para descargarlo, editar sus detalles o eliminarlo.'
        },
        placement: 'top'
    }
];

export const securityAuditTour: TourStep[] = [
    {
        target: '#security-stats-cards',
        content: {
            title: 'Métricas de Seguridad',
            description: 'Un resumen rápido de la actividad de seguridad más reciente en la plataforma.'
        },
        placement: 'bottom'
    },
    {
        target: '#security-log-table',
        content: {
            title: 'Registro de Eventos',
            description: 'Aquí se registra cada acción importante. Puedes filtrar por tipo de evento para investigar incidentes específicos.'
        },
        placement: 'top'
    }
];

    