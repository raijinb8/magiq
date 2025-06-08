import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from './utils';
import { Button } from '@/components/ui/button';

describe('React Testing Library & Jest-DOM Integration', () => {
  it('renders button component correctly', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    let clicked = false;

    render(
      <Button
        onClick={() => {
          clicked = true;
        }}
      >
        Click me
      </Button>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(clicked).toBe(true);
  });

  it('demonstrates custom matchers', () => {
    render(<div data-testid="empty-div"></div>);

    const emptyDiv = screen.getByTestId('empty-div');
    expect(emptyDiv).toBeEmptyDOMElement();
  });

  it('demonstrates accessibility testing', () => {
    render(
      <div>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" />
      </div>
    );

    const input = screen.getByLabelText(/username/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('demonstrates async testing with loading states', async () => {
    const LoadingComponent = () => (
      <div>
        <div data-testid="loading">Loading...</div>
      </div>
    );

    render(<LoadingComponent />);

    const loadingElement = screen.getByTestId('loading');
    expect(loadingElement).toBeInTheDocument();
  });
});
