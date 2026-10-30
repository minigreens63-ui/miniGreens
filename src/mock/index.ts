import { Product, Category, Banner, LifestyleArticle, Testimonial } from '../types';

// Product images
const wheatgrassImg = require('../assets/wheatgrass.png');
const whiteRadishImg = require('../assets/whiteraddish.png');
const redRadishImg = require('../assets/redraddish.png');
const beetrootImg = require('../assets/beetroot.png');
const bokChoyImg = require('../assets/bokchoy.png');
const sunflowerImg = require('../assets/sunflowershoots.png');
const redCabbageImg = require('../assets/redcabbage.png');
const strawberryBananaImg = require('../assets/strawberry-banana.png');
const mangoFreshImg = require('../assets/Mango Fresh.png');
const chocChillImg = require('../assets/choco-chill.png');
const papayaGlowImg = require('../assets/papaya-glow.png');
const mintMelonImg = require('../assets/mint-melon.png');
const carrotLemonJuiceImg = require('../assets/carrot-lemon-juice.png');
const cucumberSplashImg = require('../assets/cucumber-splash.png');
const appleSproutImg = require('../assets/apple-sprout.png');
const sweetLimeImg = require('../assets/sweet-lime.png');
const watermelonFreshImg = require('../assets/watermelon-fresh.png');
const mustardImg = require('../assets/mustard.jpeg');
const fenugreekImg = require('../assets/fenugreek.png');
const broccoliImg = require('../assets/broccoli.png');
const arugulaImg = require('../assets/arugula.png');
const turnipImg = require('../assets/turnip.png');
const redAmaranthImg = require('../assets/red-amaranth.png');
const heroBannerImg = require('../assets/bannerpic.jpeg');

// Lifestyle article imagery — light, sunlit photography (matches webapp's Journal
// section) instead of the dark-background product-shot photos used elsewhere.
const articleColdPressedImg = require('../assets/article-cold-pressed.png');
const articleSmoothieVsJuiceImg = require('../assets/article-smoothie-vs-juice.png');
const articleMorningRitualsImg = require('../assets/article-morning-rituals.png');
const articleSustainableSippingImg = require('../assets/article-sustainable-sipping.png');

// SVG placeholder generator - works without network
function avatarPh(name: string): string {
  const s = name[0]?.toUpperCase() || '?';
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="100" fill="%236f8f4a"/><text x="100" y="125" text-anchor="middle" fill="white" font-size="80" font-weight="bold" font-family="system-ui">${s}</text></svg>`;
}
function bannerPh(title: string): string {
  const t = title.replace(/["<>&]/g, '');
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%235a7539"/><stop offset="100%" stop-color="%236f8f4a"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/><rect x="30" y="30" width="1140" height="540" rx="24" fill="rgba(255,255,255,0.08)"/><text x="80" y="300" fill="rgba(255,255,255,0.12)" font-size="200" font-weight="bold" font-family="system-ui">🌿</text><text x="600" y="260" text-anchor="middle" fill="white" font-size="52" font-weight="bold" font-family="system-ui">${t}</text><text x="600" y="340" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="24" font-family="system-ui">Premium wellness, delivered fresh</text></svg>`;
}

// NOTE: `categories` and `products` now come from Supabase via `src/services/catalog.ts`
// (TASK_PLAN.md T1). The remaining exports below are still mock-only (T11 covers them).

export const banners: Banner[] = [
  { id: 'banner-1', title: '', subtitle: '', image: heroBannerImg as any, cta: 'Shop Now', ctaLink: '/explore', textColor: '#FFFFFF', gradientStart: '#5a7539', gradientEnd: '#6f8f4a' },
  { id: 'banner-2', title: 'Summer Cooler Collection', subtitle: 'Beat the heat with our refreshing mint melon & watermelon specials', image: bannerPh('Summer Coolers'), cta: 'Explore Juices', ctaLink: '/category/smoothies', textColor: '#FFFFFF', gradientStart: '#FF8F00', gradientEnd: '#FFC107' },
  { id: 'banner-3', title: 'Start Your Wellness Journey', subtitle: 'Subscribe and save up to 15% on every order', image: bannerPh('Start Your Journey'), cta: 'Learn More', ctaLink: '/subscriptions', textColor: '#FFFFFF', gradientStart: '#00BFA5', gradientEnd: '#6f8f4a' },
];

