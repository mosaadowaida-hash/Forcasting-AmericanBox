import { useAllProducts } from '@/hooks/useAllProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productRanking } from '@/data/comprehensiveData';
import { useMemo } from 'react';

export function Ranking() {
  const { allProducts, getProductStats } = useAllProducts();

  const rankedProducts = useMemo(() => {
    return allProducts
      .map((product, index) => {
        const stats = getProductStats(product.id);
        const rankData = productRanking.find(r => r.item_name === product.name);

        return {
          rank: index + 1,
          product,
          stats,
          rankData,
        };
      })
      .sort((a, b) => {
        const aRate = a.stats?.profitabilityRate || 0;
        const bRate = b.stats?.profitabilityRate || 0;
        return bRate - aRate;
      });
  }, [allProducts, getProductStats]);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">ترتيب المنتجات</h1>
        <p className="text-gray-600 mt-2">المنتجات مرتبة حسب معدل الربحية</p>
      </div>

      <div className="space-y-4">
        {rankedProducts.map((item, idx) => (
          <Card key={item.product.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">#{idx + 1}</div>
                  <div className="text-sm text-gray-600">{item.product.name}</div>
                  <div className="text-xs text-gray-500">
                    {item.product.is_dynamic ? '(ديناميكي)' : '(ثابت)'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">معدل الربحية</div>
                  <div className="text-xl font-bold text-green-600">
                    {item.stats?.profitabilityRate.toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">السيناريوهات الرابحة</div>
                  <div className="text-lg font-semibold">
                    {item.stats?.profitableScenarios} / {item.stats?.totalScenarios}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">متوسط الربح</div>
                  <div className="text-lg font-semibold text-green-600">
                    {item.stats?.medianProfit.toFixed(0)} ج.م
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">متوسط ROAS</div>
                  <div className="text-lg font-semibold">
                    {item.stats?.medianRoas.toFixed(2)}x
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
