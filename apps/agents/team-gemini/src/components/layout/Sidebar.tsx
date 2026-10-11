import { NavLink, useLocation } from 'react-router-dom';
import {
  MessageSquare, FolderOpen, GitBranch, Plug, Settings,
  Shield, LayoutDashboard, ChevronLeft, ChevronRight, Cpu,
  LogOut, User, Code2, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/code-review', icon: Code2, label: 'Code Review' },
  { to: '/automation', icon: Zap, label: 'Automation' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/github', icon: GitBranch, label: 'GitHub' },
  { to: '/integrations', icon: Plug, label: 'Integrations' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-surface-800/80 border-r border-surface-500/30 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-surface-500/30', collapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center glow-blue">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white tracking-tight">TeamGemini</div>
            <div className="text-xs text-gray-500">AI Workspace</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {!collapsed && <div className="section-title">Workspace</div>}
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={cn(
              'nav-item',
              isActive(to, exact) ? 'nav-item-active' : 'nav-item-inactive',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            {!collapsed && <div className="section-title mt-4">Admin</div>}
            <NavLink
              to="/admin"
              className={cn(
                'nav-item',
                isActive('/admin') ? 'nav-item-active' : 'nav-item-inactive',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? 'Admin' : undefined}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Admin Panel</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-surface-500/30 p-2 space-y-1">
        <NavLink
          to="/settings"
          className={cn(
            'nav-item',
            isActive('/settings') ? 'nav-item-active' : 'nav-item-inactive',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {!collapsed ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-200 truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 truncate">{user?.role}</div>
            </div>
            <button onClick={logout} className="btn-ghost p-1 rounded" title="Log out">
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="nav-item nav-item-inactive justify-center px-0 w-full"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-surface-600 border border-surface-400/50 flex items-center justify-center hover:bg-surface-500 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-400" /> : <ChevronLeft className="w-3 h-3 text-gray-400" />}
      </button>
    </aside>
  );
}
