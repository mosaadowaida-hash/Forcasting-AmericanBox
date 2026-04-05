import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useMemo } from 'react';
import { BarChart3, TrendingUp, DollarSign, Target, Package } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

export function Overview() {
  const { data: overviewStats, isLoading: statsLoading } = trpc.products.getOverviewStats.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: allScenarios = [], isLoading: scenariosLoading } = trpc.products.getAllScenarios.useQuery();

  const productTypes = useMemo(() => {
    const prods = products.filter(p => p.type === 'product').length;
    const bundles = products.filter(p => p.type === 'bundle').length;
    return [
      { name: 'منتجات', value: prods, fill: '#3b82f6' },
      { name: 'باندلز', value: bundles, fill: '#f59e0b' },
    ];
  }, [products]);

  const profitByCPM = useMemo(() => {
    if (allScenarios.length === 0) return [];
    const groups = new Map<string, number[]>();
    allScenarios.forEach(s => {
      if (!groups.has(s.cpmLabel)) groups.set(s.cpmLabel, []);
      groups.get(s.cpmLabel)!.push(s.netProfitPerOrder);
    });
    return Array.from(groups.entries()).map(([label, profits]) => ({
      name: label,
      avgProfit: Math.round(profits.reduce((a, b) => a + b, 0) / profits.length),
      profitable: profits.filter(p => p > 0).length,
      total: profits.length,
    }));
  }, [allScenarios]);

  const profitDistribution = useMemo(() => {
    if (!overviewStats) return [];
    return [
      { name: 'سيناريوهات رابحة', value: overviewStats.profitableScenarios, fill: '#22c55e' },
      { name: 'سيناريوهات خاسرة', value: overviewStats.totalScenarios - overviewStats.profitableScenarios, fill: '#ef4444' },
    ];
  }, [overviewStats]);

  if (statsLoading || scenariosLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" dir="rtl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">نظرة عامة على المحاكي</h1>
        <p className="text-gray-600 mt-2">إحصائيات شاملة لجميع المنتجات والسيناريوهات</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-600">إجمالي المنتجات</CardTitle>
            <Package className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{overviewStats?.totalProducts ?? 0}</div>
            <p className="text-xs text-gray-500">
              {products.filter(p => p.type === 'product').length} منتج + {products.filter(p => p.type === 'bundle').length} باندل
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-600">إجمالي السيناريوهات</CardTitle>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{overviewStats?.totalScenarios?.toLocaleString('ar-EG') ?? 0}</div>
            <p className="text-xs text-gray-500">144 سيناريو لكل منتج</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-600">معدل الربحية</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{overviewStats?.profitabilityRate?.toFixed(1) ?? 0}%</div>
            <p className="text-xs text-gray-500">{overviewStats?.profitableScenarios?.toLocaleString('ar-EG') ?? 0} سيناريو رابح</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-gray-600">متوسط ROAS</CardTitle>
            <DollarSign className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{overviewStats?.avgRoas?.toFixed(2) ?? 0}x</div>
            <p className="text-xs text-gray-500">الربح الوسيط: {overviewStats?.medianProfit ?? 0} ج.م</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">توزيع الربح والخسارة (جميع السيناريوهات)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={profitDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value.toLocaleString('ar-EG')}`}>
                  {profitDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">توزيع المنتجات والباندلز</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={productTypes} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {productTypes.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Profit by CPM */}
      <Card>
        <CardHeader><CardTitle className="text-sm">متوسط الربح حسب تكلفة CPM (جميع المنتجات)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitByCPM}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgProfit" fill="#3b82f6" name="متوسط الربح (ج.م)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* All Products Table */}
      <Card>
        <CardHeader><CardTitle>جميع المنتجات ({products.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-right py-3 px-3">#</th>
                  <th className="text-right py-3 px-3">الاسم</th>
                  <th className="text-right py-3 px-3">النوع</th>
                  <th className="text-right py-3 px-3">السعر</th>
                  <th className="text-right py-3 px-3">الخصومات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{p.name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs ${p.type === 'product' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.type === 'product' ? 'منتج' : 'باندل'}
                      </span>
                    </td>
                    <td className="py-2 px-3">{p.originalPrice} ج.م</td>
                    <td className="py-2 px-3 text-xs text-gray-500">
                      {p.type === 'product'
                        ? `قطعتين: ${p.discountTwoItems ?? 10}% | ثلاث: ${p.discountThreeItems ?? 15}%`
                        : `باندل: ${p.bundleDiscount ?? 0}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
