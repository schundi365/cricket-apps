/**
 * Tests for useNetsStatistics Hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useNetsStatistics } from './useNetsStatistics';
import { supabase } from '../lib/supabase';

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('useNetsStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches nets statistics successfully on mount', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [
      { id: '1', session_id: sessionId, player_id: 'p1', attended: true, dismissals: 2, wickets: 3, extras: 1 },
      { id: '2', session_id: sessionId, player_id: 'p2', attended: true, dismissals: 1, wickets: 2, extras: 0 }
    ];

    const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

    supabase.from.mockReturnValue({
      select: mockSelect
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.statistics).toEqual([]);
    expect(result.current.error).toBe(null);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statistics).toEqual(mockStatistics);
    expect(result.current.error).toBe(null);
  });

  test('fetches nets statistics with new columns including session_date', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [
      { 
        id: '1', 
        session_id: sessionId, 
        player_id: 'p1', 
        nets_attended: true, 
        dismissals: 2, 
        wickets: 3, 
        extras: 1,
        session_date: '2024-01-15',
        works_on_technique: true,
        punctual_to_training: true,
        batting_points: 10,
        bowling_points: 5,
        fielding_points: 3,
        technique_points: 1,
        punctuality_points: 1
      }
    ];

    const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

    supabase.from.mockReturnValue({
      select: mockSelect
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify all new columns are present
    expect(result.current.statistics).toHaveLength(1);
    const stat = result.current.statistics[0];
    expect(stat.session_date).toBe('2024-01-15');
    expect(stat.nets_attended).toBe(true);
    expect(stat.works_on_technique).toBe(true);
    expect(stat.punctual_to_training).toBe(true);
    expect(stat.batting_points).toBe(10);
    expect(stat.bowling_points).toBe(5);
    expect(stat.fielding_points).toBe(3);
    expect(stat.technique_points).toBe(1);
    expect(stat.punctuality_points).toBe(1);
    
    // Verify select('*') was called to get all columns
    expect(mockSelect).toHaveBeenCalledWith('*');
  });

  test('handles fetch error', async () => {
    const sessionId = 'session-1';
    const mockError = new Error('Database error');

    const mockEq = jest.fn().mockResolvedValue({ data: null, error: mockError });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

    supabase.from.mockReturnValue({
      select: mockSelect
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statistics).toEqual([]);
    expect(result.current.error).toBeTruthy();
    expect(result.current.error.message).toBe('Unable to load nets statistics. Please check your connection and try again.');
    expect(result.current.error.originalError).toBe(mockError);
  });

  test('updateStatistic updates existing statistic', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [
      { id: '1', session_id: sessionId, player_id: 'p1', attended: true, dismissals: 2, wickets: 3, extras: 1 }
    ];

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
                })
              })
            })
          };
        }
        
        // Third call: update statistic
        if (callCount === 3) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { id: '1', session_id: sessionId, player_id: 'p1', attended: true, dismissals: 5, wickets: 3, extras: 1 },
                      error: null
                    })
                  })
                })
              })
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update statistic
    await act(async () => {
      await result.current.updateStatistic('p1', { dismissals: 5 });
    });

    expect(result.current.statistics[0].dismissals).toBe(5);
  });

  test('updateStatistic inserts new statistic if not exists', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [];

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          };
        }
        
        // Third call: insert new statistic
        if (callCount === 3) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: '1', session_id: sessionId, player_id: 'p1', attended: true, dismissals: 2, wickets: 3, extras: 1 },
                  error: null
                })
              })
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Insert new statistic
    await act(async () => {
      await result.current.updateStatistic('p1', { attended: true, dismissals: 2, wickets: 3, extras: 1 });
    });

    expect(result.current.statistics).toHaveLength(1);
    expect(result.current.statistics[0].player_id).toBe('p1');
  });

  test('updateStatistic calculates technique_points from works_on_technique', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [];

    let insertedData = null;
    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          };
        }
        
        // Third call: insert new statistic
        if (callCount === 3) {
          return {
            insert: jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...data, id: '1' },
                    error: null
                  })
                })
              };
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Insert new statistic with works_on_technique = true
    await act(async () => {
      await result.current.updateStatistic('p1', { works_on_technique: true });
    });

    // Verify technique_points was calculated and included in insert
    expect(insertedData).toBeTruthy();
    expect(insertedData.works_on_technique).toBe(true);
    expect(insertedData.technique_points).toBe(1);
  });

  test('updateStatistic calculates punctuality_points from punctual_to_training', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [];

    let insertedData = null;
    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          };
        }
        
        // Third call: insert new statistic
        if (callCount === 3) {
          return {
            insert: jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...data, id: '1' },
                    error: null
                  })
                })
              };
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Insert new statistic with punctual_to_training = true
    await act(async () => {
      await result.current.updateStatistic('p1', { punctual_to_training: true });
    });

    // Verify punctuality_points was calculated and included in insert
    expect(insertedData).toBeTruthy();
    expect(insertedData.punctual_to_training).toBe(true);
    expect(insertedData.punctuality_points).toBe(1);
  });

  test('updateStatistic sets technique_points to 0 when works_on_technique is false', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [];

    let insertedData = null;
    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          };
        }
        
        // Third call: insert new statistic
        if (callCount === 3) {
          return {
            insert: jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...data, id: '1' },
                    error: null
                  })
                })
              };
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Insert new statistic with works_on_technique = false
    await act(async () => {
      await result.current.updateStatistic('p1', { works_on_technique: false });
    });

    // Verify technique_points is 0
    expect(insertedData).toBeTruthy();
    expect(insertedData.works_on_technique).toBe(false);
    expect(insertedData.technique_points).toBe(0);
  });

  test('updateStatistic includes all new columns with default values on insert', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [];

    let insertedData = null;
    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          };
        }
        
        // Third call: insert new statistic
        if (callCount === 3) {
          return {
            insert: jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...data, id: '1' },
                    error: null
                  })
                })
              };
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Insert new statistic with minimal data
    await act(async () => {
      await result.current.updateStatistic('p1', { nets_attended: true });
    });

    // Verify all new columns are included with default values
    expect(insertedData).toBeTruthy();
    expect(insertedData.session_id).toBe(sessionId);
    expect(insertedData.player_id).toBe('p1');
    expect(insertedData.nets_attended).toBe(true);
    expect(insertedData.dismissals).toBe(0);
    expect(insertedData.wickets).toBe(0);
    expect(insertedData.extras).toBe(0);
    expect(insertedData.works_on_technique).toBe(false);
    expect(insertedData.punctual_to_training).toBe(false);
    expect(insertedData.batting_points).toBe(0);
    expect(insertedData.bowling_points).toBe(0);
    expect(insertedData.fielding_points).toBe(0);
    expect(insertedData.technique_points).toBe(0);
    expect(insertedData.punctuality_points).toBe(0);
  });

  test('updateStatistic uses nets_attended instead of attended', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [];

    let insertedData = null;
    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          };
        }
        
        // Third call: insert new statistic
        if (callCount === 3) {
          return {
            insert: jest.fn().mockImplementation((data) => {
              insertedData = data;
              return {
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...data, id: '1' },
                    error: null
                  })
                })
              };
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Insert new statistic
    await act(async () => {
      await result.current.updateStatistic('p1', {});
    });

    // Verify nets_attended is used (not attended)
    expect(insertedData).toBeTruthy();
    expect(insertedData.nets_attended).toBe(false);
    expect(insertedData.attended).toBeUndefined();
  });

  test('optimistic update includes all new columns for existing record', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [
      { 
        id: '1', 
        session_id: sessionId, 
        player_id: 'p1', 
        nets_attended: true,
        dismissals: 2,
        wickets: 3,
        extras: 1,
        session_date: '2024-01-15',
        works_on_technique: false,
        punctual_to_training: false,
        batting_points: 5,
        bowling_points: 3,
        fielding_points: 2,
        technique_points: 0,
        punctuality_points: 0,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }
    ];

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
                })
              })
            })
          };
        }
        
        // Third call: update statistic - simulate slow response
        if (callCount === 3) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockImplementation(() => {
                      return new Promise(resolve => {
                        setTimeout(() => {
                          resolve({
                            data: { 
                              ...mockStatistics[0], 
                              works_on_technique: true,
                              technique_points: 1,
                              updated_at: new Date().toISOString()
                            },
                            error: null
                          });
                        }, 100);
                      });
                    })
                  })
                })
              })
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update statistic and check optimistic update immediately
    act(() => {
      result.current.updateStatistic('p1', { works_on_technique: true });
    });

    // Check optimistic update includes all columns
    const optimisticStat = result.current.statistics.find(s => s.player_id === 'p1');
    expect(optimisticStat).toBeTruthy();
    expect(optimisticStat.works_on_technique).toBe(true);
    expect(optimisticStat.technique_points).toBe(1);
    // Verify all other columns are preserved
    expect(optimisticStat.session_date).toBe('2024-01-15');
    expect(optimisticStat.nets_attended).toBe(true);
    expect(optimisticStat.dismissals).toBe(2);
    expect(optimisticStat.wickets).toBe(3);
    expect(optimisticStat.extras).toBe(1);
    expect(optimisticStat.punctual_to_training).toBe(false);
    expect(optimisticStat.batting_points).toBe(5);
    expect(optimisticStat.bowling_points).toBe(3);
    expect(optimisticStat.fielding_points).toBe(2);
    expect(optimisticStat.punctuality_points).toBe(0);
  });

  test('optimistic update includes all new columns for new record', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [];

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          };
        }
        
        // Third call: insert - simulate slow response
        if (callCount === 3) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockImplementation(() => {
                  return new Promise(resolve => {
                    setTimeout(() => {
                      resolve({
                        data: { 
                          id: '1',
                          session_id: sessionId,
                          player_id: 'p1',
                          nets_attended: true,
                          dismissals: 0,
                          wickets: 0,
                          extras: 0,
                          session_date: '2024-01-15',
                          works_on_technique: false,
                          punctual_to_training: false,
                          batting_points: 0,
                          bowling_points: 0,
                          fielding_points: 0,
                          technique_points: 0,
                          punctuality_points: 0,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        },
                        error: null
                      });
                    }, 100);
                  });
                })
              })
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Create new statistic and check optimistic update immediately
    act(() => {
      result.current.updateStatistic('p1', { nets_attended: true });
    });

    // Check optimistic update includes all columns with defaults
    const optimisticStat = result.current.statistics.find(s => s.player_id === 'p1');
    expect(optimisticStat).toBeTruthy();
    expect(optimisticStat.session_id).toBe(sessionId);
    expect(optimisticStat.player_id).toBe('p1');
    expect(optimisticStat.nets_attended).toBe(true);
    expect(optimisticStat.dismissals).toBe(0);
    expect(optimisticStat.wickets).toBe(0);
    expect(optimisticStat.extras).toBe(0);
    expect(optimisticStat.works_on_technique).toBe(false);
    expect(optimisticStat.punctual_to_training).toBe(false);
    expect(optimisticStat.batting_points).toBe(0);
    expect(optimisticStat.bowling_points).toBe(0);
    expect(optimisticStat.fielding_points).toBe(0);
    expect(optimisticStat.technique_points).toBe(0);
    expect(optimisticStat.punctuality_points).toBe(0);
    expect(optimisticStat.session_date).toBe(null); // Will be populated by trigger
  });

  test('rollback restores all columns including new ones on error', async () => {
    const sessionId = 'session-1';
    const originalStat = { 
      id: '1', 
      session_id: sessionId, 
      player_id: 'p1', 
      nets_attended: true,
      dismissals: 2,
      wickets: 3,
      extras: 1,
      session_date: '2024-01-15',
      works_on_technique: false,
      punctual_to_training: true,
      batting_points: 5,
      bowling_points: 3,
      fielding_points: 2,
      technique_points: 0,
      punctuality_points: 1,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    };
    const mockStatistics = [originalStat];

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null })
                })
              })
            })
          };
        }
        
        // Third call: update statistic - simulate error
        if (callCount === 3) {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: new Error('Database error')
                    })
                  })
                })
              })
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Attempt to update statistic (will fail)
    await act(async () => {
      try {
        await result.current.updateStatistic('p1', { works_on_technique: true });
      } catch (err) {
        // Expected error
      }
    });

    // Verify rollback restored all original columns
    const rolledBackStat = result.current.statistics.find(s => s.player_id === 'p1');
    expect(rolledBackStat).toBeTruthy();
    expect(rolledBackStat).toEqual(originalStat);
    // Specifically verify new columns are restored
    expect(rolledBackStat.session_date).toBe('2024-01-15');
    expect(rolledBackStat.works_on_technique).toBe(false);
    expect(rolledBackStat.punctual_to_training).toBe(true);
    expect(rolledBackStat.batting_points).toBe(5);
    expect(rolledBackStat.bowling_points).toBe(3);
    expect(rolledBackStat.fielding_points).toBe(2);
    expect(rolledBackStat.technique_points).toBe(0);
    expect(rolledBackStat.punctuality_points).toBe(1);
  });

  test('rollback removes optimistically added record on error', async () => {
    const sessionId = 'session-1';
    const mockStatistics = [];

    let callCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'nets_statistics') {
        callCount++;
        
        // First call: initial fetch
        if (callCount === 1) {
          const mockEq = jest.fn().mockResolvedValue({ data: mockStatistics, error: null });
          return {
            select: jest.fn().mockReturnValue({ eq: mockEq })
          };
        }
        
        // Second call: check if statistic exists
        if (callCount === 2) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            })
          };
        }
        
        // Third call: insert statistic - simulate error
        if (callCount === 3) {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Database error')
                })
              })
            })
          };
        }
      }
    });

    const { result } = renderHook(() => useNetsStatistics(sessionId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify no statistics initially
    expect(result.current.statistics).toHaveLength(0);

    // Attempt to create new statistic (will fail)
    await act(async () => {
      try {
        await result.current.updateStatistic('p1', { nets_attended: true });
      } catch (err) {
        // Expected error
      }
    });

    // Verify rollback removed the optimistically added record
    expect(result.current.statistics).toHaveLength(0);
    const stat = result.current.statistics.find(s => s.player_id === 'p1');
    expect(stat).toBeUndefined();
  });
});
