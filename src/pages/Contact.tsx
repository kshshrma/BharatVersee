import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Get in <span className="text-gradient-saffron">Touch</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Have questions? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-xl p-5 flex items-start gap-4">
              <Mail className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <p className="text-muted-foreground text-sm">hello@bharatverse.in</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 flex items-start gap-4">
              <Phone className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold text-foreground">Phone</p>
                <p className="text-muted-foreground text-sm">+91 98765 43210</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 flex items-start gap-4">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="font-semibold text-foreground">Address</p>
                <p className="text-muted-foreground text-sm">New Delhi, India</p>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6 space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              placeholder="Your Name"
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
            />
            <Input
              placeholder="Your Email"
              type="email"
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
            />
            <Textarea
              placeholder="Your Message"
              rows={4}
              className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
            />
            <Button className="w-full bg-gradient-saffron text-primary-foreground hover:opacity-90">
              Send Message
            </Button>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
