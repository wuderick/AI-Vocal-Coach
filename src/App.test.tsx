import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the initialized home page', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /project initialized successfully/i })).toBeInTheDocument();
    expect(screen.getByText(/ai vocal coach/i)).toBeInTheDocument();
  });
});
