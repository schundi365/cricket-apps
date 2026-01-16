import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import * as hooks from './hooks';

// Mock the hooks
jest.mock('./hooks', () => ({
  usePlayers: jest.fn(),
  useSkillsRatings: jest.fn(),
  useNetsSessions: jest.fn(),
  useNetsStatistics: jest.fn()
}));

test('renders MK Air Cricket Club title', () => {
  // Mock usePlayers to return empty data
  hooks.usePlayers.mockReturnValue({
    players: [],
    loading: false,
    error: null,
    refetch: jest.fn()
  });

  // Mock useSkillsRatings to return empty data
  hooks.useSkillsRatings.mockReturnValue({
    ratings: new Map(),
    loading: false,
    error: null,
    updateRating: jest.fn()
  });

  // Mock useNetsSessions
  hooks.useNetsSessions.mockReturnValue({
    sessions: [],
    loading: false,
    error: null,
    createSession: jest.fn()
  });

  // Mock useNetsStatistics
  hooks.useNetsStatistics.mockReturnValue({
    statistics: [],
    loading: false,
    error: null,
    updateStatistic: jest.fn()
  });

  render(<App />);
  const titleElement = screen.getByText(/MK Air Cricket Club/i);
  expect(titleElement).toBeInTheDocument();
});

test('displays loading state while fetching players', () => {
  // Mock usePlayers to return loading state
  hooks.usePlayers.mockReturnValue({
    players: [],
    loading: true,
    error: null,
    refetch: jest.fn()
  });

  // Mock useSkillsRatings
  hooks.useSkillsRatings.mockReturnValue({
    ratings: new Map(),
    loading: false,
    error: null,
    updateRating: jest.fn()
  });

  // Mock useNetsSessions
  hooks.useNetsSessions.mockReturnValue({
    sessions: [],
    loading: false,
    error: null,
    createSession: jest.fn()
  });

  // Mock useNetsStatistics
  hooks.useNetsStatistics.mockReturnValue({
    statistics: [],
    loading: false,
    error: null,
    updateStatistic: jest.fn()
  });

  render(<App />);
  expect(screen.getByText(/Loading data/i)).toBeInTheDocument();
});

test('displays error state when player fetch fails', () => {
  const mockError = new Error('Failed to fetch players');
  
  // Mock usePlayers to return error state
  hooks.usePlayers.mockReturnValue({
    players: [],
    loading: false,
    error: mockError,
    refetch: jest.fn()
  });

  // Mock useSkillsRatings
  hooks.useSkillsRatings.mockReturnValue({
    ratings: new Map(),
    loading: false,
    error: null,
    updateRating: jest.fn()
  });

  // Mock useNetsSessions
  hooks.useNetsSessions.mockReturnValue({
    sessions: [],
    loading: false,
    error: null,
    createSession: jest.fn()
  });

  // Mock useNetsStatistics
  hooks.useNetsStatistics.mockReturnValue({
    statistics: [],
    loading: false,
    error: null,
    updateStatistic: jest.fn()
  });

  render(<App />);
  expect(screen.getByText(/Error Loading Data/i)).toBeInTheDocument();
  expect(screen.getByText(/Failed to fetch players/i)).toBeInTheDocument();
  expect(screen.getByText(/Retry/i)).toBeInTheDocument();
});

test('displays players when loaded successfully', async () => {
  const mockPlayers = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' }
  ];

  // Mock usePlayers to return successful data
  hooks.usePlayers.mockReturnValue({
    players: mockPlayers,
    loading: false,
    error: null,
    refetch: jest.fn()
  });

  // Mock useSkillsRatings
  hooks.useSkillsRatings.mockReturnValue({
    ratings: new Map(),
    loading: false,
    error: null,
    updateRating: jest.fn()
  });

  // Mock useNetsSessions
  hooks.useNetsSessions.mockReturnValue({
    sessions: [],
    loading: false,
    error: null,
    createSession: jest.fn()
  });

  // Mock useNetsStatistics
  hooks.useNetsStatistics.mockReturnValue({
    statistics: [],
    loading: false,
    error: null,
    updateStatistic: jest.fn()
  });

  render(<App />);
  
  // Wait for players to be processed and displayed
  await waitFor(() => {
    expect(screen.getByText(/Select a Player \(2\)/i)).toBeInTheDocument();
  });
});
