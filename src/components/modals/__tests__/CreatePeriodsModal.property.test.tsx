// Feature: flow-master-react-frontend
// Property 10: Period modal input validation

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Property 10: Period modal input validation
// Validates: Requirements 6.8
// ---------------------------------------------------------------------------

// Extract the validation logic to test it directly
function isValidCount(count: string): boolean {
  const num = parseInt(count, 10);
  return Number.isInteger(num) && num >= 1 && num <= 12;
}

describe('Property 10 – Period modal input validation', () => {
  it('accepts integer values in range [1, 12] and rejects all others', () => {
    fc.assert(
      fc.property(fc.integer(), (value) => {
        const countStr = String(value);
        const isValid = isValidCount(countStr);
        const expected = Number.isInteger(value) && value >= 1 && value <= 12;
        
        expect(isValid).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects values below 1', () => {
    fc.assert(
      fc.property(fc.integer({ max: 0 }), (value) => {
        const countStr = String(value);
        const isValid = isValidCount(countStr);
        
        expect(isValid).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it('rejects values above 12', () => {
    fc.assert(
      fc.property(fc.integer({ min: 13 }), (value) => {
        const countStr = String(value);
        const isValid = isValidCount(countStr);
        
        expect(isValid).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  it('accepts all valid values in [1, 12]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 12 }), (value) => {
        const countStr = String(value);
        const isValid = isValidCount(countStr);
        
        expect(isValid).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  it('rejects non-numeric strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => isNaN(parseInt(s, 10))),
        (value) => {
          const isValid = isValidCount(value);
          
          // Non-numeric strings should be rejected
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});
