import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Mail, Phone, Heart, Globe, Users, Sparkles, Store, GraduationCap, Zap, ShieldCheck, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { indianStates, stateEmojis } from "@/data/states";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const values = [
  { icon: Heart, title: "Preserve Heritage", desc: "We safeguard centuries-old traditions by bringing them to the digital world." },
  { icon: Globe, title: "Connect Communities", desc: "Bridging Indian diaspora and culture enthusiasts worldwide." },
  { icon: Users, title: "Empower Artisans", desc: "Direct support to local creators, craftsmen, and performers." },
  { icon: Sparkles, title: "Inspire Discovery", desc: "Making cultural exploration fun, accessible, and rewarding." },
];

const services = [
  { icon: Store, title: "State-Wise Cultural Marketplace", desc: "Each Indian state has its own store page showcasing handicrafts, food, and festival gift boxes. Support local artisans and regional pride." },
  { icon: GraduationCap, title: "Cultural Learning Experiences", desc: "Learn from locals through folk dance tutorials, authentic recipes, and language workshops. Preserve living traditions through education." },
  { icon: Globe, title: "Global Cultural Sharing Space", desc: "Share festival moments, traditional attire photos, and love for India from anywhere. Connect diaspora & global fans of Indian culture." },
  { icon: Zap, title: '"CatchUp" & "Cart"', desc: "Subscribe to exclusive content from cultural creators or add handicraft products to your cart." },
  { icon: Heart, title: "Support Local Artisan Stories", desc: "Each product tells the artisan's story and offers direct support. Empower Indian creators and showcase real lives." },
  { icon: ShieldCheck, title: "Verified Commerce & Buying", desc: "Only trusted sellers, fair profits, and eco-friendly packaging. Promote honest, responsible e-commerce." },
];

const categories = ["dance", "music", "food", "handicrafts"];

