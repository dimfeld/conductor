// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Shell from './Shell.svelte';
import { createRawSnippet } from 'svelte';

describe('Shell', () => {
  it('renders the header', () => {
    render(Shell, {
      props: {
        children: createRawSnippet(() => ({
          render: () => '<div>Test Content</div>',
        })),
      },
    });

    expect(screen.getByText('Conductor')).toBeDefined();
  });

  it('renders the sidebar on desktop', () => {
    render(Shell, {
      props: {
        children: createRawSnippet(() => ({
          render: () => '<div>Test Content</div>',
        })),
      },
    });

    expect(screen.getByText('Navigation')).toBeDefined();
  });

  it('renders the main content', () => {
    render(Shell, {
      props: {
        children: createRawSnippet(() => ({
          render: () => '<div>Test Content</div>',
        })),
      },
    });

    expect(screen.getByText('Test Content')).toBeDefined();
  });
});
