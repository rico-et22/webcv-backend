import * as Handlebars from 'handlebars';

const POLISH_MONTHS: Record<string, string> = {
  '01': 'sty',
  '02': 'lut',
  '03': 'mar',
  '04': 'kwi',
  '05': 'maj',
  '06': 'cze',
  '07': 'lip',
  '08': 'sie',
  '09': 'wrz',
  '10': 'paź',
  '11': 'lis',
  '12': 'gru',
};

export function registerHelpers(): void {
  // Converts "2022-01" → "sty 2022", null/undefined/empty → "obecnie"
  Handlebars.registerHelper('formatDate', (dateStr: string | undefined) => {
    if (!dateStr) return 'obecnie';
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parts[1];
    if (!year) return 'obecnie';
    if (!month) return year;
    const monthName = POLISH_MONTHS[month] ?? month;
    return `${monthName} ${year}`;
  });

  // Equality check for use in templates
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
}
