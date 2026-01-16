/**
 * Tests for usePlayers Hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePlayers } from './usePlayers';
import { supabase } from '../lib/supabase';

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('usePlayers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches players successfully on mount', async () => {
    const mockPlayers = [
      { id: '1', name: 'John Doe', team: 'Team A' },
      { id: '2', name: 'Jane Smith', team: 'Team B' }
    ];

    const mockSelect = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: mockPlayers, error: null });

    supabase.from.mockReturnValue({
      select: mockSelect,
      order: mockOrder
    });

    mockSelect.mockReturnValue({
      order: mockOrder
    });

    const { result } = renderHook(() => usePlayers());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.players).toEqual([]);
    expect(result.current.error).toBe(null);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.players).toEqual(mockPlayers);
    expect(result.current.error).toBe(null);
    expect(supabase.from).toHaveBeenCalledWith('players');
  });

  test('handles fetch error', async () => {
    const mockError = new Error('Database error');

    const mockSelect = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: mockError });

    supabase.from.mockReturnValue({
      select: mockSelect,
      order: mockOrder
    });

    mockSelect.mockReturnValue({
      order: mockOrder
    });

    const { result } = renderHook(() => usePlayers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.players).toEqual([]);
    expect(result.current.error).toBe(mockError);
  });

  test('refetch function reloads players', async () => {
    const mockPlayers = [
      { id: '1', name: 'John Doe', team: 'Team A' }
    ];

    const mockSelect = jest.fn().mockReturnThis();
    const mockOrder = jest.fn().mockResolvedValue({ data: mockPlayers, error: null });

    supabase.from.mockReturnValue({
      select: mockSelect,
      order: mockOrder
    });

    mockSelect.mockReturnValue({
      order: mockOrder
    });

    const { result } = renderHook(() => usePlayers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock calls
    jest.clearAllMocks();

    // Call refetch
    result.current.refetch();

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('players');
    });
  });
});
