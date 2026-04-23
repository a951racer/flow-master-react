import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatDate, isWithinNextDays } from './dateUtils';

// ─── Property 5: Period date formatting ──────────────────────────────────────
// Feature: flow-master-react-frontend, Property 5: Period date formatting
// Validates: Requirements 4.1

describe('formatDate', () => {
  it('formats 2025-01-05 as "Jan 5, 2025"', () => {
    expect(formatDate('2025-01-05')).toBe('Jan 5, 2025');
  });

  it('formats 2025-12-31 as "Dec 31, 2025"', () => {
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025');
  });

  it('formats 2024-02-29 as "Feb 29, 2024" (leap year)', () => {
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
  });

  it('Property 5 — output always matches MMM D, YYYY pattern for any valid ISO date', () => {
    const monthAbbrevs = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
    const pattern = new RegExp(`^(${monthAbbrevs}) \\d{1,2}, \\d{4}$`);

    // Generate year/month/day integers and build ISO strings
    const isoDateArb = fc
      .record({
        year: fc.integer({ min: 1970, max: 2100 }),
        month: fc.integer({ min: 1, max: 12 }),
        day: fc.integer({ min: 1, max: 28 }), // 1-28 is valid for every month/year
      })
      .map(({ year, month, day }) => {
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      });

    fc.assert(
      fc.property(isoDateArb, (dateStr) => {
        const result = formatDate(dateStr);
        expect(result).toMatch(pattern);
      }),
    );
  });
});

// ─── Property 6: Upcoming income filter correctness ──────────────────────────
// Feature: flow-master-react-frontend, Property 6: Upcoming income filter correctness
// Validates: Requirements 5.1

describe('isWithinNextDays', () => {
  it('Property 6 — filter returns exactly incomes within [today, today+3]', () => {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Build an ISO date string offset by `offsetDays` from today
    const offsetToIso = (offsetDays: number): string => {
      const d = new Date(todayMidnight);
      d.setDate(todayMidnight.getDate() + offsetDays);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Arbitrary: array of income-like objects with scheduledDate ±10 days from today
    const incomeArb = fc
      .record({
        id: fc.integer({ min: 1, max: 10000 }),
        name: fc.string({ minLength: 1, maxLength: 20 }),
        offsetDays: fc.integer({ min: -10, max: 10 }),
      })
      .map(({ id, name, offsetDays }) => ({
        id,
        name,
        scheduledDate: offsetToIso(offsetDays),
        _offsetDays: offsetDays,
      }));

    const incomesArb = fc.array(incomeArb, { minLength: 0, maxLength: 20 });

    fc.assert(
      fc.property(incomesArb, (incomes) => {
        const DAYS = 3;
        const filtered = incomes.filter((inc) =>
          isWithinNextDays(inc.scheduledDate, DAYS),
        );
        const excluded = incomes.filter(
          (inc) => !isWithinNextDays(inc.scheduledDate, DAYS),
        );

        // Every item in the result must be within [today, today+3]
        for (const inc of filtered) {
          expect(inc._offsetDays).toBeGreaterThanOrEqual(0);
          expect(inc._offsetDays).toBeLessThanOrEqual(DAYS);
        }

        // Every item NOT in the result must be outside [today, today+3]
        for (const inc of excluded) {
          const inRange =
            inc._offsetDays >= 0 && inc._offsetDays <= DAYS;
          expect(inRange).toBe(false);
        }
      }),
    );
  });
});

// ─── Property 7: Upcoming expense filter correctness ─────────────────────────
// Feature: flow-master-react-frontend, Property 7: Upcoming expense filter correctness
// Validates: Requirements 5.2

describe('isWithinNextDays — expense dueDate filter', () => {
  it('Property 7 — filter returns exactly expenses within [today, today+3]', () => {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Build an ISO date string offset by `offsetDays` from today
    const offsetToIso = (offsetDays: number): string => {
      const d = new Date(todayMidnight);
      d.setDate(todayMidnight.getDate() + offsetDays);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Arbitrary: array of expense-like objects with dueDate ±10 days from today
    const expenseArb = fc
      .record({
        id: fc.integer({ min: 1, max: 10000 }),
        name: fc.string({ minLength: 1, maxLength: 20 }),
        offsetDays: fc.integer({ min: -10, max: 10 }),
      })
      .map(({ id, name, offsetDays }) => ({
        id,
        name,
        dueDate: offsetToIso(offsetDays),
        _offsetDays: offsetDays,
      }));

    const expensesArb = fc.array(expenseArb, { minLength: 0, maxLength: 20 });

    fc.assert(
      fc.property(expensesArb, (expenses) => {
        const DAYS = 3;
        const filtered = expenses.filter((exp) =>
          isWithinNextDays(exp.dueDate, DAYS),
        );
        const excluded = expenses.filter(
          (exp) => !isWithinNextDays(exp.dueDate, DAYS),
        );

        // Every item in the result must be within [today, today+3]
        for (const exp of filtered) {
          expect(exp._offsetDays).toBeGreaterThanOrEqual(0);
          expect(exp._offsetDays).toBeLessThanOrEqual(DAYS);
        }

        // Every item NOT in the result must be outside [today, today+3]
        for (const exp of excluded) {
          const inRange =
            exp._offsetDays >= 0 && exp._offsetDays <= DAYS;
          expect(inRange).toBe(false);
        }
      }),
    );
  });
});
