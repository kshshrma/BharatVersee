import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginAs, setLoginAs] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }

    // Verify the user's role matches what they selected
    if (data.user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const actualRole = data.user.user_metadata?.role || data.user.user_metadata?.selected_role || profileData?.role || "user";
      if (actualRole !== loginAs) {
        await supabase.auth.signOut();
        setLoading(false);
        toast({
          title: "Wrong login type",
          description: `This account is registered as ${actualRole === "admin" ? "Creator (Admin)" : "Explorer (User)"}. Please select the correct login type.`,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(false);
    toast({ title: `Welcome back, ${loginAs === "admin" ? "Creator" : "Explorer"}! 🎉` });
    navigate(loginAs === "admin" ? "/admin" : "/");
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Login to your BharatVerse account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label className="text-foreground">Login as</Label>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setLoginAs("user")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  loginAs === "user"
                    ? "bg-gradient-saffron text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Explorer (User)
              </button>
              <button
                type="button"
                onClick={() => setLoginAs("admin")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  loginAs === "admin"
                    ? "bg-gradient-saffron text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Creator (Admin)
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-saffron text-primary-foreground hover:opacity-90"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {loading ? "Logging in..." : `Login as ${loginAs === "admin" ? "Creator" : "Explorer"}`}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
