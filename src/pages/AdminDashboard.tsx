import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Shield, Loader2, Users, Star, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { indianStates } from "@/data/states";

interface ContentItem {
  id: string;
  state_name: string;
  category: string;
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  recipe: string | null;
  price: number | null;
  is_purchasable: boolean | null;
  is_exclusive: boolean | null;
  created_at: string | null;
}

interface Subscriber {
  user_id: string;
  created_at: string;
  display_name: string | null;
}

const categories = ["dance", "music", "food", "handicrafts"];

const AdminDashboard = () => {
  const { user, isAdmin, assignedState, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [content, setContent] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    image_url: "",
    video_url: "",
    recipe: "",
    price: "",
    is_purchasable: false,
    is_exclusive: false,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
      toast({ title: "Access denied", description: "Admin privileges required.", variant: "destructive" });
    }
  }, [authLoading, user, isAdmin]);

  const fetchContent = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("cultural_content")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setContent(data);
    setLoadingContent(false);
  };

  const fetchSubscribers = async () => {
    if (!user) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id, created_at")
      .eq("creator_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (subs && subs.length > 0) {
      const userIds = subs.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p.display_name || "Anonymous"; });

      setSubscribers(subs.map(s => ({
        user_id: s.user_id,
        created_at: s.created_at,
        display_name: profileMap[s.user_id] || "Anonymous",
      })));
    } else {
      setSubscribers([]);
    }
    setLoadingSubs(false);
  };

  const fetchRatings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("creator_ratings")
      .select("rating")
      .eq("creator_id", user.id);
    if (data && data.length > 0) {
      setAvgRating(Math.round((data.reduce((s, r) => s + r.rating, 0) / data.length) * 10) / 10);
      setTotalRatings(data.length);
    }
  };

  useEffect(() => {
    if (isAdmin && user) {
      fetchContent();
      fetchSubscribers();
      fetchRatings();
    }
  }, [isAdmin, user]);

  const resetForm = () => {
    setForm({ category: "", title: "", description: "", image_url: "", video_url: "", recipe: "", price: "", is_purchasable: false, is_exclusive: false });
    setEditingId(null);
    setShowForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") setUploadingImage(true);
    else setUploadingVideo(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("content_media")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage.from("content_media").getPublicUrl(filePath);
      if (type === "image") {
        setForm(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setForm(prev => ({ ...prev, video_url: publicUrl }));
      }
      toast({ title: "Upload successful ✅" });
    }

    if (type === "image") setUploadingImage(false);
    else setUploadingVideo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // However, assignedState is available from useAuth! Let's pull it from the context hook vars above.
    const payload = {
      state_name: assignedState || "India",
      category: form.category,
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      recipe: form.recipe || null,
      price: form.price ? parseFloat(form.price) : null,
      is_purchasable: form.is_purchasable,
      is_exclusive: form.is_exclusive,
      created_by: user!.id,
    };

    if (editingId) {
      const { error } = await supabase.from("cultural_content").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Content updated ✅" });
    } else {
      const { error } = await supabase.from("cultural_content").insert(payload);
      if (error) { toast({ title: "Create failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Content created ✅" });
    }
    resetForm();
    fetchContent();
  };

  const handleEdit = (item: ContentItem) => {
    setForm({
      category: item.category,
      title: item.title,
      description: item.description || "",
      image_url: item.image_url || "",
      video_url: item.video_url || "",
      recipe: item.recipe || "",
      price: item.price?.toString() || "",
      is_purchasable: item.is_purchasable || false,
      is_exclusive: item.is_exclusive || false,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cultural_content").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Content deleted 🗑️" });
    fetchContent();
  };

  const toggleExclusive = async (item: ContentItem) => {
    const newVal = !item.is_exclusive;
    const { error } = await supabase.from("cultural_content").update({ is_exclusive: newVal }).eq("id", item.id);
    if (!error) {
      setContent(prev => prev.map(c => c.id === item.id ? { ...c, is_exclusive: newVal } : c));
      toast({ title: newVal ? "Marked as Exclusive 🔒" : "Made Public 🔓" });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Creator Dashboard</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {avgRating > 0 ? `${avgRating}/5 (${totalRatings})` : "No ratings yet"}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {subscribers.length} subscribers
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? "Cancel" : "Add Content"}
            </Button>
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="content">My Content</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              {showForm && (
                <Card className="glass-card border-border/30 mb-8">
                  <CardHeader>
                    <CardTitle className="text-foreground">{editingId ? "Edit Content" : "Add New Content"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="text-foreground">Category</Label>
                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                          <SelectTrigger className="mt-1 bg-background/50 border-border/50">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-foreground">Title</Label>
                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 bg-background/50 border-border/50 text-foreground" required />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-foreground">Description</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 bg-background/50 border-border/50 text-foreground" />
                      </div>
                      <div>
                        <Label className="text-foreground">Cover Image</Label>
                        <br/>
                        <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} disabled={uploadingImage} className="mt-1 flex-1 bg-background/50 border-border/50 text-foreground" />
                        {uploadingImage && <span className="text-xs text-primary mt-1 inline-block">Uploading...</span>}
                        {form.image_url && <span className="text-xs text-green-500 mt-1 inline-block block">Image attached ✅</span>}
                      </div>
                      <div>
                        <Label className="text-foreground">Video (Optional)</Label>
                        <br/>
                        <Input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, "video")} disabled={uploadingVideo} className="mt-1 flex-1 bg-background/50 border-border/50 text-foreground" />
                        {uploadingVideo && <span className="text-xs text-primary mt-1 inline-block">Uploading...</span>}
                        {form.video_url && <span className="text-xs text-green-500 mt-1 inline-block block">Video attached ✅</span>}
                      </div>
                      {form.category === "food" && (
                        <div className="md:col-span-2">
                          <Label className="text-foreground">Recipe</Label>
                          <Textarea value={form.recipe} onChange={(e) => setForm({ ...form, recipe: e.target.value })} className="mt-1 bg-background/50 border-border/50 text-foreground" rows={4} />
                        </div>
                      )}
                      <div>
                        <Label className="text-foreground">Price (₹)</Label>
                        <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 bg-background/50 border-border/50 text-foreground" />
                      </div>
                      <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center gap-3">
                          <Switch checked={form.is_purchasable} onCheckedChange={(v) => setForm({ ...form, is_purchasable: v })} />
                          <Label className="text-foreground">Available for purchase</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={form.is_exclusive} onCheckedChange={(v) => setForm({ ...form, is_exclusive: v })} />
                          <Label className="text-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Mark as Exclusive
                          </Label>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90">
                          {editingId ? "Update Content" : "Create Content"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card className="glass-card border-border/30">
                <CardHeader>
                  <CardTitle className="text-foreground">My Content ({content.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingContent ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : content.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No content yet. Click "Add Content" to get started.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Exclusive</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {content.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                            <TableCell className="text-muted-foreground">{item.state_name}</TableCell>
                            <TableCell className="capitalize text-muted-foreground">{item.category}</TableCell>
                            <TableCell className="text-muted-foreground">{item.price ? `₹${item.price}` : "—"}</TableCell>
                            <TableCell>
                              <button onClick={() => toggleExclusive(item)} className="cursor-pointer">
                                {item.is_exclusive ? (
                                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                    <Lock className="h-3 w-3 mr-1" /> Exclusive
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">Public</Badge>
                                )}
                              </button>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscribers">
              <Card className="glass-card border-border/30">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Users who CatchedUp with you
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSubs ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : subscribers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No subscribers yet. Keep creating amazing content!</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Subscribed On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscribers.map((sub) => (
                          <TableRow key={sub.user_id}>
                            <TableCell className="text-foreground font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold">
                                  {sub.display_name?.[0]?.toUpperCase() || "U"}
                                </div>
                                {sub.display_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(sub.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
