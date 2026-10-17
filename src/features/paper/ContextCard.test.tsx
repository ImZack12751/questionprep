// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ContextCard, ContextCards } from './ContextCard';
import type { PlacedContext } from './contexts';

const context = {
  id: 'srcB',
  label: 'Source B',
  title: 'Population data',
  text: '| Year | Population |\n|---|---:|\n| 2000 | 1.2 |\n| 2020 | 2.1 |\n\nChange: $\\dfrac{2.1 - 1.2}{1.2} \\times 100$',
};
const placed = (over: Partial<PlacedContext> = {}): PlacedContext => ({
  context,
  domId: 'ctx-4-srcB',
  firstInRun: true,
  runStartNumber: 4,
  ...over,
});

afterEach(cleanup);

describe('ContextCard', () => {
  it('renders a labelled region with heading, title, table and maths', () => {
    const { container } = render(<ContextCard placed={placed()} />);
    const region = screen.getByRole('region', { name: 'Source B' });
    expect(region.id).toBe('ctx-4-srcB');
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('Source B');
    expect(screen.getByText('Population data')).toBeTruthy();
    const table = container.querySelector('.table-wrap table')!;
    expect(table).toBeTruthy();
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toEqual(['Year', 'Population']);
    expect(table.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(container.querySelector('.katex')).toBeTruthy();
    expect(container.querySelector('annotation')?.textContent).toContain('\\dfrac{2.1 - 1.2}{1.2}');
  });

  it('is expanded at the start of a run and collapsed (but one click away) later', () => {
    render(<ContextCard placed={placed({ firstInRun: false, runStartNumber: 1 })} />);
    const toggle = screen.getByRole('button');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('region').className).toContain('is-collapsed');
    expect(toggle.textContent).toContain('also used by question 1');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('region').className).toContain('is-open');
  });

  it('sanitises context text like question text', () => {
    const { container } = render(<ContextCard placed={placed({ context: { ...context, text: 'Safe <img src=x onerror="alert(1)"><script>bad()</script>' } })} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
  });

  it('shows several contexts in the listed order', () => {
    render(
      <ContextCards
        items={[placed({ domId: 'a', context: { ...context, id: 'srcA', label: 'Source A' } }), placed({ domId: 'b' })]}
      />,
    );
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-labelledby'))).toEqual(['a-label', 'b-label']);
  });
});