const Index = () => {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, assignedState } = useAuth();
  const { toast } = useToast();

  // Add content dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentDesc, setContentDesc] = useState("");
  const [contentCategory, setContentCategory] = useState("");
  const [contentImageUrl, setContentImageUrl] = useState("");
  const [contentVideoUrl, setContentVideoUrl] = useState("");
  const [contentRecipe, setContentRecipe] = useState("");
  const [contentPrice, setContentPrice] = useState("");
  const [contentPurchasable, setContentPurchasable] = useState(false);
  const [contentExclusive, setContentExclusive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const filtered = indianStates.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleStateClick = (state: string) => {
    navigate(`/state/${encodeURIComponent(state)}`);
  };

  const handleExplore = () => {
    if (filtered.length === 1) {
      handleStateClick(filtered[0]);
    } else {
      setShowResults(true);
    }
  };

  const resetContentForm = () => {
    setContentTitle("");
    setContentDesc("");
    setContentCategory("");
    setContentImageUrl("");
    setContentVideoUrl("");
    setContentRecipe("");
    setContentPrice("");
    setContentPurchasable(false);
    setContentExclusive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (type === "image") setUploadingImage(true);
    else setUploadingVideo(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("content_media")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage.from("content_media").getPublicUrl(filePath);
      if (type === "image") setContentImageUrl(publicUrl);
      else setContentVideoUrl(publicUrl);
      toast({ title: "Upload successful ✅" });
    }

    if (type === "image") setUploadingImage(false);
    else setUploadingVideo(false);
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignedState || !contentCategory) return;
    setSubmitting(true);

    const { error } = await supabase.from("cultural_content").insert({
      title: contentTitle,
      description: contentDesc || null,
      category: contentCategory,
      state_name: assignedState,
      image_url: contentImageUrl || null,
      video_url: contentVideoUrl || null,
      recipe: contentRecipe || null,
      price: contentPrice ? parseFloat(contentPrice) : null,
      is_purchasable: contentPurchasable,
      is_exclusive: contentExclusive,
      created_by: user.id,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to add content", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content added! 🎉", description: `Published to ${assignedState} > ${contentCategory}` });
      resetContentForm();
      setAddOpen(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* ===== HOME SECTION ===== */}
      <section id="home" className="min-h-screen flex items-center justify-center pt-20">
        <div className="container mx-auto px-4 py-20 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Rediscover India{" "}
              <span className="text-gradient-saffron">Digitally</span>
            </h1>
            <p className="max-w-2xl mx-auto text-muted-foreground text-lg md:text-xl mb-14 leading-relaxed">
              A digital gateway to explore India's rich cultural heritage, blending
              traditions with e-commerce and learning experiences.
            </p>
          </motion.div>

          {/* Search / Add Content */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="max-w-2xl mx-auto relative">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-saffron-glow to-primary rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" />
              <div className="relative bg-card/90 backdrop-blur-xl rounded-2xl border border-primary/30 shadow-[0_0_40px_-10px_hsl(var(--saffron)/0.4)] p-2">
                {isAdmin ? (
                  /* Admin: show assigned state + add content button */
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 text-left">
                      <p className="text-sm text-muted-foreground">Your State</p>
                      <p className="text-lg font-bold text-foreground">{stateEmojis[assignedState || ""] || "📍"} {assignedState || "Not assigned"}</p>
                    </div>
                    <Button
                      onClick={() => setAddOpen(true)}
                      className="bg-gradient-saffron text-primary-foreground font-semibold px-6 py-6 text-base rounded-xl shadow-[0_4px_20px_-4px_hsl(var(--saffron)/0.5)] hover:shadow-[0_8px_30px_-4px_hsl(var(--saffron)/0.7)] hover:scale-105 transition-all duration-300"
                    >
                      <Plus className="h-5 w-5 mr-2" /> Add Content
                    </Button>
                  </div>
                ) : (
                  /* User: search states */
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <Input
                        placeholder='Search a state e.g., Uttar Pradesh, Rajasthan'
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
                        onFocus={() => setShowResults(true)}
                        className="pl-12 pr-4 py-6 text-base bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <Button onClick={handleExplore}
                      className="bg-gradient-saffron text-primary-foreground font-semibold px-8 py-6 text-base rounded-xl shadow-[0_4px_20px_-4px_hsl(var(--saffron)/0.5)] hover:shadow-[0_8px_30px_-4px_hsl(var(--saffron)/0.7)] hover:scale-105 transition-all duration-300">
                      Explore States
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {!isAdmin && showResults && search && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-3 left-0 right-0 glass-card rounded-xl max-h-60 overflow-y-auto z-20 shadow-[0_20px_50px_-15px_hsl(var(--saffron)/0.2)]">
                {filtered.length > 0 ? (
                  filtered.map((state) => (
                    <button key={state} onClick={() => handleStateClick(state)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors text-foreground">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{stateEmojis[state] || "📍"} {state}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-muted-foreground">No states found</div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section id="about" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">About <span className="text-gradient-saffron">BharatVerse</span></h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              BharatVerse is a celebration of India — its colors, rhythms, flavors, and crafts.
              We're building a digital bridge between timeless traditions and modern technology,
              enabling anyone, anywhere to explore, learn, and support India's incredible cultural mosaic.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="glass-card-hover rounded-2xl p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4"><v.icon className="h-6 w-6 text-primary" /></div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center glass-card rounded-2xl p-10 max-w-2xl mx-auto">
            <p className="text-xl italic text-foreground mb-4">"India is not just a country — it's a universe of stories waiting to be told."</p>
            <p className="text-muted-foreground text-sm">— The BharatVerse Team</p>
          </motion.div>
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section id="services" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our <span className="text-gradient-saffron">Services</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to explore, learn, and celebrate India's cultural wealth.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card-hover rounded-2xl p-6 flex flex-col">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 self-start"><s.icon className="h-6 w-6 text-primary" /></div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm flex-1">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section id="contact" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Get in <span className="text-gradient-saffron">Touch</span></h2>
            <p className="text-muted-foreground text-lg">Have questions? We'd love to hear from you.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="space-y-6">
              <div className="glass-card rounded-xl p-5 flex items-start gap-4"><Mail className="h-5 w-5 text-primary mt-1" /><div><p className="font-semibold text-foreground">Email</p><p className="text-muted-foreground text-sm">hello@bharatverse.in</p></div></div>
              <div className="glass-card rounded-xl p-5 flex items-start gap-4"><Phone className="h-5 w-5 text-primary mt-1" /><div><p className="font-semibold text-foreground">Phone</p><p className="text-muted-foreground text-sm">+91 98765 43210</p></div></div>
              <div className="glass-card rounded-xl p-5 flex items-start gap-4"><MapPin className="h-5 w-5 text-primary mt-1" /><div><p className="font-semibold text-foreground">Address</p><p className="text-muted-foreground text-sm">New Delhi, India</p></div></div>
            </motion.div>
            <motion.form initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Input placeholder="Your Name" className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground" />
              <Input placeholder="Your Email" type="email" className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground" />
              <Textarea placeholder="Your Message" rows={4} className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground" />
              <Button className="w-full bg-gradient-saffron text-primary-foreground hover:opacity-90">Send Message</Button>
            </motion.form>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 BharatVerse. Celebrating India's Cultural Heritage.</p>
        </div>
      </footer>

      {/* Add Content Dialog for Admin */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Content to {assignedState}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddContent} className="space-y-4">
            <div>
              <Label className="text-foreground">Title</Label>
              <Input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label className="text-foreground">Category</Label>
              <Select value={contentCategory} onValueChange={setContentCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">Description</Label>
              <Textarea value={contentDesc} onChange={(e) => setContentDesc(e.target.value)} className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground">Cover Image</Label>
                <div className="mt-1 flex items-center">
                  <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} disabled={uploadingImage} className="bg-background/50 border-border/50 text-foreground" />
                </div>
                {uploadingImage && <span className="text-xs text-primary mt-1">Uploading...</span>}
                {contentImageUrl && <span className="text-xs text-green-500 mt-1">Image attached ✅</span>}
              </div>
              <div>
                <Label className="text-foreground">Video (Optional)</Label>
                <div className="mt-1 flex items-center">
                  <Input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, "video")} disabled={uploadingVideo} className="bg-background/50 border-border/50 text-foreground" />
                </div>
                {uploadingVideo && <span className="text-xs text-primary mt-1">Uploading...</span>}
                {contentVideoUrl && <span className="text-xs text-green-500 mt-1">Video attached ✅</span>}
              </div>
            </div>
            {contentCategory === "food" && (
              <div>
                <Label className="text-foreground">Recipe</Label>
                <Textarea value={contentRecipe} onChange={(e) => setContentRecipe(e.target.value)} className="mt-1" rows={2} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground">Price (₹)</Label>
                <Input type="number" value={contentPrice} onChange={(e) => setContentPrice(e.target.value)} className="mt-1" />
              </div>
              <div className="flex flex-col gap-2 pt-6">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={contentPurchasable} onChange={(e) => setContentPurchasable(e.target.checked)} className="rounded" />
                  Purchasable
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={contentExclusive} onChange={(e) => setContentExclusive(e.target.checked)} className="rounded" />
                  Exclusive
                </label>
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-saffron text-primary-foreground">
              {submitting ? "Publishing..." : "Publish Content"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
