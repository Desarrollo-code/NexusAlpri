// This file serves as a central hub for exporting all custom icons.
// This makes importing icons cleaner in other components.
import * as React from 'react';
import { SVGProps } from 'react';

export const IconActivity = (props: SVGProps<SVGSVGElement>) => (
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
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const IconArrowDown = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </svg>
);

export const IconArrowUp = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="m5 12 7-7 7 7M12 19V5" />
  </svg>
);

export const IconCamera = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx={12} cy={13} r={3} />
  </svg>
);

export const IconCheckCheck = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M18 6 7 17l-5-5" />
    <path d="m22 10-7.5 7.5L13 16" />
  </svg>
);

export const IconChevronRight = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const IconCrop = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M6 2v14a2 2 0 0 0 2 2h14" />
    <path d="M18 22V8a2 2 0 0 0-2-2H2" />
  </svg>
);

export const IconFilePlus = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M12 9v6" />
    <path d="M9 12h6" />
  </svg>
);

export const IconFileWarning = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const IconFilter = (props: SVGProps<SVGSVGElement>) => (
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
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const IconGrid = (props: SVGProps<SVGSVGElement>) => (
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
    <rect width={18} height={18} x={3} y={3} rx={2} />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

export const IconHome = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const IconList = (props: SVGProps<SVGSVGElement>) => (
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
    <line x1={8} x2={21} y1={6} y2={6} />
    <line x1={8} x2={21} y1={12} y2={12} />
    <line x1={8} x2={21} y1={18} y2={18} />
    <line x1={3} x2={3.01} y1={6} y2={6} />
    <line x1={3} x2={3.01} y1={12} y2={12} />
    <line x1={3} x2={3.01} y1={18} y2={18} />
  </svg>
);

export const IconLoader = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2v4" />
    <path d="m16.2 7.8 2.8-2.8" />
    <path d="M18 12h4" />
    <path d="m16.2 16.2 2.8 2.8" />
    <path d="M12 18v4" />
    <path d="m7.8 16.2-2.8 2.8" />
    <path d="M6 12H2" />
    <path d="m7.8 7.8-2.8-2.8" />
  </svg>
);

export const IconMailWarning = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M22 13.4V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1.4" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    <path d="M20 3v6" />
    <path d="M20 12.1v-.1" />
  </svg>
);

export const IconPlusCircle = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx={12} cy={12} r={10} />
    <line x1={12} y1={8} x2={12} y2={16} />
    <line x1={8} y1={12} x2={16} y2={12} />
  </svg>
);

export const IconReplace = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M14 4h6v6" />
    <path d="m20 4-6 6" />
    <path d="M10 20H4v-6" />
    <path d="m4 20 6-6" />
  </svg>
);

export const IconRotate = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const IconShieldX = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m14.5 9-5 5" />
    <path d="m9.5 9 5 5" />
  </svg>
);

export const IconUserCog = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx={18} cy={15} r={3} />
    <circle cx={6} cy={9} r={4} />
    <path d="M12 19.5a6.5 6.5 0 0 0-7-5.2" />
    <path d="M21.2 21a3 3 0 0 0-1.2-5.2" />
  </svg>
);

export const IconZoomIn = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx={11} cy={11} r={8} />
    <line x1={21} x2={16.65} y1={21} y2={16.65} />
    <line x1={11} x2={11} y1={8} y2={14} />
    <line x1={8} x2={14} y1={11} y2={11} />
  </svg>
);

export const IconZoomOut = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx={11} cy={11} r={8} />
    <line x1={21} x2={16.65} y1={21} y2={16.65} />
    <line x1={8} x2={14} y1={11} y2={11} />
  </svg>
);

export const RocketIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.11.66-1.47 1.35-3.02 2.23-4.65a25.26 25.26 0 0 0 5.79-5.79c1.63-.88 3.18-1.57 4.65-2.23-.81-.65-2.27-.66-3.11-.05-1.26 1.5-5 2-5 2s-3.74.5-5 2c-.71.84-.7 2.3-.05 3.11C7.52 14.28 6.18 15.65 4.5 16.5Z" />
    <path d="m12 15.01-3.5 3.5a2.24 2.24 0 0 1-3.18 0l-1.82-1.82a2.24 2.24 0 0 1 0-3.18l3.5-3.5" />
    <path d="m15 12.01-3.5 3.5" />
    <path d="M22 2 17.5 6.5" />
  </svg>
);

export * from './icon-layout-grid';
export * from './icon-book-open';
export * from './icon-graduation-cap';
export * from './icon-notebook';
export * from './icon-folder';
export * from './icon-megaphone';
export * from './icon-calendar-days';
export * from './icon-file-text';
export * from './icon-shield';
export * from './icon-book-marked';
export * from './icon-trending-up';
export * from './icon-sparkles';
export * from './icon-award';
export * from './icon-bar-chart-3';
export * from './icon-users-round';
export * from './icon-server';
export * from './icon-shield-alert';

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
