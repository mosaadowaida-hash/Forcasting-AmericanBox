import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

type SortBy = 'profitabilityRate' | 'medianProfit' | 'medianRoas';

export function Ranking() {
  const { data: ranking = [], isLoading } = trpc.products.getRanking.useQuery();
  const [sortBy, setSortBy] = useState<SortBy>('profitabilityRate');

  const sortedRanking = useMemo(() => {
    return [...ranking].sort((a, b) => {
      if (sortBy === 'profitabilityRate') return b.profitabilityRate - a.profitabilityRate;
      if (sortBy === 'medianProfit') return b.medianProfit - a.medianProfit;
      return b.medianRoas - a.medianRoas;
    });
  }, [ranking, sortBy]);

  if (isLoading) {
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">ترتيب المنتجات</h1>
          <p className="text-gray-600 mt-2">{ranking.length} منتج مرتب حسب الأداء</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:inline">ترتيب حسب:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-40 sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="profitabilityRate">معدل الربحية</SelectItem>
              <SelectItem value="medianProfit">متوسط الربح</SelectItem>
              <SelectItem value="medianRoas">متوسط ROAS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {sortedRanking.map((item, idx) => (
          <Card key={item.product.id} className={`hover:shadow-lg transition-shadow ${idx < 3 ? 'border-l-4' : ''} ${idx === 0 ? 'border-l-yellow-500' : idx === 1 ? 'border-l-gray-400' : idx === 2 ? 'border-l-amber-700' : ''}`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-blue-600'}`}>
                    {idx < 3 ? <Trophy className="w-6 h-6 inline" /> : null} #{idx + 1}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="font-semibold">{item.product.name}</div>
                  <div className="text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded ${item.product.type === 'product' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.product.type === 'product' ? 'منتج' : 'باندل'}
                    </span>
                    <span className="mr-2">{item.product.originalPrice} ج.م</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                    <TrendingUp className="w-3 h-3" /> معدل الربحية
                  </div>
                  <div className={`text-xl font-bold ${item.profitabilityRate > 50 ? 'text-green-600' : item.profitabilityRate > 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {item.profitabilityRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">{item.profitableScenarios}/{item.totalScenarios}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                    <DollarSign className="w-3 h-3" /> متوسط الربح
                  </div>
                  <div className={`text-xl font-bold ${item.medianProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.medianProfit.toFixed(0)} ج.م
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                    <BarChart3 className="w-3 h-3" /> متوسط ROAS
                  </div>
                  <div className="text-xl font-bold text-purple-600">
                    {item.medianRoas.toFixed(2)}x
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
