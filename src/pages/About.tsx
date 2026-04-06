import { motion } from "framer-motion";
import { Heart, Globe, Users, Sparkles } from "lucide-react";

const values = [
  { icon: Heart, title: "Preserve Heritage", desc: "We safeguard centuries-old traditions by bringing them to the digital world." },
  { icon: Globe, title: "Connect Communities", desc: "Bridging Indian diaspora and culture enthusiasts worldwide." },
  { icon: Users, title: "Empower Artisans", desc: "Direct support to local creators, craftsmen, and performers." },
  { icon: Sparkles, title: "Inspire Discovery", desc: "Making cultural exploration fun, accessible, and rewarding." },
];

const About = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            About <span className="text-gradient-saffron">BharatVerse</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            BharatVerse is a celebration of India — its colors, rhythms, flavors, and crafts.
            We're building a digital bridge between timeless traditions and modern technology,
            enabling anyone, anywhere to explore, learn, and support India's incredible cultural mosaic.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card-hover rounded-2xl p-6"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <v.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">{v.title}</h3>
              <p className="text-muted-foreground text-sm">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center glass-card rounded-2xl p-10 max-w-2xl mx-auto"
        >
          <p className="font-display text-xl italic text-foreground mb-4">
            "India is not just a country — it's a universe of stories waiting to be told."
          </p>
          <p className="text-muted-foreground text-sm">— The BharatVerse Team</p>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
