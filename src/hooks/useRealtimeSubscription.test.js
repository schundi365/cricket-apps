/**
 * Tests for useRealtimeSubscription Hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { supabase } from '../lib/supabase';

// Mock the supabase module
jest.mock('../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn()
  }
}));

describe('useRealtimeSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sets up subscription on mount', () => {
    const mockCallback = jest.fn();
    const mockSubscribe = jest.fn((callback) => {
      callback('SUBSCRIBED');
      return { unsubscribe: jest.fn() };
    });
    const mockOn = jest.fn().mockReturnValue({
      subscribe: mockSubscribe
    });

    supabase.channel.mockReturnValue({
      on: mockOn
    });

    renderHook(() => useRealtimeSubscription('players', mockCallback));

    expect(supabase.channel).toHaveBeenCalled();
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'players'
      }),
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  test('calls callback when data changes', () => {
    const mockCallback = jest.fn();
    let changeHandler;
    
    const mockSubscribe = jest.fn((callback) => {
      callback('SUBSCRIBED');
      return { unsubscribe: jest.fn() };
    });
    
    const mockOn = jest.fn((event, config, handler) => {
      changeHandler = handler;
      return {
        subscribe: mockSubscribe
      };
    });

    supabase.channel.mockReturnValue({
      on: mockOn
    });

    renderHook(() => useRealtimeSubscription('players', mockCallback));

    // Simulate a data change
    const payload = {
      eventType: 'INSERT',
      new: { id: '1', name: 'John Doe' }
    };
    changeHandler(payload);

    expect(mockCallback).toHaveBeenCalledWith(payload);
  });

  test('unsubscribes on unmount', () => {
    const mockCallback = jest.fn();
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        callback('SUBSCRIBED');
        return mockChannel;
      })
    };

    supabase.channel.mockReturnValue(mockChannel);

    const { unmount } = renderHook(() => useRealtimeSubscription('players', mockCallback));

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  test('handles specific event types', () => {
    const mockCallback = jest.fn();
    const mockSubscribe = jest.fn((callback) => {
      callback('SUBSCRIBED');
      return { unsubscribe: jest.fn() };
    });
    const mockOn = jest.fn().mockReturnValue({
      subscribe: mockSubscribe
    });

    supabase.channel.mockReturnValue({
      on: mockOn
    });

    renderHook(() => 
      useRealtimeSubscription('players', mockCallback, { event: 'INSERT' })
    );

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'players'
      }),
      expect.any(Function)
    );
  });

  test('handles filters', () => {
    const mockCallback = jest.fn();
    const mockSubscribe = jest.fn((callback) => {
      callback('SUBSCRIBED');
      return { unsubscribe: jest.fn() };
    });
    const mockOn = jest.fn().mockReturnValue({
      subscribe: mockSubscribe
    });

    supabase.channel.mockReturnValue({
      on: mockOn
    });

    renderHook(() => 
      useRealtimeSubscription('players', mockCallback, { 
        filter: { column: 'team', value: 'Team A' }
      })
    );

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'players',
        column: 'team',
        value: 'Team A'
      }),
      expect.any(Function)
    );
  });
});
