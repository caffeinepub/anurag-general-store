import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminPanel from "./components/AdminPanel";
import CartSheet from "./components/CartSheet";
import Header from "./components/Header";
import ShopPage from "./components/ShopPage";

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onCartClick={() => setCartOpen(true)}
        onAdminClick={() => setAdminOpen((prev) => !prev)}
      />
      <main className="flex-1">
        <ShopPage />
        {adminOpen && <AdminPanel />}
      </main>
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
      <Toaster richColors position="top-right" />
      <footer className="border-t border-border py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Anurag General Store. Built with love
          using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
