import { useAllProducts } from '@/hooks/useAllProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overallStats } from '@/data/comprehensiveData';

export function Overview() {
  const { allProducts } = useAllProducts();

  const stats = [
    {
      title: 'إجمالي المنتجات',
      value: allProducts.length,
      description: `${allProducts.filter(p => !p.is_dynamic).length} ثابت + ${allProducts.filter(p => p.is_dynamic).length} ديناميكي`,
    },
    {
      title: 'إجمالي السيناريوهات',
      value: overallStats.totalScenarios.toLocaleString('ar-EG'),
      description: '144 سيناريو لكل منتج',
    },
    {
      title: 'معدل الربحية',
      value: `${overallStats.profitabilityRate.toFixed(1)}%`,
      description: `${overallStats.profitableScenarios.toLocaleString('ar-EG')} سيناريو رابح`,
    },
    {
      title: 'متوسط الربح',
      value: `${overallStats.medianProfit.toFixed(0)} ج.م`,
      description: 'الربح الوسيط لكل طلب',
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">نظرة عامة</h1>
        <p className="text-gray-600 mt-2">إحصائيات شاملة للمحاكي</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold">المنتجات الثابتة:</span> {allProducts.filter(p => !p.is_dynamic).length}
            </p>
            <p className="text-sm">
              <span className="font-semibold">المنتجات الديناميكية:</span> {allProducts.filter(p => p.is_dynamic).length}
            </p>
            <p className="text-sm">
              <span className="font-semibold">الإجمالي:</span> {allProducts.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
