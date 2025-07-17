// src/lib/holidays.ts
import { getYear, isSameDay, parseISO } from 'date-fns';

type Holiday = {
  date: string; // YYYY-MM-DD
  name: string;
};

// For this prototype, we'll use a static list for multiple years.
// In a production app, this could come from an API or a more robust library.
const holidaysByYear_CO: Record<number, Holiday[]> = {
  2024: [
    { date: '2024-01-01', name: 'Año Nuevo' },
    { date: '2024-01-08', name: 'Día de los Reyes Magos' },
    { date: '2024-03-25', name: 'Día de San José' },
    { date: '2024-03-28', name: 'Jueves Santo' },
    { date: '2024-03-29', name: 'Viernes Santo' },
    { date: '2024-05-01', name: 'Día del Trabajo' },
    { date: '2024-05-13', name: 'Día de la Ascensión' },
    { date: '2024-06-03', name: 'Corpus Christi' },
    { date: '2024-06-10', name: 'Sagrado Corazón' },
    { date: '2024-07-01', name: 'Día de San Pedro y San Pablo' },
    { date: '2024-07-20', name: 'Día de la Independencia' },
    { date: '2024-08-07', name: 'Batalla de Boyacá' },
    { date: '2024-08-19', name: 'La asunción de la Virgen' },
    { date: '2024-10-14', name: 'Día de la Raza' },
    { date: '2024-11-04', name: 'Todos los Santos' },
    { date: '2024-11-11', name: 'Independencia de Cartagena' },
    { date: '2024-12-08', name: 'Día de la Inmaculada Concepción' },
    { date: '2024-12-25', name: 'Navidad' },
  ],
  2025: [
    { date: '2025-01-01', name: 'Año Nuevo' },
    { date: '2025-01-06', name: 'Día de los Reyes Magos' },
    { date: '2025-03-24', name: 'Día de San José' },
    { date: '2025-04-17', name: 'Jueves Santo' },
    { date: '2025-04-18', name: 'Viernes Santo' },
    { date: '2025-05-01', name: 'Día del Trabajo' },
    { date: '2025-06-02', name: 'Día de la Ascensión' },
    { date: '2025-06-23', name: 'Corpus Christi' },
    { date: '2025-06-30', name: 'Sagrado Corazón' },
    { date: '2025-07-07', name: 'Día de San Pedro y San Pablo' },
    { date: '2025-07-20', name: 'Día de la Independencia' },
    { date: '2025-08-07', name: 'Batalla de Boyacá' },
    { date: '2025-08-18', name: 'La asunción de la Virgen' },
    { date: '2025-10-13', name: 'Día de la Raza' },
    { date: '2025-11-03', name: 'Todos los Santos' },
    { date: '2025-11-17', name: 'Independencia de Cartagena' },
    { date: '2025-12-08', name: 'Día de la Inmaculada Concepción' },
    { date: '2025-12-25', name: 'Navidad' },
  ],
  2026: [
    { date: '2026-01-01', name: 'Año Nuevo' },
    { date: '2026-01-12', name: 'Día de los Reyes Magos' },
    { date: '2026-03-23', name: 'Día de San José' },
    { date: '2026-04-02', name: 'Jueves Santo' },
    { date: '2026-04-03', name: 'Viernes Santo' },
    { date: '2026-05-01', name: 'Día del Trabajo' },
    { date: '2026-05-18', name: 'Día de la Ascensión' },
    { date: '2026-06-08', name: 'Corpus Christi' },
    { date: '2026-06-15', name: 'Sagrado Corazón' },
    { date: '2026-06-29', name: 'Día de San Pedro y San Pablo' },
    { date: '2026-07-20', name: 'Día de la Independencia' },
    { date: '2026-08-07', name: 'Batalla de Boyacá' },
    { date: '2026-08-17', name: 'La asunción de la Virgen' },
    { date: '2026-10-12', name: 'Día de la Raza' },
    { date: '2026-11-02', name: 'Todos los Santos' },
    { date: '2026-11-16', name: 'Independencia de Cartagena' },
    { date: '2026-12-08', name: 'Día de la Inmaculada Concepción' },
    { date: '2026-12-25', name: 'Navidad' },
  ]
};

/**
 * Checks if a given date is a holiday for a specific country.
 * @param date The date to check.
 * @param countryCode The ISO 3166-1 alpha-2 country code (currently only 'CO' is supported).
 * @returns The holiday object if it's a holiday, otherwise null.
 */
export function isHoliday(date: Date, countryCode: 'CO'): Holiday | null {
  if (countryCode !== 'CO') {
    return null;
  }

  const year = getYear(date);
  const holidayList = holidaysByYear_CO[year];

  if (!holidayList) {
    return null; // No holiday data for this year
  }

  const foundHoliday = holidayList.find(holiday => 
    isSameDay(parseISO(holiday.date), date)
  );
  
  return foundHoliday || null;
}
