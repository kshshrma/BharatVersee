import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingBag, Loader2, Minus, Plus, Users, User, MapPin, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface CartItemWithContent {
  id: string;
  quantity: number;
  content: {
    id: string;
    title: string;
    state_name: string;
    category: string;
    price: number | null;
    image_url: string | null;
  };
}

interface SubscriberInfo {
  id: string;
  user_id: string;
  created_at: string;
  display_name: string | null;
  assigned_state: string | null;
}

interface CatchUpCreator {
  subscription_id: string;
  creator_id: string;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  assigned_state: string | null;
}

const Cart = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItemWithContent[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberInfo[]>([]);
  const [catchUps, setCatchUps] = useState<CatchUpCreator[]>([]);
  const [adminCarts, setAdminCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, content:cultural_content(id, title, state_name, category, price, image_url)")
      .eq("user_id", user.id);
    if (!error && data) {
      setItems(data.map((d: any) => ({ id: d.id, quantity: d.quantity, content: d.content })));
    }
  };

  const fetchCatchUps = async () => {
    if (!user) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, creator_id, created_at")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString());
    if (subs && subs.length > 0) {
      const creatorIds = subs.map(s => s.creator_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, assigned_state")
        .in("user_id", creatorIds);
      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p; });
      setCatchUps(subs.map(s => ({
        subscription_id: s.id,
        creator_id: s.creator_id,
        created_at: s.created_at,
        display_name: profileMap[s.creator_id]?.display_name || "Unknown Creator",
        avatar_url: profileMap[s.creator_id]?.avatar_url || null,
        assigned_state: profileMap[s.creator_id]?.assigned_state || null,
      })));
    }
  };

  const fetchSubscribers = async () => {
    if (!user) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, user_id, created_at")
      .eq("creator_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString());
    if (subs && subs.length > 0) {
      const userIds = subs.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, assigned_state")
        .in("user_id", userIds);
      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p; });
      setSubscribers(subs.map(s => ({
        ...s,
        display_name: profileMap[s.user_id]?.display_name || "Unknown User",
        assigned_state: profileMap[s.user_id]?.assigned_state || null,
      })));
    }
  };

  const fetchAdminCarts = async () => {
    if (!user) return;
    
    // Fetch all cart items that link to this admin's cultural content
    const { data: cartData } = await supabase
      .from("cart_items")
      .select(`
        id, 
        user_id, 
        quantity, 
        created_at,
        content:cultural_content!inner(title, category, price, created_by)
      `)
      .eq("content.created_by", user.id);
      
    if (cartData && cartData.length > 0) {
      // Get buyers' details
      const buyerIds = cartData.map(c => c.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, assigned_state")
        .in("user_id", buyerIds);
        
      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p; });
      
      setAdminCarts(cartData.map(c => ({
        id: c.id,
        quantity: c.quantity,
        created_at: c.created_at,
        content: Array.isArray(c.content) ? c.content[0] : c.content, // Handled properly
        buyer_name: profileMap[c.user_id]?.display_name || "Unknown Buyer",
        buyer_state: profileMap[c.user_id]?.assigned_state || null,
      })));
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (isAdmin) {
      Promise.all([fetchSubscribers(), fetchAdminCarts()]).then(() => setLoading(false));
    } else {
      Promise.all([fetchCart(), fetchCatchUps()]).then(() => setLoading(false));
    }
  }, [user, isAdmin]);

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)));
  };

  const removeItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Removed from cart 🗑️" });
  };

  const total = items.reduce((sum, i) => sum + (i.content.price || 0) * i.quantity, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <Card className="glass-card border-border/30 p-8 text-center max-w-md">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Login to view your cart</h2>
          <Link to="/login">
            <Button className="bg-gradient-saffron text-primary-foreground">Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Admin view: show subscribers
  if (isAdmin) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-12">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-8 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" /> Your Subscribers
            </h1>

            {subscribers.length === 0 ? (
              <Card className="glass-card border-border/30 p-8 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No subscribers yet. Keep creating content!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{subscribers.length} user(s) CaughtUp with you</p>
                {subscribers.map((sub) => (
                  <Card key={sub.id} className="glass-card border-border/30">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                        {sub.display_name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{sub.display_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sub.assigned_state ? `📍 ${sub.assigned_state}` : "Explorer"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <h1 className="text-3xl font-display font-bold text-foreground mt-16 mb-8 flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" /> Active User Carts
            </h1>

            {adminCarts.length === 0 ? (
              <Card className="glass-card border-border/30 p-8 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nobody has added your products to their cart yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{adminCarts.length} products currently in carts</p>
                {adminCarts.map((item) => (
                  <Card key={item.id} className="glass-card border-border/30">
                    <CardContent className="p-4 flex items-center gap-4 text-foreground">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.content.title} <span className="text-sm font-normal text-muted-foreground">(x{item.quantity})</span></h3>
                        <p className="text-xs text-muted-foreground capitalize">{item.content.category} · ₹{item.content.price}</p>
                      </div>
                      <div className="flex-1 border-l border-border/50 pl-4">
                        <p className="text-sm font-medium">{item.buyer_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {item.buyer_state || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">In Cart</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
          </motion.div>
        </div>
      </div>
    );
  }

  // User view: show cart items + CatchUp subscriptions
  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* CatchUp Subscriptions */}
          {catchUps.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-display font-bold text-foreground mb-5 flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" /> Your CatchUps
              </h2>
              <div className="space-y-3">
                {catchUps.map((c) => (
                  <Card key={c.subscription_id} className="glass-card border-border/30">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt={c.display_name || ""} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          c.display_name?.[0]?.toUpperCase() || <User className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{c.display_name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.assigned_state || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                          <Zap className="h-3 w-3" /> CaughtUp
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Cart Items */}
          <h1 className="text-3xl font-display font-bold text-foreground mb-8 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" /> Your Cart
          </h1>

          {items.length === 0 && catchUps.length === 0 ? (
            <Card className="glass-card border-border/30 p-8 text-center">
              <p className="text-muted-foreground">Your cart is empty. Start exploring states!</p>
              <Link to="/"><Button className="mt-4 bg-gradient-saffron text-primary-foreground">Explore</Button></Link>
            </Card>
          ) : items.length === 0 ? (
            <Card className="glass-card border-border/30 p-6 text-center">
              <p className="text-muted-foreground text-sm">No items in cart yet.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="glass-card border-border/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.content.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{item.content.state_name} · {item.content.category}</p>
                      <p className="text-primary font-bold mt-1">₹{item.content.price || 0}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span className="text-foreground font-medium w-6 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="glass-card border-border/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{total.toLocaleString()}</span>
                </CardContent>
              </Card>
              <Button className="w-full bg-gradient-saffron text-primary-foreground hover:opacity-90 h-12 text-lg"
                onClick={() => toast({ title: "Checkout coming soon! 🚀" })}>
                Proceed to Checkout
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Cart;
