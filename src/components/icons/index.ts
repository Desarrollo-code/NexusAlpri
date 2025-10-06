// This file serves as a central hub for exporting all custom icons.
// This makes importing icons cleaner in other components.
import * as React from 'react';
import { SVGProps } from 'react';

export * from './icon-activity';
export * from './icon-arrow-down';
export * from './icon-arrow-up';
export * from './icon-award';
export * from './icon-bar-chart-3';
export * from './icon-book-marked';
export * from './icon-book-open';
export * from './icon-calendar-days';
export * from './icon-camera';
export * from './icon-check-check';
export * from './icon-chevron-right';
export * from './icon-crop';
export * from './icon-file-plus';
export * from './icon-file-text';
export * from './icon-file-warning';
export * from './icon-filter';
export * from './icon-folder';
export * from './icon-graduation-cap';
export * from './icon-grid';
export * from './icon-home';
export * from './icon-layout-grid';
export * from './icon-list';
export * from './icon-loader';
export * from './icon-mail-warning';
export * from './icon-megaphone';
export * from './icon-notebook';
export * from './icon-plus-circle';
export * from './icon-replace';
export * from './icon-rocket';
export * from './icon-rotate';
export * from './icon-server';
export * from './icon-shield';
export * from './icon-shield-alert';
export * from './icon-shield-x';
export * from './icon-sparkles';
export * from './icon-trending-up';
export * from './icon-user-cog';
export * from './icon-users-round';
export * from './icon-zoom-in';
export * from './icon-zoom-out';

// Definimos el componente directamente aquí para evitar errores de referencia.
export const IconSettings = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <defs>
        <linearGradient id="settings-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#A78BFA', stopOpacity: 1 }} />
        </linearGradient>
    </defs>
    <path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.79a2 2 0 0 1-1.69.9L2.5 6.4a2 2 0 0 0-1 1.73l-.43 3.56a2 2 0 0 0 .34 1.88l1.73 2.51a2 2 0 0 1 0 2.22l-1.73 2.51a2 2 0 0 0-.34 1.88l.43 3.56a2 2 0 0 0 1 1.73l1.59.7a2 2 0 0 1 1.69.9v.79a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.79a2 2 0 0 1 1.69-.9l1.59-.7a2 2 0 0 0 1-1.73l.43-3.56a2 2 0 0 0-.34-1.88l-1.73-2.51a2 2 0 0 1 0-2.22l1.73-2.51a2 2 0 0 0 .34-1.88l-.43-3.56a2 2 0 0 0-1-1.73l-1.59-.7a2 2 0 0 1-1.69-.9V4a2 2 0 0 0-2-2z" stroke="url(#settings-gradient)"/>
    <circle cx="12" cy="12" r="3" stroke="url(#settings-gradient)"/>
  </svg>
);
