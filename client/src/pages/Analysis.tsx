import { useState, useMemo } from 'react';
import { useAllProducts } from '@/hooks/useAllProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Analysis() {
  const { allProducts, getProductScenarios, getProductStats } = useAllProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>(
    allProducts[0]?.id || ''
  );

  const selectedProduct = allProducts.find(p => p.id === selectedProductId);
  const scenarios = useMemo(
    () => getProductScenarios(selectedProductId),
    [selectedProductId, getProductScenarios]
  );
  const stats = useMemo(
    () => getProductStats(selectedProductId),
    [selectedProductId, getProductStats]
  );

  const topScenarios = useMemo(
    () => [...scenarios].sort((a, b) => b.net_profit_per_order - a.net_profit_per_order).slice(0, 5),
    [scenarios]
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">تحليل المنتج</h1>
        <p className="text-gray-600 mt-2">تحليل تفصيلي لسيناريوهات المنتج</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اختر المنتج</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allProducts.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} {product.is_dynamic ? '(ديناميكي)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProduct && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">معدل الربحية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.profitabilityRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">السيناريوهات الرابحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.profitableScenarios} / {stats.totalScenarios}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">متوسط الربح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.medianProfit.toFixed(0)} ج.م
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">متوسط ROAS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.medianRoas.toFixed(2)}x
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>أفضل 5 سيناريوهات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topScenarios.map((scenario, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-semibold">
                        {scenario.cpm_label} • {scenario.ctr_label} • {scenario.cvr_label} • {scenario.basket_label}
                      </div>
                      <div className="text-sm text-gray-600">
                        العائد: {scenario.revenue_per_order.toFixed(0)} ج.م | الربح: {scenario.net_profit_per_order.toFixed(0)} ج.م
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{scenario.roas.toFixed(2)}x</div>
                      <div className="text-xs text-gray-600">ROAS</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>جميع السيناريوهات ({scenarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-right py-2">CPM</th>
                      <th className="text-right py-2">CTR</th>
                      <th className="text-right py-2">CVR</th>
                      <th className="text-right py-2">Basket</th>
                      <th className="text-right py-2">العائد</th>
                      <th className="text-right py-2">الربح</th>
                      <th className="text-right py-2">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((scenario, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">{scenario.cpm_label}</td>
                        <td className="py-2">{scenario.ctr_label}</td>
                        <td className="py-2">{scenario.cvr_label}</td>
                        <td className="py-2">{scenario.basket_label}</td>
                        <td className="py-2">{scenario.revenue_per_order.toFixed(0)}</td>
                        <td className="py-2">
                          <span className={scenario.net_profit_per_order > 0 ? 'text-green-600' : 'text-red-600'}>
                            {scenario.net_profit_per_order.toFixed(0)}
                          </span>
                        </td>
                        <td className="py-2">{scenario.roas.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
