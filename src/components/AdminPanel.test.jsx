/**
 * Tests for AdminPanel Component
 * 
 * These tests verify the admin panel UI functionality for player synchronization.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminPanel } from './AdminPanel';
import * as playerSyncService from '../services/playerSyncService';

// Mock the playerSyncService
jest.mock('../services/playerSyncService');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AdminPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Initial render', () => {
    test('should render admin panel with sync button', () => {
      render(<AdminPanel />);
      
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Player Synchronization')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sync players from play cricket/i })).toBeInTheDocument();
    });

    test('should display "Never" for last sync when no previous sync exists', () => {
      render(<AdminPanel />);
      
      expect(screen.getByText(/Last Sync:/)).toBeInTheDocument();
      expect(screen.getByText(/Never/)).toBeInTheDocument();
    });

    test('should display last sync timestamp from localStorage', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      localStorageMock.setItem('lastPlayerSyncTimestamp', testDate.toISOString());
      
      render(<AdminPanel />);
      
      expect(screen.getByText(/Last Sync:/)).toBeInTheDocument();
      // The exact format depends on locale, so just check it's not "Never"
      expect(screen.queryByText(/Never/)).not.toBeInTheDocument();
    });
  });

  describe('Sync button click', () => {
    test('should trigger sync when button is clicked', async () => {
      const mockSyncResult = {
        playersAdded: 5,
        playersUpdated: 3,
        playersUnchanged: 10,
        errors: []
      };
      playerSyncService.syncPlayersFromPlayCricket.mockResolvedValue(mockSyncResult);

      render(<AdminPanel />);
      
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(playerSyncService.syncPlayersFromPlayCricket).toHaveBeenCalledTimes(1);
      });
    });

    test('should disable button during sync', async () => {
      const mockSyncResult = {
        playersAdded: 0,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: []
      };
      playerSyncService.syncPlayersFromPlayCricket.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSyncResult), 100))
      );

      render(<AdminPanel />);
      
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      // Button should be disabled during sync
      expect(syncButton).toBeDisabled();
      expect(screen.getByText(/syncing players/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(syncButton).not.toBeDisabled();
      });
    });
  });

  describe('Loading state', () => {
    test('should display loading spinner during sync', async () => {
      const mockSyncResult = {
        playersAdded: 0,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: []
      };
      playerSyncService.syncPlayersFromPlayCricket.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSyncResult), 100))
      );

      render(<AdminPanel />);
      
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      // Should show loading message
      expect(screen.getByText(/fetching player data from play cricket website/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/fetching player data/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Success state', () => {
    test('should display sync results after successful sync', async () => {
      const mockSyncResult = {
        playersAdded: 5,
        playersUpdated: 3,
        playersUnchanged: 10,
        errors: []
      };
      playerSyncService.syncPlayersFromPlayCricket.mockResolvedValue(mockSyncResult);

      render(<AdminPanel />);
      
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/sync completed successfully/i)).toBeInTheDocument();
      });

      expect(screen.getByText('5')).toBeInTheDocument(); // Players added
      expect(screen.getByText('3')).toBeInTheDocument(); // Players updated
      expect(screen.getByText('10')).toBeInTheDocument(); // Unchanged
      expect(screen.getByText(/total: 18 players processed/i)).toBeInTheDocument();
    });

    test('should update last sync timestamp after successful sync', async () => {
      const mockSyncResult = {
        playersAdded: 2,
        playersUpdated: 1,
        playersUnchanged: 5,
        errors: []
      };
      playerSyncService.syncPlayersFromPlayCricket.mockResolvedValue(mockSyncResult);

      render(<AdminPanel />);
      
      // Initially should show "Never"
      expect(screen.getByText(/Never/)).toBeInTheDocument();

      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/sync completed successfully/i)).toBeInTheDocument();
      });

      // Should no longer show "Never"
      expect(screen.queryByText(/Never/)).not.toBeInTheDocument();
      
      // Verify localStorage was updated
      expect(localStorageMock.getItem('lastPlayerSyncTimestamp')).toBeTruthy();
    });
  });

  describe('Error state', () => {
    test('should display error message when sync fails', async () => {
      const mockSyncResult = {
        playersAdded: 0,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: ['Failed to fetch player data: Network error']
      };
      playerSyncService.syncPlayersFromPlayCricket.mockResolvedValue(mockSyncResult);

      render(<AdminPanel />);
      
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/failed to fetch player data: network error/i)).toBeInTheDocument();
    });

    test('should display retry button on error', async () => {
      const mockSyncResult = {
        playersAdded: 0,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: ['Connection timeout']
      };
      playerSyncService.syncPlayersFromPlayCricket.mockResolvedValue(mockSyncResult);

      render(<AdminPanel />);
      
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry sync/i });
      expect(retryButton).toBeInTheDocument();
    });

    test('should allow retry after error', async () => {
      const mockErrorResult = {
        playersAdded: 0,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: ['Network error']
      };
      const mockSuccessResult = {
        playersAdded: 5,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: []
      };
      
      playerSyncService.syncPlayersFromPlayCricket
        .mockResolvedValueOnce(mockErrorResult)
        .mockResolvedValueOnce(mockSuccessResult);

      render(<AdminPanel />);
      
      // First sync fails
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
      });

      // Retry sync
      const retryButton = screen.getByRole('button', { name: /retry sync/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/sync completed successfully/i)).toBeInTheDocument();
      });

      expect(playerSyncService.syncPlayersFromPlayCricket).toHaveBeenCalledTimes(2);
    });

    test('should handle exception thrown by sync service', async () => {
      playerSyncService.syncPlayersFromPlayCricket.mockRejectedValue(
        new Error('Unexpected error')
      );

      render(<AdminPanel />);
      
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/sync failed: unexpected error/i)).toBeInTheDocument();
      });
    });

    test('should not update last sync timestamp on error', async () => {
      const mockSyncResult = {
        playersAdded: 0,
        playersUpdated: 0,
        playersUnchanged: 0,
        errors: ['Sync failed']
      };
      playerSyncService.syncPlayersFromPlayCricket.mockResolvedValue(mockSyncResult);

      render(<AdminPanel />);
      
      const syncButton = screen.getByRole('button', { name: /sync players from play cricket/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry sync/i })).toBeInTheDocument();
      });

      // localStorage should not be updated
      expect(localStorageMock.getItem('lastPlayerSyncTimestamp')).toBeNull();
    });
  });

  describe('Help text', () => {
    test('should display help information', () => {
      render(<AdminPanel />);
      
      expect(screen.getByText(/about player sync/i)).toBeInTheDocument();
      expect(screen.getByText(/this tool fetches the latest squad information/i)).toBeInTheDocument();
    });
  });
});
