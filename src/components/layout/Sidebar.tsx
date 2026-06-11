import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  TreePine,
  BarChart3,
  Menu,
  X,
  Leaf,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  className?: string;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: '总览',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    path: '/assets',
    label: '资产台账',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    path: '/transactions',
    label: '交易记录',
    icon: <ArrowLeftRight className="h-5 w-5" />,
  },
  {
    path: '/projects',
    label: '减排项目',
    icon: <TreePine className="h-5 w-5" />,
  },
  {
    path: '/reports',
    label: '报表中心',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

export default function Sidebar({ className }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-md',
          'transition-all duration-200 hover:bg-gray-100'
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </button>

      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-700">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">碳资产管理系统</h1>
              <p className="text-xs text-gray-500">Carbon Asset Management</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                    'transition-all duration-200',
                    isActive(item.path)
                      ? 'bg-primary-700 text-white shadow-md shadow-primary-700/30'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <span className={cn(
                    'transition-all duration-200',
                    isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive(item.path) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100">
              <p className="text-sm font-medium text-primary-800">需要帮助？</p>
              <p className="text-xs text-primary-600 mt-1">查看使用文档或联系管理员</p>
              <button
                type="button"
                className="mt-3 w-full px-3 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 transition-all duration-200"
              >
                查看文档
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
