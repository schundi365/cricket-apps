/**
 * Integration tests for App.js with AdminPanel
 * 
 * Tests the integration of AdminPanel component into the main App
 * Requirements: 8.1
 */

import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Integration with AdminPanel', () => {
  test('should render admin button in header', () => {
    render(<App />);
    
    // Find the admin button by its title attribute
    const adminButton = screen.getByTitle('Admin Panel');
    expect(adminButton).toBeInTheDocument();
  });

  test('should toggle to admin view when admin button is clicked', () => {
    render(<App />);
    
    // Click the admin button
    const adminButton = screen.getByTitle('Admin Panel');
    fireEvent.click(adminButton);
    
    // Check if AdminPanel is rendered
    const adminPanelTitle = screen.getByText('Admin Panel');
    expect(adminPanelTitle).toBeInTheDocument();
  });

  test('should show player list view by default', () => {
    render(<App />);
    
    // Should show "Select a Player" text in list view
    const selectPlayerText = screen.getByText(/Select a Player/i);
    expect(selectPlayerText).toBeInTheDocument();
  });

  test('should toggle between list, leaderboard, and admin views', () => {
    render(<App />);
    
    // Get all view buttons
    const buttons = screen.getAllByRole('button');
    const listButton = buttons[0]; // Users icon
    const leaderboardButton = buttons[1]; // Award icon
    const adminButton = buttons[2]; // Settings icon
    
    // Start in list view
    expect(screen.getByText(/Select a Player/i)).toBeInTheDocument();
    
    // Switch to leaderboard
    fireEvent.click(leaderboardButton);
    expect(screen.getByText(/Top Performers/i)).toBeInTheDocument();
    
    // Switch to admin
    fireEvent.click(adminButton);
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    
    // Switch back to list
    fireEvent.click(listButton);
    expect(screen.getByText(/Select a Player/i)).toBeInTheDocument();
  });

  test('should maintain existing functionality with admin panel added', () => {
    render(<App />);
    
    // Verify all existing buttons are still present
    expect(screen.getByTitle('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText(/Add Player/i)).toBeInTheDocument();
    expect(screen.getByText(/Export/i)).toBeInTheDocument();
    
    // Verify search functionality is present
    const searchInput = screen.getByPlaceholderText(/Search players/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('admin button should have correct styling when active', () => {
    render(<App />);
    
    const adminButton = screen.getByTitle('Admin Panel');
    
    // Initially should have gray background (not active)
    expect(adminButton.className).toContain('bg-gray-200');
    
    // Click to activate
    fireEvent.click(adminButton);
    
    // Should now have green background (active)
    expect(adminButton.className).toContain('bg-green-600');
    expect(adminButton.className).toContain('text-white');
  });
});
