// src/lib/holidays.ts
import Holidays from 'date-holidays';

// Initialize the library for Colombia
const hd = new Holidays('CO');

// Redefine the type locally to match what our component expects
// The library returns a more complex object, so we simplify it.
type Holiday = {
  date: string; // YYYY-MM-DD string
  name: string;
};

/**
 * Checks if a given date is a holiday for a specific country.
 * Uses the date-holidays library to dynamically calculate holidays for any year.
 * @param date The date to check.
 * @param countryCode The ISO 3166-1 alpha-2 country code (currently only 'CO' is supported).
 * @returns The holiday object if it's a holiday, otherwise null.
 */
export function isHoliday(date: Date, countryCode: 'CO'): Holiday | null {
  if (countryCode !== 'CO') {
    return null;
  }
  
  // The isHoliday method returns false or an array of holiday objects
  const holiday = hd.isHoliday(date);

  if (holiday && holiday.length > 0) {
    // Return the first holiday found for that day in a simplified format
    return {
      date: holiday[0].date,
      name: holiday[0].name,
    };
  }

  return null;
}
