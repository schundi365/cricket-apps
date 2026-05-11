import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /data scientist cv generator/i });
    expect(heading).toBeInTheDocument();
  });

  test('displays the welcome message', () => {
    render(<App />);
    const welcomeText = screen.getByText(/welcome to the data scientist cv generator/i);
    expect(welcomeText).toBeInTheDocument();
  });

  test('shows the features list', () => {
    render(<App />);
    const featuresHeading = screen.getByRole('heading', { name: /features/i });
    expect(featuresHeading).toBeInTheDocument();
    
    // Check for some key features
    expect(screen.getByText(/professional templates/i)).toBeInTheDocument();
    expect(screen.getByText(/ats-friendly formatting/i)).toBeInTheDocument();
    expect(screen.getByText(/export to pdf and word/i)).toBeInTheDocument();
  });

  test('displays getting started section', () => {
    render(<App />);
    const gettingStartedHeading = screen.getByRole('heading', { name: /getting started/i });
    expect(gettingStartedHeading).toBeInTheDocument();
  });
});