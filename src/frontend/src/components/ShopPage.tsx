import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { STATIC_PRODUCTS } from "../data/staticProducts";
import {
  Category,
  useAllProducts,
  useProductsByCategory,
} from "../hooks/useQueries";
import ProductCard from "./ProductCard";

const CATEGORIES = [
  { label: "All", value: null },
  { label: "Groceries", value: Category.groceries },
  { label: "Beverages", value: Category.beverages },
  { label: "Snacks", value: Category.snacks },
  { label: "Household", value: Category.household },
  { label: "Personal Care", value: Category.personalCare },
];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const allQuery = useAllProducts();
  const catQuery = useProductsByCategory(activeCategory);

  const query = activeCategory === null ? allQuery : catQuery;
  const isLoading = query.isLoading;

  // Use backend products if available, otherwise fall back to static products
  const backendProducts = query.data ?? [];
  const useBackend = backendProducts.length > 0;

  const products = useBackend
    ? backendProducts
    : activeCategory === null
      ? STATIC_PRODUCTS
      : STATIC_PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <section className="container py-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">
          Our Products
        </h2>
        <p className="text-muted-foreground text-sm">
          Fresh, quality products at fair prices
        </p>
      </div>

      <Tabs
        defaultValue="all"
        onValueChange={(val) => {
          const found = CATEGORIES.find((c) => (c.value ?? "all") === val);
          setActiveCategory(found?.value ?? null);
        }}
      >
        <TabsList className="flex-wrap h-auto gap-1 bg-secondary mb-6 p-1">
          {CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.label}
              value={cat.value ?? "all"}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="category.tab"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          data-ocid="products.loading_state"
        >
          {Array.from({ length: 8 }, (_, i) => i).map((i) => (
            <div key={`skeleton-${i}`} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
          data-ocid="product.empty_state"
        >
          <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No products in this category</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id.toString()}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              data-ocid={`product.item.${index + 1}`}
            >
              <ProductCard product={product} index={index} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
