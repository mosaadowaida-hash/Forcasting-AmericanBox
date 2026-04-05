import { Link, useLocation } from 'wouter';
import { BarChart3, TrendingUp, Search, Trophy, LayoutDashboard, LogOut, Shield, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/dashboard', label: 'المحاكي', icon: LayoutDashboard },
  { href: '/overview', label: 'نظرة عامة', icon: BarChart3 },
  { href: '/ranking', label: 'ترتيب المنتجات', icon: Trophy },
  { href: '/analysis', label: 'تحليل المنتج', icon: TrendingUp },
  { href: '/advanced-filter', label: 'تصفية متقدمة', icon: Search },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery(undefined, { retry: false });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => setLocation('/login'),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo + Nav Links */}
            <div className="flex items-center gap-1" dir="rtl">
              <Link href="/dashboard" className="font-bold text-lg text-blue-600 ml-6 whitespace-nowrap">
                Ads Forecasting Pro
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

            {/* Right: User Menu */}
            {user && (
              <div className="flex items-center gap-2">
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs">لوحة الأدمن</span>
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-gray-700 hover:bg-gray-100">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm max-w-[120px] truncate">{user.name || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{user.name || 'مستخدم'}</p>
                        <p className="text-xs text-gray-500 truncate" dir="ltr">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => setLocation('/admin')} className="cursor-pointer">
                        <Shield className="w-4 h-4 ml-2 text-blue-500" />
                        لوحة الأدمن
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
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
