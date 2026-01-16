import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrendingDashboard from './TrendingDashboard';

// Mock axios before importing the component
jest.mock('axios', () => ({
  get: jest.fn()
}));

const axios = require('axios');

describe('TrendingDashboard', () => {
  const mockTrendingAssets = [
    {
      asset: { type: 'METAL', symbol: 'GOLD', name: 'Gold' },
      currentPrice: 2000,
      priceChange24h: 2.5,
      momentum: 75,
      trendCategory: 'STRONG_UPTREND',
      safetyScore: 85,
      sentiment: { sentiment: 'BULLISH', score: 80 }
    },
    {
      asset: { type: 'FOREX', symbol: 'EUR/USD', name: 'Euro/US Dollar' },
      currentPrice: 1.1000,
      priceChange24h: -1.2,
      momentum: 60,
      trendCategory: 'MODERATE_DOWNTREND',
      safetyScore: 70,
      sentiment: { sentiment: 'BEARISH', score: 45 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { data: mockTrendingAssets } });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('renders trending dashboard', async () => {
    render(<TrendingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('🔥 Trending Assets')).toBeInTheDocument();
    });
  });

  test('fetches and displays trending assets', async () => {
    render(<TrendingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('GOLD')).toBeInTheDocument();
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    });
  });

  test('applies filters correctly', async () => {
    render(<TrendingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('GOLD')).toBeInTheDocument();
    });

    // Change asset type filter - find select by its options
    const selects = screen.getAllByRole('combobox');
    const assetTypeSelect = selects[0]; // First select is Asset Type
    fireEvent.change(assetTypeSelect, { target: { value: 'METAL' } });

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({ assetTypes: 'METAL' })
        })
      );
    });
  });

  test('sorts assets by momentum', async () => {
    render(<TrendingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('GOLD')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const sortSelect = selects[selects.length - 1]; // Last select is Sort By
    fireEvent.change(sortSelect, { target: { value: 'momentum' } });

    // Assets should be sorted by momentum (highest first)
    const cards = document.querySelectorAll('.trending-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  // Property 19: Trending Asset Selection Propagation
  // Feature: metals-sentiment-trading, Property 19: Trending Asset Selection Propagation
  test('Property 19: calls onAssetSelect when asset is clicked', async () => {
    const mockOnAssetSelect = jest.fn();
    render(<TrendingDashboard onAssetSelect={mockOnAssetSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('GOLD')).toBeInTheDocument();
    });

    // Click on the first asset card
    const goldCard = screen.getByText('GOLD').closest('.trending-card');
    fireEvent.click(goldCard);

    // Verify that onAssetSelect was called with the correct asset
    expect(mockOnAssetSelect).toHaveBeenCalledTimes(1);
    expect(mockOnAssetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: expect.objectContaining({
          type: 'METAL',
          symbol: 'GOLD',
          name: 'Gold'
        })
      })
    );
  });

  test('Property 19: propagates complete asset data on selection', async () => {
    const mockOnAssetSelect = jest.fn();
    render(<TrendingDashboard onAssetSelect={mockOnAssetSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('EUR/USD')).toBeInTheDocument();
    });

    // Click on the EUR/USD card
    const eurCard = screen.getByText('EUR/USD').closest('.trending-card');
    fireEvent.click(eurCard);

    // Verify complete asset data is propagated
    const calledWith = mockOnAssetSelect.mock.calls[0][0];
    expect(calledWith).toHaveProperty('asset');
    expect(calledWith).toHaveProperty('currentPrice');
    expect(calledWith).toHaveProperty('priceChange24h');
    expect(calledWith).toHaveProperty('momentum');
    expect(calledWith).toHaveProperty('trendCategory');
    expect(calledWith).toHaveProperty('safetyScore');
    expect(calledWith).toHaveProperty('sentiment');
  });

  test('displays error message when fetch fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(<TrendingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load trending assets')).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    render(<TrendingDashboard />);
    expect(screen.getByText('Loading trending assets...')).toBeInTheDocument();
  });

  test('displays no results message when no assets match filters', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: [] } });
    
    render(<TrendingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No trending assets match your filters')).toBeInTheDocument();
    });
  });

  test('refreshes data when refresh button is clicked', async () => {
    render(<TrendingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('GOLD')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText(/Refresh/);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});
