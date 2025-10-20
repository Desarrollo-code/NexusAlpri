'use client';

import * as React from 'react';
import * as XLSX from 'xlsx';
import { Button } from './button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportToCsvButtonProps {
  data: any[];
  filename: string;
  className?: string;
}

// Función para aplanar objetos complejos, en caso de que los datos estén anidados
const flattenObject = (obj: any, prefix = ''): any => {
  if (obj === null || typeof obj !== 'object') {
    return { [prefix]: obj };
  }
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};


export const ExportToCsvButton: React.FC<ExportToCsvButtonProps> = ({ data, filename, className }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      console.warn("No hay datos para exportar.");
      return;
    }

    // Aplanar los datos para manejar objetos anidados (como 'user')
    const flattenedData = data.map(row => flattenObject(row));

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Generar el archivo y disparar la descarga
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className={cn(className)}
    >
      <Download className="mr-2 h-4 w-4" />
      Exportar
    </Button>
  );
};
