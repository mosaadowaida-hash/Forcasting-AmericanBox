import { useState } from 'react';
import { useLocalProducts } from '@/hooks/useLocalProducts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, Trash2, Edit2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  type: 'product' | 'bundle';
  original_price: number;
  discount_two_items?: number;
  discount_three_items?: number;
  bundle_discount?: number;
}

interface ProductManagementDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

export function ProductManagementDialog({ product, open, onOpenChange, onProductUpdated }: ProductManagementDialogProps) {
  const { updateProduct, deleteProduct } = useLocalProducts();
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Product | null>(product);

  const handleEdit = async () => {
    try {
      setLoading(true);

      if (!formData) return;

      updateProduct(formData.id, {
        name: formData.name,
        original_price: formData.original_price,
        discount_two_items: formData.type === 'product' ? formData.discount_two_items : undefined,
        discount_three_items: formData.type === 'product' ? formData.discount_three_items : undefined,
        bundle_discount: formData.type === 'bundle' ? formData.bundle_discount : undefined,
      });

      toast.success('تم تحديث المنتج بنجاح!');
      setMode('view');
      onOpenChange(false);
      onProductUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      if (!product) return;

      deleteProduct(product.id);

      toast.success('تم حذف المنتج بنجاح!');
      onOpenChange(false);
      onProductUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إدارة المنتج</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>

        {mode === 'view' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600">اسم المنتج</p>
              <p className="text-sm font-bold text-slate-900">{product.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">النوع</p>
              <p className="text-sm font-bold text-slate-900">{product.type === 'product' ? 'منتج عادي' : 'باندل'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">السعر الأصلي</p>
              <p className="text-sm font-bold text-slate-900">{product.original_price} ج.م</p>
            </div>
            {product.type === 'product' ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-600">خصم القطعتين</p>
                  <p className="text-sm font-bold text-slate-900">{product.discount_two_items || 0}%</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600">خصم الثلاث قطع</p>
                  <p className="text-sm font-bold text-slate-900">{product.discount_three_items || 0}%</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-600">خصم الباندل</p>
                <p className="text-sm font-bold text-slate-900">{product.bundle_discount || 0}%</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                إغلاق
              </Button>
              <Button
                onClick={() => {
                  setMode('edit');
                  setFormData(product);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4 ml-2" />
                تعديل
              </Button>
              <Button
                onClick={() => setMode('delete')}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </Button>
            </div>
          </div>
        )}

        {mode === 'edit' && formData && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">اسم المنتج</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">السعر الأصلي (ج.م)</Label>
              <Input
                type="number"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>

            {formData.type === 'product' ? (
              <>
                <div>
                  <Label className="text-sm font-medium">نسبة خصم القطعتين (%)</Label>
                  <Input
                    type="number"
                    value={formData.discount_two_items || 0}
                    onChange={(e) => setFormData({ ...formData, discount_two_items: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">نسبة خصم الثلاث قطع (%)</Label>
                  <Input
                    type="number"
                    value={formData.discount_three_items || 0}
                    onChange={(e) => setFormData({ ...formData, discount_three_items: parseFloat(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label className="text-sm font-medium">نسبة خصم الباندل (%)</Label>
                <Input
                  type="number"
                  value={formData.bundle_discount || 0}
                  onChange={(e) => setFormData({ ...formData, bundle_discount: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setMode('view')} disabled={loading}>
                إلغاء
              </Button>
              <Button onClick={handleEdit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </div>
        )}

        {mode === 'delete' && (
          <div className="space-y-4">
            <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">تحذير!</p>
                <p className="text-xs text-red-700 mt-1">
                  هل أنت متأكد من حذف المنتج "{product.name}"؟ سيتم حذف جميع السيناريوهات المرتبطة به أيضاً.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setMode('view')} disabled={loading}>
                إلغاء
              </Button>
              <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
                {loading ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
