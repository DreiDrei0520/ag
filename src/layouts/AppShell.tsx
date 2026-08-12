import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  PieChart,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/shared/NotificationBell';
import { Logo } from './PublicLayout';
import { Avatar } from '../components/ui';
import { cn } from '../lib/cn';
import { auth } from '../backend';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

function SidebarNav({ groups }: { groups: NavGroup[] }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.title ? (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-agdark-400">{group.title}</p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to.split('/').filter(Boolean).length === 2}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-agorange text-white shadow-sm'
                        : 'text-agdark-300 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  groups,
  accentLabel,
  title,
}: {
  groups: NavGroup[];
  accentLabel: string;
  title: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleLogout() {
    await auth.logout();
    toast.success('Logged out');
    navigate('/');
  }

  if (!user) return null;

  const sidebar = (
    <div className="flex h-full flex-col bg-agdark-800">
      <div className="flex items-center justify-between px-4 py-5">
        <NavLink to={user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}>
          <Logo dark />
        </NavLink>
        <button className="text-agdark-300 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>
      <SidebarNav groups={groups} />
      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-agdark-300 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-agdark-50/60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-agdark-900/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-agdark-100 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-agorange">{accentLabel}</p>
              <p className="font-display text-base font-bold uppercase tracking-wide text-agdark-800">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell user={user} />
            <div className="relative">
              <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-agdark-100" aria-label="Account menu">
                <Avatar name={user.fullName} size={34} />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-agdark-100 bg-white shadow-2xl">
                  <div className="border-b border-agdark-100 px-4 py-3">
                    <p className="text-sm font-semibold text-agdark-800">{user.fullName}</p>
                    <p className="truncate text-xs text-agdark-400">{user.email}</p>
                  </div>
                  <NavLink to={user.role === 'admin' ? '/admin/profile' : '/client/profile'} onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-agdark-700 hover:bg-agdark-50">
                    Profile settings
                  </NavLink>
                  <button onClick={handleLogout} className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ---------- Client layout ----------

const clientGroups: NavGroup[] = [
  {
    items: [{ to: '/client/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }],
  },
  {
    title: 'Explore',
    items: [
      { to: '/client/services', label: 'Services', icon: <Wrench size={16} /> },
      { to: '/client/projects', label: 'Projects', icon: <Building2 size={16} /> },
    ],
  },
  {
    title: 'Your projects',
    items: [
      { to: '/client/quotations', label: 'Quotations', icon: <ReceiptText size={16} /> },
      { to: '/client/inquiries', label: 'Inquiries', icon: <MessageSquareText size={16} /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/client/notifications', label: 'Notifications', icon: <Bell size={16} /> },
      { to: '/client/profile', label: 'Profile', icon: <Settings size={16} /> },
    ],
  },
];

export function ClientLayout() {
  return <AppShell groups={clientGroups} accentLabel="Client portal" title="My Account" />;
}

// ---------- Admin layout ----------

const adminGroups: NavGroup[] = [
  {
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }],
  },
  {
    title: 'Content',
    items: [
      { to: '/admin/services', label: 'Services', icon: <Wrench size={16} /> },
      { to: '/admin/categories', label: 'Categories', icon: <Tags size={16} /> },
      { to: '/admin/projects', label: 'Projects', icon: <Building2 size={16} /> },
      { to: '/admin/announcements', label: 'Announcements', icon: <ScrollText size={16} /> },
    ],
  },
  {
    title: 'Quotation',
    items: [
      { to: '/admin/pricing', label: 'Pricing Rules', icon: <Package size={16} /> },
      { to: '/admin/additional-services', label: 'Additional Services', icon: <ClipboardList size={16} /> },
      { to: '/admin/quotations', label: 'Quotations', icon: <ReceiptText size={16} /> },
    ],
  },
  {
    title: 'Client management',
    items: [
      { to: '/admin/users', label: 'Clients & Users', icon: <Users size={16} /> },
      { to: '/admin/inquiries', label: 'Inquiries', icon: <MessageSquareText size={16} /> },
    ],
  },
  {
    title: 'Analytics & system',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: <PieChart size={16} /> },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: <FileText size={16} /> },
      { to: '/admin/notifications', label: 'Notifications', icon: <Bell size={16} /> },
      { to: '/admin/settings', label: 'System Settings', icon: <Settings size={16} /> },
      { to: '/admin/profile', label: 'Admin Profile', icon: <ShieldCheck size={16} /> },
    ],
  },
];

export function AdminLayout() {
  return <AppShell groups={adminGroups} accentLabel="Admin portal" title="Operations" />;
}
