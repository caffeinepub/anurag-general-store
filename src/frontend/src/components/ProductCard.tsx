import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddToCart } from "../hooks/useQueries";

function formatPrice(paisa: bigint): string {
  const rupees = Number(paisa) / 100;
  return `₹${rupees.toFixed(rupees % 1 === 0 ? 0 : 2)}`;
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    groceries: "Groceries",
    snacks: "Snacks",
    beverages: "Beverages",
    household: "Household",
    personalCare: "Personal Care",
  };
  return map[cat] ?? cat;
}

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const addToCart = useAddToCart();
  const { identity } = useInternetIdentity();
  const inStock = Number(product.stock) > 0;

  const handleAddToCart = async () => {
    if (!identity) {
      toast.error("Please login to add items to cart");
      return;
    }
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1n });
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-card hover:shadow-warm transition-shadow duration-200 border-border">
      <div className="relative h-40 bg-secondary overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-accent/20">
            <ShoppingCart className="w-12 h-12 text-primary/30" />
          </div>
        )}
        <Badge
          className={`absolute top-2 right-2 text-xs ${inStock ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"}`}
        >
          {inStock ? `${product.stock} left` : "Out of stock"}
        </Badge>
        <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs border-0">
          {categoryLabel(product.category)}
        </Badge>
      </div>

      <CardContent className="flex-1 p-3">
        <h3 className="font-display font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {product.description}
        </p>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex items-center justify-between gap-2">
        <span className="font-display font-bold text-primary text-base">
          {formatPrice(product.price)}
        </span>
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={!inStock || addToCart.isPending}
          className="text-xs h-8 px-3"
          data-ocid={`product.add_button.${index + 1}`}
        >
          {addToCart.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ShoppingCart className="w-3 h-3 mr-1" />
          )}
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}
