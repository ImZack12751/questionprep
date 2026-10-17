import type { ReactNode } from 'react';
import { href } from '../lib/router';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

/** Top bar, page container and footer shared by every screen except the exam. */
export function AppShell({ children, section = 'library' }: { children: ReactNode; section?: 'library' }) {
  return (
    <div className="app">
      <header className="app-bar no-print">
        <div className="app-bar-inner">
          <BrandMark />
          <nav className="app-nav" aria-label="Main">
            <a href={href({ name: 'home' })} aria-current={section === 'library' ? 'page' : undefined}>
              Library
            </a>
          </nav>
          <div className="app-bar-actions">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer no-print">
        <div className="app-footer-inner">
          <span>Questionprep</span>
          <span>Papers and attempts are stored only in this browser.</span>
        </div>
      </footer>
    </div>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, eyebrow, description, actions, crumbs }: PageHeaderProps) {
  return (
    <div className="page-header no-print">
      {crumbs && (
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            {crumbs.map((c, i) => (
              <li key={i}>{c.href ? <a href={c.href}>{c.label}</a> : <span aria-current="page">{c.label}</span>}</li>
            ))}
          </ol>
        </nav>
      )}
      <div className="page-header-row">
        <div className="page-header-text">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}
