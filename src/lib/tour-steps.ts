// src/lib/tour-steps.ts

export interface TourStep {
  target: string; // CSS selector for the element to highlight
  content: {
    title: string;
    description: string;
  };
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

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

// Puedes añadir más tours para otras páginas aquí
// export const dashboardTour: TourStep[] = [ ... ];
