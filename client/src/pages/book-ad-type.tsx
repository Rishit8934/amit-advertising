import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Layout, Image, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const AD_TYPES = [
  {
    id: "classified-text",
    icon: FileText,
    label: "Classified Text Ad",
    tagline: "Simple. Affordable. Effective.",
    description:
      "Pure text-based ads charged per word or per line. Perfect for personal and small business announcements.",
    features: [
      "Charged per word / per line",
      "Available in all 60+ newspapers",
      "28+ categories to choose from",
      "Enhancements: Bold, Colour, Border",
    ],
    examples: ["Matrimonial", "Property", "Recruitment", "Lost & Found", "Change of Name"],
    from: "₹35",
    unit: "/word",
    gradient: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50",
    border: "border-blue-200 hover:border-blue-400",
    badge: "Most Popular",
    badgeColor: "bg-blue-100 text-blue-700",
    iconBg: "bg-blue-500",
  },
  {
    id: "classified-display",
    icon: Layout,
    label: "Classified Display Ad",
    tagline: "Stand out with style.",
    description:
      "Text ads with enhanced formatting — logos, custom layout, and colour blocks. Higher visibility than plain classified.",
    features: [
      "Custom layout & formatting",
      "Logo or image inclusion",
      "Bold headlines & colour text",
      "Premium positions available",
    ],
    examples: ["Property Builders", "Education Institutes", "Business Launches", "Recruitment Drives"],
    from: "₹80",
    unit: "/word",
    gradient: "from-purple-500 to-fuchsia-600",
    lightBg: "bg-purple-50",
    border: "border-purple-200 hover:border-purple-400",
    badge: "Enhanced",
    badgeColor: "bg-purple-100 text-purple-700",
    iconBg: "bg-purple-500",
  },
  {
    id: "display",
    icon: Image,
    label: "Display Ad",
    tagline: "Maximum impact. Premium reach.",
    description:
      "Full-size graphic ads with custom artwork. Prime positions on front page, back page, or inside pages.",
    features: [
      "Full creative freedom",
      "Prime page placements",
      "National & regional reach",
      "Dedicated account manager",
    ],
    examples: ["Brand Campaigns", "Product Launches", "Corporate Events", "Government Notices"],
    from: "₹1,800",
    unit: "/line",
    gradient: "from-orange-500 to-rose-600",
    lightBg: "bg-orange-50",
    border: "border-orange-200 hover:border-orange-400",
    badge: "Premium",
    badgeColor: "bg-orange-100 text-orange-700",
    iconBg: "bg-orange-500",
  },
];

export default function BookAdType() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 40px,white 40px,white 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,white 40px,white 41px)",
          }}
        />

        <div className="relative container mx-auto px-4 pt-8 pb-4">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto pb-10"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold tracking-widest uppercase mb-4">
              Step 1 of 6
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Ad Type
              </span>
            </h1>
            <p className="text-slate-400 text-lg">
              Select the format that best fits your message and budget. You can book in 60+ newspapers
              across India.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Cards */}
      <motion.div
        className="container mx-auto px-4 pb-20"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {AD_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.id}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="cursor-pointer"
                onClick={() => setLocation(`/booking?adType=${type.id}`)}
              >
                <div
                  className={`relative h-full rounded-2xl bg-white border-2 ${type.border} transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden flex flex-col`}
                >
                  {/* Top gradient strip */}
                  <div className={`h-1.5 bg-gradient-to-r ${type.gradient}`} />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Icon + badge */}
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className={`w-14 h-14 rounded-2xl ${type.iconBg} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${type.badgeColor}`}>
                        {type.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-slate-800 mb-1">{type.label}</h2>
                    <p className={`text-xs font-semibold mb-3 bg-gradient-to-r ${type.gradient} bg-clip-text text-transparent`}>
                      {type.tagline}
                    </p>
                    <p className="text-slate-500 text-sm mb-5 leading-relaxed">{type.description}</p>

                    {/* Features */}
                    <ul className="space-y-2 mb-5 flex-1">
                      {type.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Examples */}
                    <div className={`${type.lightBg} rounded-xl p-3 mb-5`}>
                      <p className="text-xs text-slate-500 font-medium mb-2">Popular categories:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {type.examples.map((ex) => (
                          <span
                            key={ex}
                            className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-slate-600 border border-slate-200"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pricing + CTA */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400">Starting from</span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-2xl font-bold text-slate-800">{type.from}</span>
                          <span className="text-sm text-slate-500">{type.unit}</span>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm font-semibold bg-gradient-to-r ${type.gradient} bg-clip-text text-transparent`}
                      >
                        Book Now <ArrowRight className="h-4 w-4 text-current" style={{ color: "inherit" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-slate-500 text-sm mt-10"
        >
          Not sure which to choose?{" "}
          <span className="text-slate-300 font-medium">
            Classified Text is best for most personal needs. Classified Display adds more visibility.
            Display is for brands.
          </span>
        </motion.p>
      </motion.div>
    </div>
  );
}
