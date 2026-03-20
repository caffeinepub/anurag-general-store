import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import {
  Category,
  useAddProduct,
  useAllProducts,
  useRemoveProduct,
  useUpdateProduct,
} from "../hooks/useQueries";

const CATEGORIES = [
  { label: "Groceries", value: Category.groceries },
  { label: "Beverages", value: Category.beverages },
  { label: "Snacks", value: Category.snacks },
  { label: "Household", value: Category.household },
  { label: "Personal Care", value: Category.personalCare },
];

interface ProductFormData {
  name: string;
  description: string;
  priceRupees: string;
  category: Category;
  imageUrl: string;
  stock: string;
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  description: "",
  priceRupees: "",
  category: Category.groceries,
  imageUrl: "",
  stock: "",
};

export default function AdminPanel() {
  const { data: products = [] } = useAllProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const removeProduct = useRemoveProduct();

  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isSubmitting = addProduct.isPending || updateProduct.isPending;

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      priceRupees: (Number(product.price) / 100).toFixed(2),
      category: product.category as Category,
      imageUrl: product.imageUrl,
      stock: product.stock.toString(),
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = BigInt(Math.round(Number.parseFloat(form.priceRupees) * 100));
    const stock = BigInt(Number.parseInt(form.stock, 10));

    try {
      if (editingId !== null) {
        await updateProduct.mutateAsync({
          id: editingId,
          name: form.name,
          description: form.description,
          price,
          category: form.category,
          imageUrl: form.imageUrl,
          stock,
        });
        toast.success("Product updated successfully!");
      } else {
        await addProduct.mutateAsync({
          name: form.name,
          description: form.description,
          price,
          category: form.category,
          imageUrl: form.imageUrl,
          stock,
        });
        toast.success("Product added successfully!");
      }
      handleCancel();
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: bigint, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await removeProduct.mutateAsync(id);
      toast.success(`"${name}" removed.`);
    } catch {
      toast.error("Failed to remove product");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container py-8"
      data-ocid="admin.panel"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Admin Panel</h2>
          <p className="text-muted-foreground text-sm">
            Manage your store products
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            data-ocid="admin.add_product_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-8 shadow-card" data-ocid="admin.product_form">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display">
                {editingId ? "Edit Product" : "Add New Product"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                data-ocid="admin.close_button"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="space-y-1">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g. Basmati Rice 5kg"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  data-ocid="admin.name_input"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 299.00"
                  value={form.priceRupees}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceRupees: e.target.value }))
                  }
                  data-ocid="admin.price_input"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  required
                  placeholder="Short description of the product"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  data-ocid="admin.description_textarea"
                />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, category: val as Category }))
                  }
                >
                  <SelectTrigger data-ocid="admin.category_select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 50"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                  data-ocid="admin.stock_input"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  data-ocid="admin.image_input"
                />
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-ocid="admin.save_button"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  {editingId ? "Update Product" : "Add Product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  data-ocid="admin.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {products.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="admin.products.empty_state"
          >
            No products yet. Add your first product!
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={product.id.toString()}
              className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border shadow-xs"
              data-ocid={`admin.product.item.${index + 1}`}
            >
              <div className="w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-secondary to-accent/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm truncate">
                  {product.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-primary font-bold text-sm">
                    ₹{(Number(product.price) / 100).toFixed(0)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Stock: {product.stock.toString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => handleEdit(product)}
                  data-ocid={`admin.product.edit_button.${index + 1}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(product.id, product.name)}
                  data-ocid={`admin.product.delete_button.${index + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.section>
  );
}
