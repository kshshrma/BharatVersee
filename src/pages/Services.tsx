import { motion } from "framer-motion";
import {
  Store, GraduationCap, Globe, Zap, Heart, Gamepad2, ShieldCheck,
} from "lucide-react";

const services = [
  {
    icon: Store,
    title: "State-Wise Cultural Marketplace",
    desc: "Each Indian state has its own store page showcasing handicrafts, food, and festival gift boxes. Support local artisans and regional pride.",
  },
  {
    icon: GraduationCap,
    title: "Cultural Learning Experiences",
    desc: "Learn from locals through folk dance tutorials, authentic recipes, and language workshops. Preserve living traditions through education.",
  },
  {
    icon: Globe,
    title: "Global Cultural Sharing Space",
    desc: "Share festival moments, traditional attire photos, and love for India from anywhere. Connect diaspora & global fans of Indian culture.",
  },
  {
    icon: Zap,
    title: '"CatchUp" Subscription',
    desc: "Subscribe to exclusive content from cultural creators — dance performances, music collections, secret recipes, and more.",
  },
  {
    icon: Heart,
    title: "Support Local Artisan Stories",
    desc: "Each product tells the artisan's story and offers direct support. Empower Indian creators and showcase real lives.",
  },
  {
    icon: Gamepad2,
    title: "Gamified Cultural Engagement",
    desc: "Earn badges for exploring states, learning recipes, and celebrating festivals. Make learning about India fun and rewarding.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Commerce & Buying",
    desc: "Only trusted sellers, fair profits, and eco-friendly packaging. Promote honest, responsible e-commerce.",
  },
];

const Services = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Our <span className="text-gradient-saffron">Services</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to explore, learn, and celebrate India's cultural wealth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card-hover rounded-2xl p-6 flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 self-start">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm flex-1">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
