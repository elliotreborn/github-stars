import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders Source Code', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Source Code/i);
  expect(linkElement).toBeInTheDocument();
});