export const lifestyleArticles: LifestyleArticle[] = [
  {
    id: 'article-1',
    slug: 'why-cold-pressed-juice-is-a-game-changer',
    title: 'Why Cold-Pressed Juice is a Game Changer',
    excerpt: 'Discover how our cold-press process preserves nutrients and flavor better than traditional juicing.',
    image: articleColdPressedImg as any,
    category: 'Wellness',
    readTime: '5 min',
    author: 'Dr. Anjali Rao',
    publishedAt: '2026-08-12',
    content: [
      { body: 'Most supermarket juice is made with a centrifugal juicer — a fast-spinning blade that shreds produce and flings the juice out through a mesh. It is quick and cheap, but that speed comes at a cost: the blade generates heat and whips air into the juice, and both heat and oxygen break down the delicate enzymes and vitamins you are drinking juice for in the first place.' },
      { heading: 'How cold-pressing is different', body: 'A hydraulic cold-press works in two slow stages. First the fruit and vegetables are ground into a fine pulp. Then thousands of pounds of pressure squeeze that pulp against a filter cloth, extracting the juice without ever spinning it or heating it. No blade, almost no oxidation, no added heat.' },
      { heading: 'What that means for you', body: 'Cold-pressed juice holds on to noticeably more vitamin C, folate and plant enzymes, and because it is not aerated it separates less and tastes brighter. Independent lab comparisons routinely show cold-pressed juice retaining 3 to 5 times more of certain micronutrients than centrifugal juice pressed from the same produce.' },
      { heading: 'The trade-off', body: 'Cold-pressing is slower, wastes less but costs more per bottle, and the juice has a short shelf life — it is a fresh food, not a shelf-stable product. That is why we press in small batches every morning and deliver the same day. Keep it refrigerated and drink it within 48 hours for the full benefit.' },
      { heading: 'Bottom line', body: 'If you are buying juice for nutrition rather than just sugar and flavour, the extraction method matters more than the fruit on the label. Cold-pressed is the closest you can get to eating the produce itself.' },
    ],
  },
  {
    id: 'article-2',
    slug: 'smoothies-vs-juices-which-is-better',
    title: 'Smoothies vs Juices: Which is Better?',
    excerpt: 'Understanding the difference so you can pick what your body needs.',
    image: articleSmoothieVsJuiceImg as any,
    category: 'Nutrition',
    readTime: '4 min',
    author: 'Meera Nair',
    publishedAt: '2026-08-05',
    content: [
      { body: 'People use "juice" and "smoothie" almost interchangeably, but nutritionally they are very different drinks that suit different goals.' },
      { heading: 'Juice: concentrated nutrition, no fibre', body: 'Juicing removes the insoluble fibre and leaves you with water, sugars, vitamins and minerals in a form the body absorbs almost instantly. That makes juice a great fast delivery of micronutrients — a "wellness shot" — but the lack of fibre means the natural sugars hit your bloodstream quickly. Best on an empty stomach, in modest amounts.' },
      { heading: 'Smoothies: whole food in a glass', body: 'A smoothie blends the entire fruit or vegetable, fibre included. That fibre slows sugar absorption, keeps you full for hours, and feeds your gut bacteria. Add protein or healthy fat and a smoothie becomes a genuine meal replacement.' },
      { heading: 'Which should you choose?', body: 'Reach for a juice when you want a light, nutrient-dense pick-me-up between meals. Reach for a smoothie when you want something filling — breakfast, a post-workout refuel, or a meal you can drink on a busy day.' },
      { body: 'Neither is "healthier" in the abstract. The right choice depends on whether you need fuel or a nutrient top-up in that moment.' },
    ],
  },
  {
    id: 'article-3',
    slug: 'morning-rituals-for-a-healthier-you',
    title: 'Morning Rituals for a Healthier You',
    excerpt: 'Simple routines that transform your energy and focus — starting with the right breakfast drink.',
    image: articleMorningRitualsImg as any,
    category: 'Lifestyle',
    readTime: '6 min',
    author: 'Kabir Menon',
    publishedAt: '2026-07-28',
    content: [
      { body: 'How you spend the first thirty minutes after waking sets the tone for the whole day. You do not need an elaborate routine — just a few small, repeatable habits.' },
      { heading: 'Hydrate before caffeine', body: 'You wake up mildly dehydrated after 7 to 8 hours without water. A large glass of water — or a light, low-sugar juice like sweet lime or cucumber — rehydrates you and gently wakes the digestive system before coffee does.' },
      { heading: 'Get light on your face', body: 'Ten minutes of daylight within an hour of waking anchors your circadian rhythm, which improves both daytime alertness and that night\'s sleep. Step onto a balcony with your drink instead of scrolling in bed.' },
      { heading: 'Eat protein early', body: 'A protein-forward breakfast — a smoothie with nuts or yoghurt, for example — blunts mid-morning cravings and keeps energy steady. Sugary breakfasts spike and crash.' },
      { heading: 'Move for five minutes', body: 'Not a workout — just light movement. A short walk or a few stretches raises your core temperature and circulation, which sharpens focus far more reliably than a second coffee.' },
      { body: 'Pick one of these and do it every day for two weeks before adding the next. Consistency beats intensity.' },
    ],
  },
  {
    id: 'article-4',
    slug: 'sustainable-sipping-good-for-you-good-for-earth',
    title: 'Sustainable Sipping: Good for You, Good for Earth',
    excerpt: 'How choosing fresh, local ingredients helps the planet while nourishing your body.',
    image: articleSustainableSippingImg as any,
    category: 'Sustainability',
    readTime: '3 min',
    author: 'Tara Iyer',
    publishedAt: '2026-07-15',
    content: [
      { body: 'The environmental footprint of a drink is decided long before it reaches your glass — in how the produce was grown, how far it travelled, and what it is served in.' },
      { heading: 'Local and seasonal cuts transport emissions', body: 'Produce that is grown nearby and in season needs no long-haul refrigerated freight and no energy-intensive cold storage for months. Buying what is in season is one of the simplest ways to lower the carbon cost of what you eat and drink.' },
      { heading: 'Microgreens are remarkably efficient', body: 'Because they are harvested in 7 to 14 days, microgreens use a fraction of the water, land and fertiliser of mature vegetables while delivering a higher concentration of nutrients per gram.' },
      { heading: 'Packaging is the easy win', body: 'We deliver in recyclable glass and compostable trays and take the glass back to reuse it. Choosing refill and return over single-use plastic removes the part of a drink\'s footprint that lingers longest.' },
      { body: 'Small, repeated choices — seasonal produce, reusable packaging, minimal waste — add up faster than any single grand gesture.' },
    ],
  },
];

