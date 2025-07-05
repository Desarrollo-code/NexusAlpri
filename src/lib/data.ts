export const courses = [
  {
    id: 'CS101',
    title: 'Introducción a la Seguridad Digital',
    instructor: 'Admin',
    progress: 75,
    cover: 'https://placehold.co/600x400',
    hint: 'cybersecurity lock',
    description: 'Aprende los fundamentos de la ciberseguridad y protege tus activos digitales.',
    modules: [
      { id: 'M1', title: 'Conceptos Básicos', completed: true },
      { id: 'M2', title: 'Protección de Redes', completed: true },
      { id: 'M3', title: 'Criptografía', completed: false },
    ]
  },
  {
    id: 'PD202',
    title: 'Productividad y Herramientas Modernas',
    instructor: 'Instructor 1',
    progress: 45,
    cover: 'https://placehold.co/600x400',
    hint: 'team collaboration',
    description: 'Optimiza tu flujo de trabajo con las últimas herramientas de productividad.',
    modules: [
        { id: 'M1', title: 'Gestión del Tiempo', completed: true },
        { id: 'M2', title: 'Software Colaborativo', completed: false },
        { id: 'M3', title: 'Automatización de Tareas', completed: false },
      ]
  },
];

export const resources = [
  {
    id: 'RES001',
    title: 'Manual de Políticas de Seguridad',
    category: 'Políticas',
    type: 'PDF',
    thumbnail: 'https://placehold.co/400x300',
    hint: 'document security'
  },
  {
    id: 'RES002',
    title: 'Guía de Estilo de la Marca',
    category: 'Marketing',
    type: 'PDF',
    thumbnail: 'https://placehold.co/400x300',
    hint: 'brand guidelines'
  },
  {
    id: 'RES003',
    title: 'Plantillas de Presentación',
    category: 'Ventas',
    type: 'PPTX',
    thumbnail: 'https://placehold.co/400x300',
    hint: 'presentation template'
  },
];

export const announcements = [
  {
    id: 'ANN001',
    title: 'Actualización Importante de Seguridad',
    author: 'Admin',
    date: '2025-07-01',
    priority: 'Urgente',
    content: 'Se requiere que todo el personal complete el nuevo módulo de autenticación de dos factores antes del final de la semana.'
  },
  {
    id: 'ANN002',
    title: 'Nuevo Curso de Productividad Disponible',
    author: 'Instructor 1',
    date: '2025-06-28',
    priority: 'Normal',
    content: '¡Inscríbete ahora en el nuevo curso "Productividad y Herramientas Modernas" para mejorar tus habilidades!'
  },
];

export const events = [
    {
        id: 'EVT001',
        date: '2025-07-15',
        title: 'Webinar: Amenazas de Phishing',
        type: 'Webinar',
    },
    {
        id: 'EVT002',
        date: '2025-07-22',
        title: 'Taller de Herramientas Colaborativas',
        type: 'Taller',
    }
]

export const studentActivity = [
    { name: 'Juan Pérez', course: 'Seguridad Digital', progress: 95 },
    { name: 'María García', course: 'Seguridad Digital', progress: 80 },
    { name: 'Carlos López', course: 'Productividad', progress: 50 },
];
