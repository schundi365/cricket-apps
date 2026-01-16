/**
 * Tests for useNetsSessions Hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useNetsSessions } from './useNetsSessions';
import { supabase } from '../lib/supabase';

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('useNetsSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches nets sessions successfully on mount', async () => {
    const mockSessions = [
      { id: '1', session_date: '2024-01-15', session_name: 'Good session' },
      { id: '2', session_date: '2024-01-10', session_name: 'Rainy day' }
    ];

    const mockOrder = jest.fn().mockResolvedValue({ data: mockSessions, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });

    supabase.from.mockReturnValue({
      select: mockSelect
    });

    const { result } = renderHook(() => useNetsSessions());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.sessions).toEqual([]);
    expect(result.current.error).toBe(null);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.error).toBe(null);
  });

  test('handles fetch error', async () => {
    const mockError = new Error('Database error');

    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: mockError });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });

    supabase.from.mockReturnValue({
      select: mockSelect
    });

    const { result } = renderHook(() => useNetsSessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error.message).toContain('Unable to load nets sessions');
    expect(result.current.error.originalError).toBe(mockError);
  });

  test('createSession creates a new session', async () => {
    const mockSessions = [];
    const newSession = { id: '1', session_date: '2024-01-15', session_name: 'Test session' };

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_sessions') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockOrder = jest.fn().mockResolvedValue({ data: mockSessions, error: null });
          return {
            select: jest.fn().mockReturnValue({ order: mockOrder })
          };
        }
        
        // Second call: insert new session
        if (callCount === 2) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: newSession, error: null })
              })
            })
          };
        }
        
        // Third call: refetch after insert
        if (callCount === 3) {
          const mockOrder = jest.fn().mockResolvedValue({ data: [newSession], error: null });
          return {
            select: jest.fn().mockReturnValue({ order: mockOrder })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsSessions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Create new session
    let sessionId;
    await act(async () => {
      sessionId = await result.current.createSession('2024-01-15', 'Test session');
    });

    expect(sessionId).toBe('1');
    expect(result.current.sessions).toHaveLength(1);
  });
});