export const testimonials: Testimonial[] = [
  { id: 'test-1', name: 'Priya Sharma', avatar: avatarPh('P'), role: 'Wellness Coach', content: 'MiniGreens juices are my daily go-to. The Mango Fresh is absolutely divine — tastes like real Alphonso mangoes!', rating: 5 },
  { id: 'test-2', name: 'Rohan Mehta', avatar: avatarPh('R'), role: 'Fitness Enthusiast', content: 'The Choco Chill changed my post-workout game. Tastes like dessert but packed with protein. I\'m hooked.', rating: 5 },
  { id: 'test-3', name: 'Ananya Patel', avatar: avatarPh('A'), role: 'Busy Mom', content: 'Finally, healthy drinks my kids actually love! The Apple Sprout and Strawberry Banana Glow are household favorites.', rating: 5 },
  { id: 'test-4', name: 'Vikram Rao', avatar: avatarPh('V'), role: 'Chef', content: 'As a chef, I appreciate the freshness. The Carrot, Lemon & Radish Microgreens Juice is bold and beautifully balanced.', rating: 5 },
];

const onboardingBerryImg = require('../assets/onboarding-berry.jpg');
const onboardingMangoImg = require('../assets/onboarding-mango.jpg');
const onboardingGreenImg = require('../assets/onboarding-green.jpg');

export type OnboardingFeature = { icon: string; title: string; description?: string };

export const onboardingSlides: {
  id: string;
  title: string;
  accent?: string;
  subtitle: string;
  image: number;
  featureStyle: 'rows' | 'cards';
  features: OnboardingFeature[];
}[] = [
  {
    id: 'onboard-1',
    title: 'Sip Fresh, Live Well',
    subtitle:
      "India's first microgreens brand. Premium cold-pressed juices, crafted fresh daily and delivered straight to your door.",
    image: onboardingBerryImg,
    featureStyle: 'rows',
    features: [
      { icon: 'leaf-outline', title: 'Crafted Fresh Daily', description: 'Made every morning with care.' },
      { icon: 'nutrition-outline', title: 'Premium Quality', description: 'High-quality ingredients in every sip.' },
      { icon: 'car-outline', title: 'Delivered to You', description: 'Fast, reliable delivery to your doorstep.' },
    ],
  },
  {
    id: 'onboard-2',
    title: '100% Natural Goodness',
    subtitle:
      'Every drink is made from handpicked fruits and vegetables. No added sugar. No preservatives. Just pure, delicious nutrition.',
    image: onboardingMangoImg,
    featureStyle: 'cards',
    features: [
      { icon: 'leaf-outline', title: 'No Added Sugar' },
      { icon: 'flask-outline', title: 'No Preservatives' },
      { icon: 'nutrition-outline', title: 'Real Ingredients' },
    ],
  },
  {
    id: 'onboard-3',
    title: 'Your Daily Wellness',
    subtitle:
      'From cold-pressed juices to microgreen teas, discover delicious ways to nourish your body every day.',
    image: onboardingGreenImg,
    featureStyle: 'rows',
    features: [
      { icon: 'leaf-outline', title: 'Made Fresh Daily' },
      { icon: 'water-outline', title: '100% Natural' },
      { icon: 'car-outline', title: 'Delivered to You' },
    ],
  },
];

export const whyChooseUs = [
  { id: 'why-1', title: 'Made Fresh Daily', description: 'Every juice is prepared fresh each morning and delivered same-day for peak flavor and nutrition.', icon: 'sunny' },
  { id: 'why-2', title: '100% Natural', description: 'No added sugar, no preservatives, no artificial flavors. Just real fruits and vegetables in every sip.', icon: 'leaf' },
  { id: 'why-3', title: 'Cold-Pressed Goodness', description: 'Our hydraulic cold-press process preserves maximum nutrients and natural taste.', icon: 'thermometer' },
  { id: 'why-4', title: 'Sustainable Packaging', description: '100% recyclable glass bottles. Because loving your health should never cost the planet.', icon: 'sync' },
];
