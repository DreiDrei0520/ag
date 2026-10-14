import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { useSettings } from '../hooks/useData';

export function Logo({ dark = false, size = 'md' }: { dark?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const heights = { sm: 'h-10', md: 'h-14', lg: 'h-16' };
  return (
    <img
      src={dark ? '/logo-white.png' : '/logo.png'}
      alt="AG Construction Builders"
      className={cn('w-auto shrink-0', heights[size])}
    />
  );
}

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/projects', label: 'Projects' },
  { to: '/quotation', label: 'Smart Quotation' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/faq', label: 'FAQs' },
  { to: '/contact', label: 'Contact' },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-agdark-100 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-7">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-semibold transition-colors hover:text-agorange',
                      isActive ? 'text-agorange' : 'text-agdark-600'
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            {user ? (
              <Link to="/admin/dashboard" className="btn-primary">
                Admin Dashboard
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-agdark-700 hover:text-agorange">
                Admin Login
              </Link>
            )}
          </div>

          <button
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-md border border-agdark-200 text-agdark-700 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>

        {open ? (
          <div className="border-t border-agdark-100 bg-white px-4 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn('rounded-lg px-3 py-2 text-sm font-semibold', isActive ? 'bg-agorange-50 text-agorange' : 'text-agdark-700')
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2 border-t border-agdark-100 pt-3">
                {user ? (
                  <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="btn-primary flex-1">
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                    Admin Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1" key={location.pathname}>
        <Outlet />
      </main>

      <footer className="bg-agdark-800 text-agdark-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Logo dark />
              <p className="mt-4 max-w-sm text-sm leading-6 text-agdark-300">
                {settings?.companyDescription ?? 'A full-service design and construction company serving CALABARZON and NCR.'}
              </p>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold uppercase tracking-widest text-white">Quick links</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link to="/services" className="hover:text-agorange">Services</Link></li>
                <li><Link to="/projects" className="hover:text-agorange">Projects</Link></li>
                <li><Link to="/quotation" className="hover:text-agorange">Smart Quotation</Link></li>
                <li><Link to="/faq" className="hover:text-agorange">FAQs & Requirements</Link></li>
                <li><Link to="/contact" className="hover:text-agorange">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold uppercase tracking-widest text-white">Contact</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>{settings?.address ?? 'Main Office: 11912 Villanueva St., Brgy. Mayondon, Los Baños, Laguna'}</li>
                <li>{settings?.email ?? 'agconbuilder@gmail.com'}</li>
                <li>{settings?.phone ?? '0927-837-2757'}</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-agdark-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {settings?.companyName ?? 'AG Construction Builders'}. All rights reserved.</p>
            <p>{settings?.businessHours}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
