import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import Sidebar from './Sidebar';
import Header from './Header';
import { Loader2, Leaf } from 'lucide-react';

interface LayoutProps {
  className?: string;
}

export default function Layout({ className }: LayoutProps) {
  const { loading, initialized, initData } = useAppStore();

  useEffect(() => {
    if (!initialized) {
      initData();
    }
  }, [initialized, initData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center">
              <Leaf className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-4 border-primary-700/30 animate-ping" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-primary-700 animate-spin" />
            <span className="text-gray-600 font-medium">正在加载系统数据...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-gray-50 font-sans',
        className
      )}
    >
      <div className="flex">
        <Sidebar />

        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <Header />

          <main className="flex-1 p-4 lg:p-6">
            <div className="mx-auto w-full max-w-[1600px]">
              <Outlet />
            </div>
          </main>

          <footer className="py-4 px-6 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
              <p>© 2024 碳资产管理系统 · Carbon Asset Management System</p>
              <p>版本 v1.0.0</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
