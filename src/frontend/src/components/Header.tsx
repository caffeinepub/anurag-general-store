import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Settings, ShoppingCart, Store } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCart, useIsAdmin } from "../hooks/useQueries";

interface HeaderProps {
  onCartClick: () => void;
  onAdminClick: () => void;
}

export default function Header({ onCartClick, onAdminClick }: HeaderProps) {
  const { data: cart } = useCart();
  const { data: isAdmin } = useIsAdmin();
  const { login, clear, identity, loginStatus } = useInternetIdentity();
  const cartCount =
    cart?.reduce((sum, item) => sum + Number(item.quantity), 0) ?? 0;
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-warm">
      <div className="container flex items-center justify-between h-16 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <img
              src="/assets/generated/store-logo.dim_80x80.png"
              alt="Store Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-primary-foreground leading-tight">
              Anurag General Store
            </h1>
            <p className="text-xs text-primary-foreground/70 hidden sm:block">
              Your neighbourhood shop
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          {identity ? (
            <>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAdminClick}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  data-ocid="header.admin_button"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clear()}
                className="text-primary-foreground hover:bg-primary-foreground/10"
                data-ocid="header.login_button"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => login()}
              disabled={isLoggingIn}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              data-ocid="header.login_button"
            >
              <LogIn className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">
                {isLoggingIn ? "Logging in..." : "Login"}
              </span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            className="relative text-primary-foreground hover:bg-primary-foreground/10"
            data-ocid="header.cart_button"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground border-0">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
