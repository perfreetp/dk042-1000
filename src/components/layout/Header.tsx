import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Bell, ChevronRight, User, Settings, LogOut } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface HeaderProps {
  className?: string;
}

const pageTitles: Record<string, string> = {
  '/': '总览',
  '/assets': '资产台账',
  '/transactions': '交易记录',
  '/projects': '减排项目',
  '/reports': '报表中心',
};

const userInfo = {
  name: '张建国',
  role: '碳资产管理专员',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carbon',
  notifications: 3,
};

export default function Header({ className }: HeaderProps) {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = (): string => {
    const path = location.pathname;
    for (const [key, title] of Object.entries(pageTitles)) {
      if (key === '/' ? path === '/' : path.startsWith(key)) {
        return title;
      }
    }
    return '碳资产管理系统';
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const crumbs: BreadcrumbItem[] = [{ label: '首页', path: '/' }];

    if (path === '/') {
      return crumbs;
    }

    for (const [key, title] of Object.entries(pageTitles)) {
      if (key !== '/' && path.startsWith(key)) {
        crumbs.push({ label: title, path: key });
        break;
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = getPageTitle();

  return (
    <header
      className={cn(
        'h-16 bg-white border-b border-gray-200 sticky top-0 z-30',
        'transition-all duration-200',
        className
      )}
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="lg:hidden w-10" />

          <div>
            <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 mb-0.5">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                  {crumb.path ? (
                    <Link
                      to={crumb.path}
                      className="hover:text-primary-700 transition-colors duration-200"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-400">{crumb.label}</span>
                  )}
                </div>
              ))}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{pageTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className={cn(
                'p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                'transition-all duration-200 relative'
              )}
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
            >
              <Bell className="h-5 w-5" />
              {userInfo.notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {userInfo.notifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-slide-down">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">通知中心</h3>
                  <p className="text-sm text-gray-500 mt-0.5">您有 {userInfo.notifications} 条未读通知</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {[
                    { id: 1, title: '资产即将到期', content: '2024年度碳排放配额将在30天后到期', time: '10分钟前', unread: true },
                    { id: 2, title: '履约提醒', content: '请在本月底前完成2024年度履约', time: '1小时前', unread: true },
                    { id: 3, title: '项目审核通过', content: '余热回收减排项目已审核通过', time: '昨天', unread: true },
                  ].map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer',
                        notification.unread && 'bg-primary-50/30'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            {notification.unread && <div className="w-2 h-2 rounded-full bg-primary-700" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{notification.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button
                    type="button"
                    className="w-full text-sm text-primary-700 hover:text-primary-800 font-medium transition-colors duration-200"
                  >
                    查看全部通知
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100',
                'transition-all duration-200'
              )}
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
            >
              <div className="relative">
                <img
                  src={userInfo.avatar}
                  alt={userInfo.name}
                  className="w-8 h-8 rounded-full bg-primary-100"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                <p className="text-xs text-gray-500">{userInfo.role}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-slide-down">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      className="w-12 h-12 rounded-full bg-primary-100"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{userInfo.name}</p>
                      <p className="text-sm text-gray-500">{userInfo.role}</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <User className="h-4 w-4" />
                    <span>个人中心</span>
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Settings className="h-4 w-4" />
                    <span>系统设置</span>
                  </button>
                </div>
                <div className="border-t border-gray-200 py-1">
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
}
