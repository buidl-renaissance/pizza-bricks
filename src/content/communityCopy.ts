export const COMMUNITY_META = {
  title: "Pizza Bricks — Build the Future of Pizza",
  description: "Collect slices. Stack bricks. Own the shop. A Pizza DAO × Renaissance City experiment.",
};

export const COMMUNITY_NAVBAR = {
  logo: "Pizza Bricks",
  nav: [
    { label: "Build", href: "#how" },
    { label: "Why", href: "#why" },
    { label: "Owners", href: "#owners" },
    { label: "FAQ", href: "#faq" },
    { label: "Apply", href: "/business" },
  ],
  cta: "Join the Pod",
};

export const COMMUNITY_HERO = {
  badge: "🍕 Pizza DAO × Renaissance City",
  headlineLine1: "Build the",
  headlineLine2: "Future",
  headlineAccent: "of Pizza.",
  subcopy: "Collect slices. Stack bricks. Own the shop.",
  ctaPrimary: "🍕 Join the Builders",
  ctaSecondary: "🧱 Partner Your Pizzeria",
  cities: [
    { emoji: "🏙️", name: "Detroit" },
    { emoji: "🏔️", name: "Denver" },
    { emoji: "🗽", name: "NYC" },
  ],
  citiesNote: "+ More cities coming",
  scrollHint: "Scroll to explore",
  heroImageAlt: "Floating pizza slice and glowing brick over a pizzeria",
  statChip1Value: "1,247",
  statChip1Label: "Bricks Stacked",
  statChip2Value: "3 Cities",
  statChip2Label: "Build Zones Active",
};

export const COMMUNITY_HOW_IT_WORKS = {
  label: "HOW IT WORKS",
  title: "Three Steps to Own",
  steps: [
    { icon: "🍕", number: "01", title: "Collect Own", description: "Visit local shops. Find floating slices. Unlock rewards." },
    { icon: "🧱", number: "02", title: "Stack Bricks", description: "Earn bricks by exploring, attending events, inviting friends." },
    { icon: "🏪", number: "03", title: "Build & Grow", description: "When the community stacks enough bricks — a pizzeria unlocks." },
  ],
  progressStart: "Start Here!",
  progressEnd: "Your City.",
};

export const COMMUNITY_WHY_PIZZA = {
  label: "WHY PIZZA?",
  title: "Pizzerias are community anchors.",
  cards: [
    { icon: "👥", title: "Grow your impact", body: "The best pizza spots have always been gathering places. Every neighborhood knows them by name." },
    { icon: "🌐", title: "Powered by IRL", body: "Connect the brick stack to real-world ownership. Local shops, real rewards." },
    { icon: "🔑", title: "Own It", body: "What if the community helped change that? One slice, one brick, one shop at a time." },
  ],
};

export const COMMUNITY_WHEN_WE_BUILD = {
  label: "100%",
  title: "What Happens at 100%?",
  subtitle: "Here's what unlocks once a city is fully funded by the community.",
  rewards: [
    { icon: "🍕", label: "Pizza Rewards", description: "Community celebration and rewards at the new shop" },
    { icon: "🎙️", label: "Podcast Access", description: "Exclusive content and behind-the-scenes access" },
    { icon: "🏆", label: "The Local Stage", description: "Your name on the wall — forever" },
    { icon: "🧪", label: "New Community Labs", description: "Shape how the community builds next" },
  ],
  footnote: "And in time, bricks may evolve into something even more powerful. 🌱",
};

export const COMMUNITY_POWERED_BY = {
  label: "POWERED BY",
  title: "Renaissance City",
  body: "We believe in building a future where everyone can participate in the growth of their local communities.",
  learnMoreHref: "#",
  learnMoreLabel: "Learn More",
  features: [
    { icon: "👥", title: "Community Ownership", description: "Own a piece of what you love." },
    { icon: "🏗️", title: "Shared Infrastructure", description: "Sustainable funding from the ground up." },
    { icon: "📈", title: "Economic Growth", description: "What starts in one city can spread everywhere." },
    { icon: "🌆", title: "Smart City Operations", description: "Web3-native tools for local communities." },
  ],
};

export const COMMUNITY_CITIES = {
  label: "Cities",
  title: "Cities Building Now",
  subtitle: "Discover active build zones and join the community.",
  cities: [
    { name: "NYC", flag: "🗽", owners: "147 Owners", bricks: "1,247 Bricks", progress: 68, joinHref: "/#join-pod" },
    { name: "Miami", flag: "🌴", owners: "89 Owners", bricks: "892 Bricks", progress: 45, joinHref: "/#join-pod" },
    { name: "LA", flag: "🌴", owners: "62 Owners", bricks: "612 Bricks", progress: 28, joinHref: "/#join-pod" },
  ],
  yourCity: { name: "New City?", flag: "+", status: "Suggest a New City", cta: "Suggest a New City", ctaBody: "Think your city deserves a build zone? Let's talk." },
};

export const COMMUNITY_FOR_OWNERS = {
  label: "FOR PIZZERIA OWNERS",
  title: "Want to Own Your Bricks?",
  body: "Discover how to become a brick owner and join our growing community.",
  ctaPrimary: "⚡️ Join the Waitlist",
  ctaSecondary: "📈 Partner with Teams",
  benefits: [
    { icon: "❤️", title: "Own Real Estate", text: "Build equity in real-world locations you care about." },
    { icon: "💰", title: "Earn Passive Income", text: "Share in the success of community-owned pizzerias." },
    { icon: "🎁", title: "Community Perks", text: "Exclusive rewards, events, and governance rights." },
  ],
};

export const COMMUNITY_FAQ = {
  label: "FAQ",
  title: "Got Questions?",
  items: [
    { q: "Is this a token sale?", a: "No. This is a game and community experiment. No financial instruments, no token offerings." },
    { q: "Do bricks represent ownership?", a: "Not yet. They represent participation, contribution, and community standing. What they evolve into is up to us — together." },
    { q: "Will this evolve?", a: "Yes. Carefully. We're building a foundation, not a financial product. Every step forward is decided with the community." },
    { q: "How do I earn bricks?", a: "Visit local participating pizzerias, attend community events, refer friends, and complete in-app challenges." },
    { q: "When does Pizza Bricks launch?", a: "We're in early builder access now. Sign up to be among the first to shape how this thing gets built." },
  ],
};

export const COMMUNITY_FINAL_CTA = {
  title: "Let's Build ",
  titleAccent: "Something Real.",
  subtitle: "We are a team of builders, dreamers, and pizza enthusiasts committed to building a better future.",
  buttons: [
    { label: "⚡️ Join the Waitlist", href: "/#join-pod", variant: "primary" as const },
    { label: "📦 Order a Pizza", href: "#", variant: "outline" as const },
    { label: "🍕 Partner with Us", href: "/business", variant: "accent" as const },
  ],
  links: [
    { label: "Discord", href: "#" },
    { label: "Twitter/X", href: "#" },
    { label: "Pizza DAO", href: "#" },
    { label: "Renaissance City", href: "#" },
  ],
};

export const COMMUNITY_FOOTER = {
  logo: "Pizza Bricks",
  columns: [
    { title: "Product", links: [{ label: "How It Works", href: "#how" }, { label: "Cities", href: "#cities" }, { label: "For Owners", href: "#owners" }, { label: "FAQ", href: "#faq" }] },
    { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }] },
    { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
    { title: "Connect", links: [{ label: "Discord", href: "#" }, { label: "Twitter", href: "#" }] },
  ],
  copyright: "© 2026 Pizza Bricks. All rights reserved.",
};
