import { Link, useLocation } from 'wouter';
import { BarChart3, TrendingUp, Search, Trophy, LayoutDashboard } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'المحاكي', icon: LayoutDashboard },
  { href: '/overview', label: 'نظرة عامة', icon: BarChart3 },
  { href: '/ranking', label: 'ترتيب المنتجات', icon: Trophy },
  { href: '/analysis', label: 'تحليل المنتج', icon: TrendingUp },
  { href: '/advanced-filter', label: 'تصفية متقدمة', icon: Search },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1" dir="rtl">
              <Link href="/dashboard" className="font-bold text-lg text-blue-600 ml-6 whitespace-nowrap">
                محاكي الحملات
              </Link>
              {navItems.map(item => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
