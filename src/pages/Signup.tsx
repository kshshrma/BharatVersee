import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { indianStates } from "@/data/states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [selectedState, setSelectedState] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "admin" && !selectedState) {
      toast({ title: "Please select a state", description: "Creators must choose their state.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name, 
          role: role,
          selected_role: role,
          assigned_state: role === "admin" ? selectedState : null
        } 
      },
    });

    if (error) {
      setLoading(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }

    setLoading(false);
    toast({ title: "Account created! 🎉", description: `You are now signed in as ${role === "admin" ? "Creator" : "Explorer"}.` });
    navigate("/");
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Join BharatVerse</h1>
          <p className="text-muted-foreground">Create your account to start exploring</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-foreground">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="mt-1 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground" required />
          </div>
          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="mt-1 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground" required />
          </div>
          <div>
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="mt-1 bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground" required minLength={6} />
          </div>
          <div>
            <Label className="text-foreground">I am a</Label>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setRole("user")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === "user" ? "bg-gradient-saffron text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}>
                Explorer (User)
              </button>
              <button type="button" onClick={() => setRole("admin")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === "admin" ? "bg-gradient-saffron text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}>
                Creator (Admin)
              </button>
            </div>
          </div>

          {role === "admin" && (
            <div>
              <Label className="text-foreground">Your State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="mt-1 bg-background/50 border-border/50 text-foreground">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">All your content will be posted under this state.</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-gradient-saffron text-primary-foreground hover:opacity-90">
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
