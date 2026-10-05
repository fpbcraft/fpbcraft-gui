import Link from 'next/link';
import type {ReactNode} from 'react';

const nav = [
  {href: '/', label: 'Overview'},
  {href: '/mods', label: 'Mods'},
  {href: '/sources', label: 'Sources'},
  {href: '/health', label: 'Health'},
];

export function Shell({children}: {children: ReactNode}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FP</div>
          <div>
            <strong>FPBCraft</strong>
            <span>Server control</span>
          </div>
        </div>

        <nav className="nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="dot dot-good" />
          <div>
            <strong>Read-only mode</strong>
            <span>Filesystem mounted :ro</span>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
