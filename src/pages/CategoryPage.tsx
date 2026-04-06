import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, Zap, Loader2, Lock, ChevronUp, ChevronDown, User, Star, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStateBackground } from "@/data/stateBackgrounds";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  is_purchasable: boolean | null;
  is_exclusive: boolean | null;
  image_url: string | null;
  category: string;
  created_by: string | null;
  video_url: string | null;
  recipe: string | null;
}

interface CreatorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  assigned_state: string | null;
}

const categoryEmojis: Record<string, string> = {
  dance: "💃",
  music: "🎵",
  food: "🍛",
  handicrafts: "🧵",
};

const CategoryPage = () => {
  const { stateName, category } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const decodedState = decodeURIComponent(stateName || "");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [creators, setCreators] = useState<Record<string, CreatorProfile>>({});
  const [subscribedCreators, setSubscribedCreators] = useState<Set<string>>(new Set());
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [creatorContent, setCreatorContent] = useState<ContentItem[]>([]);
  const [creatorRating, setCreatorRating] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [fullScreenContent, setFullScreenContent] = useState<ContentItem | null>(null);
  const bgImage = getStateBackground(decodedState);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from("cultural_content")
        .select("id, title, description, price, is_purchasable, is_exclusive, image_url, category, created_by, video_url, recipe")
        .eq("state_name", decodedState)
        .eq("category", category || "")
        .not("created_by", "in", '("00000000-0000-0000-0000-000000000001","00000000-0000-0000-0000-000000000002","00000000-0000-0000-0000-000000000003","00000000-0000-0000-0000-000000000004","00000000-0000-0000-0000-000000000005","00000000-0000-0000-0000-000000000006","00000000-0000-0000-0000-000000000007")');

      if (!error && data) {
        // Render all content in reels. Exclusive logic handled inside ReelCard
        setItems(data as ContentItem[]);
        const creatorIds = [...new Set(data.map(d => d.created_by).filter(Boolean))] as string[];
        if (creatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, assigned_state")
            .in("user_id", creatorIds);
          if (profiles) {
            const map: Record<string, CreatorProfile> = {};
            profiles.forEach(p => { map[p.user_id] = p; });
            setCreators(map);
          }
        }
      }
      setLoading(false);
    };

    const fetchSubscriptions = async () => {
      if (!user) return;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase
        .from("subscriptions")
        .select("creator_id")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());
      if (data) {
        setSubscribedCreators(new Set(data.map(s => s.creator_id)));
      }
    };

    fetchContent();
    fetchSubscriptions();
  }, [decodedState, category, user]);

  const handleScroll = useCallback((direction: "up" | "down") => {
    // Only used by buttons now, blocking logic is mostly in wheel/touch
    setCurrentIndex(prev => {
      if (direction === "down") return Math.min(prev + 1, items.length - 1);
      return Math.max(prev - 1, 0);
    });
  }, [items.length]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // If we are currently locked, still extend the lockout to "soak up" trailing inertial events
      if (isScrolling.current) {
        if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
        wheelTimeout.current = setTimeout(() => {
          isScrolling.current = false;
        }, 300);
        return;
      }
      
      // If we are unlocked and threshold is met, trigger scroll and start lockout
      if (Math.abs(e.deltaY) > 30) {
        handleScroll(e.deltaY > 0 ? "down" : "up");
        
        isScrolling.current = true;
        if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
        wheelTimeout.current = setTimeout(() => {
          isScrolling.current = false;
        }, 300);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { 
      touchStartY = e.touches[0].clientY; 
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50 && !isScrolling.current) {
        handleScroll(diff > 0 ? "down" : "up");
        
        // Lock touch swipe for a bit
        isScrolling.current = true;
        if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
        wheelTimeout.current = setTimeout(() => {
          isScrolling.current = false;
        }, 600);
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener("wheel", handleWheel, { passive: false });
      el.addEventListener("touchstart", handleTouchStart, { passive: true });
      el.addEventListener("touchend", handleTouchEnd, { passive: true });
    }
    return () => {
      if (el) {
        el.removeEventListener("wheel", handleWheel);
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [handleScroll]);

  // handleAddToCart moved to handleAddToCartFromProfile inside creator profile

  const handleCatchUp = async (creatorId: string) => {
    if (!user) {
      toast({ title: "Please login first", description: "You need to be logged in to subscribe.", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (subscribedCreators.has(creatorId)) {
      toast({ title: "Already subscribed ⚡", description: "You're already subscribed to this creator." });
      return;
    }

    // Delete existing old subscriptions to prevent unique constraint error
    await supabase.from("subscriptions").delete().eq("user_id", user.id).eq("creator_id", creatorId);

    await supabase.from("subscriptions").insert({ user_id: user.id, creator_id: creatorId });
    setSubscribedCreators(prev => new Set([...prev, creatorId]));
    toast({ title: "CatchUp Subscribed ⚡", description: "You've subscribed! Exclusive content is now unlocked." });
  };

  const handleAddToCartFromProfile = async (contentItem: ContentItem) => {
    if (!user) {
      toast({ title: "Please login first", variant: "destructive" });
      navigate("/login");
      return;
    }
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("content_id", contentItem.id)
      .maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: (existing.quantity || 1) + 1 }).eq("id", existing.id);
      toast({ title: "Updated cart 🛒", description: `${contentItem.title} quantity increased.` });
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, content_id: contentItem.id, quantity: 1 });
      toast({ title: "Added to Cart 🛒", description: `${contentItem.title} added.` });
    }
  };

  const openCreatorProfile = async (creator: CreatorProfile) => {
    setSelectedCreator(creator);
    setUserRating(0);
    setHoverRating(0);

    // Fetch all content by this creator
    const { data: allContent } = await supabase
      .from("cultural_content")
      .select("id, title, description, price, is_purchasable, is_exclusive, image_url, category, created_by, video_url, recipe")
      .eq("created_by", creator.user_id);
    setCreatorContent((allContent as ContentItem[]) || []);

    // Fetch ratings
    const { data: ratings } = await supabase
      .from("creator_ratings")
      .select("rating, user_id")
      .eq("creator_id", creator.user_id);

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      setAverageRating(Math.round(avg * 10) / 10);
      setTotalRatings(ratings.length);
      if (user) {
        const myRating = ratings.find(r => r.user_id === user.id);
        if (myRating) setUserRating(myRating.rating);
      }
    } else {
      setAverageRating(0);
      setTotalRatings(0);
    }
  };

  const submitRating = async (rating: number) => {
    if (!user || !selectedCreator) {
      toast({ title: "Please login first", variant: "destructive" });
      return;
    }
    setUserRating(rating);

    // Upsert rating
    const { error } = await supabase
      .from("creator_ratings")
      .upsert(
        { user_id: user.id, creator_id: selectedCreator.user_id, rating, updated_at: new Date().toISOString() },
        { onConflict: "user_id,creator_id" }
      );

    if (!error) {
      toast({ title: `Rated ${rating} ⭐`, description: `You rated ${selectedCreator.display_name}` });
      // Refresh ratings
      const { data: ratings } = await supabase
        .from("creator_ratings")
        .select("rating")
        .eq("creator_id", selectedCreator.user_id);
      if (ratings && ratings.length > 0) {
        setAverageRating(Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10);
        setTotalRatings(ratings.length);
      }
    }
  };

  const currentItem = items[currentIndex];

  return (
    <div ref={containerRef} className="h-screen w-full overflow-hidden relative bg-background">
      {/* Back button */}
      <div className="absolute top-20 left-4 z-30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/state/${encodeURIComponent(decodedState)}`)}
          className="bg-background/60 backdrop-blur-md text-foreground hover:bg-background/80 rounded-full"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Scroll indicators */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <Button variant="ghost" size="icon" disabled={currentIndex === 0} 
          onClick={() => {
            if (!isScrolling.current) {
              handleScroll("up");
              isScrolling.current = true;
              if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
              wheelTimeout.current = setTimeout(() => { isScrolling.current = false; }, 500);
            }
          }}
          className="bg-background/40 backdrop-blur-md rounded-full h-10 w-10 text-foreground hover:bg-background/70">
          <ChevronUp className="h-5 w-5" />
        </Button>
        <div className="text-center text-xs text-muted-foreground font-medium bg-background/40 backdrop-blur-md rounded-full px-2 py-1">
          {currentIndex + 1}/{items.length}
        </div>
        <Button variant="ghost" size="icon" disabled={currentIndex === items.length - 1} 
          onClick={() => {
            if (!isScrolling.current) {
              handleScroll("down");
              isScrolling.current = true;
              if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
              wheelTimeout.current = setTimeout(() => { isScrolling.current = false; }, 500);
            }
          }}
          className="bg-background/40 backdrop-blur-md rounded-full h-10 w-10 text-foreground hover:bg-background/70">
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-3">
          <p className="text-muted-foreground text-lg">No content available yet.</p>
          <Button variant="outline" onClick={() => navigate(`/state/${encodeURIComponent(decodedState)}`)}>Go Back</Button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {currentItem && (
            <ReelCard
              key={currentItem.id}
              item={currentItem}
              bgImage={bgImage}
              category={category || ""}
              creator={currentItem.created_by ? creators[currentItem.created_by] : undefined}
              onCreatorClick={(c) => openCreatorProfile(c)}
              isLocked={currentItem.is_exclusive && (!currentItem.created_by || !subscribedCreators.has(currentItem.created_by))}
              onSubscribe={() => currentItem.created_by && handleCatchUp(currentItem.created_by)}
            />
          )}
        </AnimatePresence>
      )}

      {/* Creator Profile Dialog - Enhanced */}
      <Dialog open={!!selectedCreator} onOpenChange={(open) => !open && setSelectedCreator(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 space-y-5">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Creator Profile</DialogTitle>
              </DialogHeader>
              {selectedCreator && (
                <>
                  {/* Profile header */}
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-3xl font-bold shrink-0">
                      {selectedCreator.display_name?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-xl text-foreground">{selectedCreator.display_name || "Creator"}</h3>
                      <p className="text-sm text-muted-foreground">📍 {selectedCreator.assigned_state || decodedState}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-foreground">
                          {averageRating > 0 ? averageRating : "No ratings"}
                        </span>
                        {totalRatings > 0 && (
                          <span className="text-xs text-muted-foreground">({totalRatings} ratings)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{creatorContent.length}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {creatorContent.filter(c => c.is_exclusive).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Exclusive</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {subscribedCreators.has(selectedCreator.user_id) ? "✅" : "❌"}
                      </p>
                      <p className="text-xs text-muted-foreground">CatchUp</p>
                    </div>
                  </div>

                  {/* Rate this creator */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Rate this Creator</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => submitRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-125"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              star <= (hoverRating || userRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        </button>
                      ))}
                      {userRating > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">Your rating: {userRating}/5</span>
                      )}
                    </div>
                  </div>

                  {/* CatchUp button */}
                  {!subscribedCreators.has(selectedCreator.user_id) ? (
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 h-12 text-base"
                      onClick={() => handleCatchUp(selectedCreator.user_id)}
                    >
                      <Zap className="h-5 w-5 mr-2" /> CatchUp — Subscribe to Unlock Exclusive
                    </Button>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                      <p className="text-emerald-400 font-semibold flex items-center justify-center gap-2">
                        <Zap className="h-4 w-4" /> You're subscribed via CatchUp
                      </p>
                    </div>
                  )}

                  {/* Content Grid - Instagram style */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">All Content</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {creatorContent.map((content) => {
                        const isLocked = content.is_exclusive && !subscribedCreators.has(selectedCreator.user_id);
                        return (
                          <div 
                            key={content.id} 
                            className="relative aspect-square rounded-md overflow-hidden group cursor-pointer"
                            onClick={() => !isLocked && setFullScreenContent(content)}
                          >
                            {content.image_url ? (
                              <img src={content.image_url} alt={content.title} className="w-full h-full object-cover" />
                            ) : content.video_url ? (
                              <video src={content.video_url} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-2xl">{categoryEmojis[content.category] || "🎨"}</span>
                              </div>
                            )}
                            {/* Blur overlay for exclusive locked content */}
                            {isLocked && (
                              <div className="absolute inset-0 backdrop-blur-md bg-background/40 flex items-center justify-center">
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            {/* Hover overlay with Add to Cart */}
                            <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 gap-1">
                              <p className="text-foreground text-xs text-center font-medium line-clamp-2">{content.title}</p>
                              {content.is_purchasable && !isLocked && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAddToCartFromProfile(content); }}
                                  className="flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-1 rounded-full hover:opacity-90"
                                >
                                  <ShoppingCart className="h-3 w-3" /> ₹{content.price || 0}
                                </button>
                              )}
                            </div>
                            {/* Exclusive badge */}
                            {content.is_exclusive && (
                              <div className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded">
                                ✦
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Full Screen Content Dialog */}
      <Dialog open={!!fullScreenContent} onOpenChange={(open) => !open && setFullScreenContent(null)}>
        <DialogContent className="sm:max-w-4xl h-[90vh] p-0 bg-black/95 border-none flex flex-col items-center justify-center">
          <button 
            onClick={() => setFullScreenContent(null)}
            className="absolute top-4 right-4 text-white hover:text-primary z-50 bg-black/50 rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
          
          {fullScreenContent && (
            <div className="w-full h-full flex flex-col pt-12 pb-4 px-4 overflow-hidden">
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-0 bg-black relative">
                {/* Fullscreen Video / Image */}
                {fullScreenContent.video_url ? (
                  <video 
                    src={fullScreenContent.video_url} 
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    loop
                  />
                ) : fullScreenContent.image_url ? (
                  <img 
                    src={fullScreenContent.image_url} 
                    alt={fullScreenContent.title} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-8xl">{categoryEmojis[fullScreenContent.category] || "🎨"}</div>
                )}
              </div>
              <div className="pt-4 mt-2 bg-black text-white px-2 border-t border-white/20 shrink-0">
                <h3 className="font-bold text-xl">{fullScreenContent.title}</h3>
                {fullScreenContent.description && <p className="text-sm mt-1 text-white/80">{fullScreenContent.description}</p>}
                {fullScreenContent.is_purchasable && (
                  <Button 
                    onClick={() => { handleAddToCartFromProfile(fullScreenContent); setFullScreenContent(null); }}
                    className="mt-3 bg-gradient-saffron text-primary-foreground font-semibold"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart — ₹{fullScreenContent.price}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Individual Reel Card Component — Instagram-style (content + creator only)
interface ReelCardProps {
  item: ContentItem;
  bgImage: string;
  category: string;
  creator?: CreatorProfile;
  onCreatorClick: (c: CreatorProfile) => void;
  isLocked?: boolean | null;
  onSubscribe?: () => void;
}

const ReelCard = ({ item, bgImage, category, creator, onCreatorClick, isLocked, onSubscribe }: ReelCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [item.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -80 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="h-screen w-full relative flex items-center justify-center isolate overflow-hidden"
    >
      {/* Blurred Background Layer to fill screen fully for any dimension */}
      <div className="absolute inset-0 z-0 bg-black flex items-center justify-center pointer-events-none">
        <img src={item.image_url || bgImage} alt="" className="w-full h-full object-cover opacity-50 blur-3xl scale-125" />
      </div>

      {/* Main Content layer ensuring no part is missed (object-contain) */}
      <div className={`absolute inset-0 z-10 flex items-center justify-center ${isLocked ? 'blur-2xl scale-110 brightness-50' : ''}`}>
        {item.video_url ? (
          <video
            ref={videoRef}
            src={item.video_url}
            className="w-full h-full object-contain"
            loop
            muted
            playsInline
            autoPlay
          />
        ) : item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
        ) : (
          <img src={bgImage} alt="background" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
      </div>

      {/* Paywall Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/20 backdrop-blur-sm p-4">
          <div className="bg-background/60 backdrop-blur-md p-8 rounded-2xl flex flex-col items-center border border-border/30 max-w-md w-full text-center shadow-2xl">
            <div className="h-16 w-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground mb-2 drop-shadow-lg">Exclusive Content</h3>
            <p className="text-muted-foreground mb-8 text-base">Subscribe to <span className="font-semibold text-foreground">{creator?.display_name || 'this creator'}</span> to unlock this content and much more.</p>
            <Button onClick={onSubscribe} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:opacity-90 h-12 text-lg">
              <Zap className="h-5 w-5 mr-2" /> CatchUp Now
            </Button>
          </div>
        </div>
      )}

      {/* Content overlay — bottom section like Instagram */}
      {!isLocked && (
        <div className="absolute inset-0 flex flex-col justify-end pb-28 px-6 md:px-16 z-20 pointer-events-none">
          <div className="mb-3 pointer-events-auto">
            <span className="text-4xl">{categoryEmojis[category] || "🎨"}</span>
          </div>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-foreground mb-2 drop-shadow-lg pointer-events-auto">
            {item.title}
          </h2>
          <p className="text-foreground/80 text-sm md:text-base max-w-lg mb-3 pointer-events-auto">
            {item.description || "Explore this cultural treasure"}
          </p>
          {category === "food" && item.recipe && (
            <div className="bg-background/60 backdrop-blur-md rounded-xl p-3 max-w-lg pointer-events-auto">
              <p className="text-xs text-muted-foreground font-semibold mb-1">📜 Recipe</p>
              <p className="text-foreground/90 text-sm line-clamp-3">{item.recipe}</p>
            </div>
          )}
        </div>
      )}

      {/* Creator info — bottom left like Instagram */}
      {creator && (
        <button
          onClick={() => onCreatorClick(creator)}
          className="absolute bottom-6 left-6 z-30 flex items-center gap-3 bg-background/60 backdrop-blur-md rounded-full pr-4 pl-1 py-1 hover:bg-background/80 transition-colors cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
            {creator.display_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
          </div>
          <div className="text-left">
            <p className="text-foreground text-sm font-semibold group-hover:text-primary transition-colors leading-tight">
              {creator.display_name || "Creator"}
            </p>
            <p className="text-muted-foreground text-xs leading-tight">
              {creator.assigned_state || "Content Creator"}
            </p>
          </div>
        </button>
      )}
    </motion.div>
  );
};

export default CategoryPage;
