import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Utensils, Shirt, Drama, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStateBackground } from "@/data/stateBackgrounds";

const categories = [
  {
    key: "dance",
    label: "Dance",
    icon: Drama,
    description: "Explore traditional dance forms",
    gradient: "from-terracotta/20 to-terracotta/5",
    borderColor: "border-terracotta/30",
  },
  {
    key: "music",
    label: "Music",
    icon: Music,
    description: "Listen to folk & classical music",
    gradient: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
  },
  {
    key: "food",
    label: "Food & Recipes",
    icon: Utensils,
    description: "Discover authentic recipes",
    gradient: "from-emerald/20 to-emerald/5",
    borderColor: "border-emerald/30",
  },
  {
    key: "handicrafts",
    label: "Handicrafts",
    icon: Shirt,
    description: "Shop handcrafted products",
    gradient: "from-maroon/20 to-maroon/5",
    borderColor: "border-maroon/30",
  },
];

const StateExplorer = () => {
  const { stateName } = useParams();
  const navigate = useNavigate();
  const decodedState = decodeURIComponent(stateName || "");
  const bgImage = getStateBackground(decodedState);

  return (
    <div className="min-h-screen pt-20 relative">
      {/* State-specific background */}
      <div className="fixed inset-0 -z-10">
        <img
          src={bgImage}
          alt={`${decodedState} landscape`}
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Explore <span className="text-gradient-saffron">{decodedState}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Dive into the rich cultural heritage of {decodedState}. Choose a category to explore.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              onClick={() =>
                navigate(`/state/${encodeURIComponent(decodedState)}/${cat.key}`)
              }
              className={`glass-card-hover rounded-2xl p-8 text-left group cursor-pointer border ${cat.borderColor}`}
            >
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${cat.gradient} mb-4`}
              >
                <cat.icon className="h-7 w-7 text-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {cat.label}
              </h3>
              <p className="text-muted-foreground text-sm">{cat.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StateExplorer;
