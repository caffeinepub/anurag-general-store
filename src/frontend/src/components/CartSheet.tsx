import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  useAllProducts,
  useCart,
  usePlaceOrder,
  useRemoveFromCart,
  useUpdateCartItem,
} from "../hooks/useQueries";

function formatPrice(paisa: bigint): string {
  const rupees = Number(paisa) / 100;
  return `₹${rupees.toFixed(rupees % 1 === 0 ? 0 : 2)}`;
}

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSheet({ open, onClose }: CartSheetProps) {
  const { data: cart = [] } = useCart();
  const { data: products = [] } = useAllProducts();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const placeOrder = usePlaceOrder();

  const cartWithProducts = cart
    .map((item) => ({
      item,
      product: products.find((p) => p.id === item.productId),
    }))
    .filter((e) => e.product !== undefined);

  const total = cartWithProducts.reduce(
    (sum, { item, product }) =>
      sum + Number(product!.price) * Number(item.quantity),
    0,
  );

  const handleQuantityChange = async (
    productId: bigint,
    current: number,
    delta: number,
  ) => {
    const next = current + delta;
    try {
      if (next <= 0) {
        await removeItem.mutateAsync(productId);
      } else {
        await updateItem.mutateAsync({ productId, quantity: BigInt(next) });
      }
    } catch {
      toast.error("Failed to update cart");
    }
  };

  const handlePlaceOrder = async () => {
    try {
      await placeOrder.mutateAsync();
      toast.success(
        "🎉 Order placed successfully! Thank you for shopping with us.",
      );
      onClose();
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
        data-ocid="cart.sheet"
      >
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="font-display text-xl flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Cart
            {cart.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({cart.length} items)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cartWithProducts.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground"
            data-ocid="cart.empty_state"
          >
            <ShoppingBag className="w-20 h-20 opacity-20" />
            <div className="text-center">
              <p className="font-display text-lg font-semibold">
                Your cart is empty
              </p>
              <p className="text-sm mt-1">Add some items to get started!</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <AnimatePresence>
                {cartWithProducts.map(({ item, product }, index) => (
                  <motion.div
                    key={item.productId.toString()}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="py-4"
                    data-ocid={`cart.item.${index + 1}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                        {product!.imageUrl ? (
                          <img
                            src={product!.imageUrl}
                            alt={product!.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm leading-snug truncate">
                          {product!.name}
                        </p>
                        <p className="text-primary font-bold text-sm mt-0.5">
                          {formatPrice(product!.price)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                Number(item.quantity),
                                -1,
                              )
                            }
                            data-ocid={`cart.decrease_button.${index + 1}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-semibold w-6 text-center">
                            {Number(item.quantity)}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                Number(item.quantity),
                                1,
                              )
                            }
                            data-ocid={`cart.increase_button.${index + 1}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 ml-auto text-destructive hover:text-destructive"
                            onClick={() =>
                              removeItem
                                .mutateAsync(item.productId)
                                .catch(() =>
                                  toast.error("Failed to remove item"),
                                )
                            }
                            data-ocid={`cart.delete_button.${index + 1}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>

            <div className="px-6 pb-6 pt-4 border-t border-border bg-secondary/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display font-bold text-xl text-primary">
                  {formatPrice(BigInt(Math.round(total)))}
                </span>
              </div>
              <Button
                className="w-full h-12 text-base"
                onClick={handlePlaceOrder}
                disabled={placeOrder.isPending}
                data-ocid="cart.place_order_button"
              >
                {placeOrder.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {placeOrder.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
