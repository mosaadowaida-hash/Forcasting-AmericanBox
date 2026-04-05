import { useState } from 'react';
import { useLocalProductsContext } from '@/contexts/LocalProductsContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
}

export function AddProductDialog({ open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const { addProduct } = useLocalProductsContext();
  const [productType, setProductType] = useState<'product' | 'bundle'>('product');
  const [productName, setProductName] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountTwoItems, setDiscountTwoItems] = useState('');
  const [discountThreeItems, setDiscountThreeItems] = useState('');
  const [bundleDiscount, setBundleDiscount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!productName.trim()) {
      toast.error('الرجاء إدخال اسم المنتج');
      return;
    }

    if (!originalPrice || parseFloat(originalPrice) <= 0) {
      toast.error('الرجاء إدخال سعر صحيح');
      return;
    }

    if (productType === 'product') {
      if (!discountTwoItems || parseFloat(discountTwoItems) < 0) {
        toast.error('الرجاء إدخال نسبة خصم صحيحة للقطعتين');
        return;
      }
      if (!discountThreeItems || parseFloat(discountThreeItems) < 0) {
        toast.error('الرجاء إدخال نسبة خصم صحيحة للثلاث قطع');
        return;
      }
    } else {
      if (!bundleDiscount || parseFloat(bundleDiscount) < 0) {
        toast.error('الرجاء إدخال نسبة خصم صحيحة للباندل');
        return;
      }
    }

    try {
      setLoading(true);

      addProduct({
        name: productName.trim(),
        type: productType,
        original_price: parseFloat(originalPrice),
        discount_two_items: productType === 'product' ? parseFloat(discountTwoItems) : undefined,
        discount_three_items: productType === 'product' ? parseFloat(discountThreeItems) : undefined,
        bundle_discount: productType === 'bundle' ? parseFloat(bundleDiscount) : undefined,
      });

      toast.success('تم إضافة المنتج بنجاح!');
      
      // Reset form
      setProductName('');
      setOriginalPrice('');
      setDiscountTwoItems('');
      setDiscountThreeItems('');
      setBundleDiscount('');
      setProductType('product');
      
      onOpenChange(false);
      onProductAdded?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة منتج جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات المنتج الجديد والخصومات المطبقة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <Label htmlFor="productName" className="text-xs sm:text-sm">اسم المنتج</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="مثال: كريم مرطب للوجه"
              className="mt-1"
            />
          </div>

          {/* Product Type */}
          <div>
            <Label htmlFor="productType" className="text-xs sm:text-sm">نوع المنتج</Label>
            <Select value={productType} onValueChange={(value) => setProductType(value as 'product' | 'bundle')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">منتج عادي</SelectItem>
                <SelectItem value="bundle">باندل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Original Price */}
          <div>
            <Label htmlFor="originalPrice" className="text-xs sm:text-sm">السعر الأصلي (ج.م)</Label>
            <Input
              id="originalPrice"
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="مثال: 500"
              className="mt-1"
              step="0.01"
              min="0"
            />
          </div>

          {/* Conditional Discounts */}
          {productType === 'product' ? (
            <>
              <div>
                <Label htmlFor="discountTwo" className="text-xs sm:text-sm">نسبة خصم القطعتين (%)</Label>
                <Input
                  id="discountTwo"
                  type="number"
                  value={discountTwoItems}
                  onChange={(e) => setDiscountTwoItems(e.target.value)}
                  placeholder="مثال: 10"
                  className="mt-1"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="discountThree" className="text-xs sm:text-sm">نسبة خصم الثلاث قطع (%)</Label>
                <Input
                  id="discountThree"
                  type="number"
                  value={discountThreeItems}
                  onChange={(e) => setDiscountThreeItems(e.target.value)}
                  placeholder="مثال: 15"
                  className="mt-1"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="bundleDiscount" className="text-xs sm:text-sm">نسبة خصم الباندل (%)</Label>
              <Input
                id="bundleDiscount"
                type="number"
                value={bundleDiscount}
                onChange={(e) => setBundleDiscount(e.target.value)}
                placeholder="مثال: 20"
                className="mt-1"
                step="0.01"
                min="0"
                max="100"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'جاري الإضافة...' : 'إضافة المنتج'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
