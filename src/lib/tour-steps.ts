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
    target: '#course-list-container > div:first-child',
    content: {
      title: 'Tarjeta de Curso',
      description: 'Cada curso que creas aparece aquí. Puedes ver su estado y acceder a las opciones de edición.',
    },
    placement: 'right',
  },
  {
    target: '#course-list-container > div:first-child button[aria-haspopup="menu"]',
    content: {
      title: 'Opciones del Curso',
      description: 'Desde este menú puedes publicar, archivar o eliminar el curso. ¡También puedes acceder a una vista previa!',
    },
    placement: 'left',
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
