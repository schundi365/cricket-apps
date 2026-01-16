/**
 * Tests for useSkillsRatings Hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useSkillsRatings } from './useSkillsRatings';
import { supabase } from '../lib/supabase';

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('useSkillsRatings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches skills ratings successfully on mount', async () => {
    const mockRatings = [
      { id: '1', player_id: 'p1', batting: 8, bowling: 6, fielding: 7, fitness: 9 },
      { id: '2', player_id: 'p2', batting: 7, bowling: 8, fielding: 6, fitness: 7 }
    ];

    const mockSelect = jest.fn().mockResolvedValue({ data: mockRatings, error: null });

    supabase.from.mockReturnValue({
      select: mockSelect
    });

    const { result } = renderHook(() => useSkillsRatings());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.ratings.size).toBe(0);
    expect(result.current.error).toBe(null);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ratings.size).toBe(2);
    expect(result.current.ratings.get('p1')).toEqual(mockRatings[0]);
    expect(result.current.ratings.get('p2')).toEqual(mockRatings[1]);
    expect(result.current.error).toBe(null);
  });

  test('handles fetch error', async () => {
    const mockError = new Error('Database error');

    const mockSelect = jest.fn().mockResolvedValue({ data: null, error: mockError });

    supabase.from.mockReturnValue({
      select: mockSelect
    });

    const { result } = renderHook(() => useSkillsRatings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ratings.size).toBe(0);
    expect(result.current.error).toBe(mockError);
  });

  test('updateRating updates existing rating', async () => {
    const mockRatings = [
      { id: '1', player_id: 'p1', batting: 8, bowling: 6, fielding: 7, fitness: 9 }
    ];

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'skills_ratings') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          return {
            select: jest.fn().mockResolvedValue({ data: mockRatings, error: null })
          };
        }
        
        // Second call: check if rating exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
              })
            })
          };
        }
        
        // Third call: update rating
        if (callCount === 3) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: '1', player_id: 'p1', batting: 9, bowling: 6, fielding: 7, fitness: 9 },
                    error: null
                  })
                })
              })
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useSkillsRatings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update rating
    await act(async () => {
      await result.current.updateRating('p1', { batting: 9 });
    });

    expect(result.current.ratings.get('p1').batting).toBe(9);
  });

  test('updateRating inserts new rating if not exists', async () => {
    const mockRatings = [];

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'skills_ratings') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          return {
            select: jest.fn().mockResolvedValue({ data: mockRatings, error: null })
          };
        }
        
        // Second call: check if rating exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          };
        }
        
        // Third call: insert new rating
        if (callCount === 3) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: '1', player_id: 'p1', batting: 8, bowling: 7, fielding: 6, fitness: 9 },
                  error: null
                })
              })
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useSkillsRatings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Insert new rating
    await act(async () => {
      await result.current.updateRating('p1', { batting: 8, bowling: 7, fielding: 6, fitness: 9 });
    });

    expect(result.current.ratings.get('p1')).toBeDefined();
    expect(result.current.ratings.get('p1').batting).toBe(8);
  });
});
