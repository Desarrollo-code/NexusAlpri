// src/lib/holidays.ts
import { isSameDay, parseISO } from 'date-fns';

type Holiday = {
  date: string; // YYYY-MM-DD
  name: string;
};

// For this prototype, we'll use a static list for 2025.
// In a production app, this could come from an API or a more robust library.
const holidays_2025_CO: Holiday[] = [
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
];

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

  const holidayList = holidays_2025_CO;

  const foundHoliday = holidayList.find(holiday => 
    isSameDay(parseISO(holiday.date), date)
  );
  
  return foundHoliday || null;
}
