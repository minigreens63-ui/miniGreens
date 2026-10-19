import { SEO_JOURNAL_POSTS } from "./journal-seo-posts";

export type JournalCategory = "Nutrition" | "Kitchen" | "Farm";

export type JournalBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] };

export type JournalPost = {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  category: JournalCategory;
  excerpt: string;
  image: string;
  imageAlt: string;
  body: JournalBlock[];
};

export const JOURNAL_CATEGORIES: JournalCategory[] = ["Nutrition", "Kitchen", "Farm"];

// Newest first; the first post is featured at the top of the journal page.
const BRAND_POSTS: JournalPost[] = [
  {
    slug: "why-we-set-out-to-build-indias-first-microgreens-brand",
    title: "Why We Set Out To Build India's First Microgreens Brand",
    date: "29 September 2026",
    readTime: "4 min read",
    category: "Farm",
    excerpt:
      "Mini Greens started with a personal search for real, fresh nutrition in a busy city. Here is how that turned into India's first microgreens brand.",
    image: "/images/journal/broccoli-microgreens.webp",
    imageAlt: "A bowl of fresh microgreens on a sunlit counter",
    body: [
      {
        type: "p",
        text: "Mini Greens was born from a simple personal struggle: finding real, fresh nutrition in the middle of a busy city life. That search led to microgreens, and to a fascination with modern, efficient agriculture.",
      },
      { type: "h2", text: "From a curiosity to a brand" },
      {
        type: "p",
        text: "Two founders, Anand Lal S S and Keerthi Krishnakumar Nair, set out to make fresh microgreens part of everyday living. We began supplying across Bangalore, partnering with platforms like Organic Mandya to reach customers.",
      },
      { type: "h2", text: "What being first means to us" },
      {
        type: "p",
        text: "We take it as a responsibility: to grow clean, cut to order, and make microgreens something every Indian kitchen can trust. Today that includes fresh trays, microgreen teas and a partner network that helps small growers reach the market.",
      },
      {
        type: "list",
        items: [
          "Grown indoors, without pesticides.",
          "Cut fresh and delivered, never sitting in a warehouse.",
          "Backed by a network of partner growers working to one quality standard.",
        ],
      },
    ],
  },
  {
    slug: "why-microgreens-beat-full-grown-vegetables",
    title: "Why Microgreens Beat Full-Grown Vegetables",
    date: "12 July 2026",
    readTime: "5 min read",
    category: "Nutrition",
    excerpt:
      "A handful of broccoli microgreens carries a concentration of sulforaphane you would struggle to match with a whole head of broccoli. Here's what the research actually says.",
    image: "/images/journal/broccoli-microgreens.webp",
    imageAlt: "A bowl of broccoli microgreens beside a whole head of broccoli on a sunlit counter",
    body: [
      {
        type: "p",
        text: "It sounds like a marketing line until you look at the numbers: several studies out of the University of Maryland and Penn State have measured microgreens at four to forty times the concentration of key vitamins and antioxidants found in their mature-vegetable counterparts, gram for gram. Broccoli microgreens are the most studied example, and the one we get asked about most.",
      },
      {
        type: "h2",
        text: "The sulforaphane question",
      },
      {
        type: "p",
        text: "Sulforaphane is the compound behind broccoli's reputation as a cancer-fighting food, and it's produced when the enzyme myrosinase reacts with a precursor called glucoraphanin. Young broccoli plants — harvested at 7 to 10 days, before they've spent energy building stems and leaves — carry a much higher concentration of glucoraphanin per gram than a full head of broccoli ever will. That's not a growing trick; it's just where the plant puts its resources early on.",
      },
      {
        type: "p",
        text: "The same pattern shows up elsewhere. Red cabbage microgreens test higher in vitamin C and anthocyanins than mature red cabbage. Cilantro microgreens carry more beta-carotene. It isn't universal — some nutrients still concentrate as a plant matures — but for the crops we grow, the young stage consistently wins on density.",
      },
      {
        type: "h2",
        text: "Why this matters for how you eat",
      },
      {
        type: "p",
        text: "Nobody eats a kilogram of broccoli in one sitting, but a tablespoon of microgreens folded into eggs, a sandwich, or a bowl of dal is an easy daily habit. Because the density is so much higher, a small, consistent amount does real work — which is the whole idea behind growing them the way we do: cut to order, delivered within a day, so the nutrients you're reading about are still mostly intact by the time they reach your kitchen.",
      },
      {
        type: "p",
        text: "We're not claiming microgreens replace vegetables — fibre, volume, and variety still matter, and a diet of garnish-sized portions isn't a diet. But as a concentrated, low-effort addition to what you're already eating, the research backs up the hype.",
      },
    ],
  },
  {
    slug: "keeping-your-greens-alive-for-a-week",
    title: "Keeping Your Greens Alive For A Week",
    date: "28 June 2026",
    readTime: "4 min read",
    category: "Kitchen",
    excerpt:
      "Most people lose their greens to condensation, not time. A paper towel and the right shelf in your fridge will get you three extra days.",
    image: "/images/journal/keep-fresh.webp",
    imageAlt: "A glass container of fresh microgreens on a folded paper towel on a fridge shelf",
    body: [
      {
        type: "p",
        text: "The most common message we get from customers is some version of \"my greens went slimy in two days.\" It's almost never the greens' fault — it's condensation. Microgreens are mostly water and very thin-walled, so any trapped moisture against the leaf turns into rot within hours.",
      },
      {
        type: "h2",
        text: "The paper towel fix",
      },
      {
        type: "p",
        text: "Line the container your greens arrive in — or a fresh airtight box — with a dry paper towel before you put the greens back in, and lay a second sheet loosely over the top. The towel pulls ambient moisture away from the leaves instead of letting it sit against them. Swap the towel once if it feels damp after day two or three; that's normal and means it's doing its job.",
      },
      {
        type: "h2",
        text: "Where they go in the fridge",
      },
      {
        type: "list",
        items: [
          "Middle shelf, not the door — door shelves swing through temperature every time it opens.",
          "Away from fruit — apples, bananas, and tomatoes release ethylene gas, which speeds up wilting in leafy greens.",
          "Not touching the back wall — that's usually the coldest point and can lightly freeze the leaf edges.",
        ],
      },
      {
        type: "p",
        text: "Don't wash before storing. Water on the leaf surface before it's needed is exactly the condensation problem you're trying to avoid — rinse only the portion you're about to eat, right before you eat it.",
      },
      {
        type: "p",
        text: "Done this way, most of our varieties hold well past a week. Pea shoots and sunflower shoots are the most forgiving; radish and mustard microgreens are more delicate and are best used within four to five days regardless of storage.",
      },
    ],
  },
  {
    slug: "five-ways-we-use-pea-shoots-at-home",
    title: "Five Ways We Use Pea Shoots At Home",
    date: "14 June 2026",
    readTime: "6 min read",
    category: "Kitchen",
    excerpt:
      "Beyond the salad bowl: folded into an omelette, wilted through hot dal, blitzed into a pesto that keeps for a fortnight.",
    image: "/images/journal/pea-shoots.webp",
    imageAlt: "A golden omelette topped with fresh pea shoots on a cream plate",
    body: [
      {
        type: "p",
        text: "Pea shoots are the one microgreen in the house that never makes it to a salad bowl intact — they get used up before that. They have a mild, sweet, distinctly pea-like flavour and enough structure to survive a bit of heat, which makes them more versatile than most microgreens. Here's what's actually in rotation in our kitchen.",
      },
      {
        type: "h2",
        text: "1. Folded into an omelette, off the heat",
      },
      {
        type: "p",
        text: "Fold a handful into eggs in the last ten seconds, once the pan is off the flame. Residual heat wilts them just enough without cooking the crunch out entirely.",
      },
      {
        type: "h2",
        text: "2. Wilted through hot dal or curry",
      },
      {
        type: "p",
        text: "Stir a fistful into any dal, sabzi, or curry right before serving. The heat of the dish is enough to soften them in under a minute — treat them the way you'd treat spinach, minus the actual cooking time.",
      },
      {
        type: "h2",
        text: "3. Blitzed into a pesto",
      },
      {
        type: "p",
        text: "Pea shoots, a garlic clove, lemon juice, olive oil, and whatever nuts are in the pantry (we use cashews) blend into a pesto that's noticeably sweeter than basil pesto. It keeps in the fridge under a layer of oil for about two weeks — longer than the fresh shoots would on their own.",
      },
      {
        type: "h2",
        text: "4. On toast, under a fried egg",
      },
      {
        type: "p",
        text: "A thick layer of pea shoots on buttered toast, topped with a fried egg and flaky salt. Fifteen minutes, feels like more effort than it is.",
      },
      {
        type: "h2",
        text: "5. Blended straight into a smoothie",
      },
      {
        type: "p",
        text: "A small handful disappears into a banana-and-yogurt smoothie with no detectable flavour change but a noticeable colour one. Good option on the mornings you're not cooking anything at all.",
      },
    ],
  },
  {
    slug: "what-sustainable-really-means-on-a-small-farm",
    title: "What Sustainable Really Means On A Small Farm",
    date: "30 May 2026",
    readTime: "7 min read",
    category: "Farm",
    excerpt:
      "Reusable trays, a closed-loop water system, and the parts of our operation we're still not happy with.",
    image: "/images/home/farm-hands.webp",
    imageAlt: "Hands holding a freshly harvested clump of pea shoots in the greenhouse",
    body: [
      {
        type: "p",
        text: "\"Sustainable\" gets used loosely enough in food marketing that we're wary of the word ourselves. So instead of a slogan, here's what it actually means in our growing room, including the parts we haven't solved yet.",
      },
      {
        type: "h2",
        text: "What's working",
      },
      {
        type: "list",
        items: [
          "Reusable trays — every tray we harvest from goes back into the wash-and-reseed cycle rather than the bin; we're not buying new plastic trays for each grow cycle.",
          "A closed-loop water system that recirculates irrigation runoff instead of sending it to drain, cutting our fresh-water draw substantially versus open-tray growing.",
          "Plastic-free delivery packaging — kraft boxes and compostable liners instead of clamshells.",
          "Growing indoors under LEDs means no pesticides; there's no outdoor pest pressure to manage in the first place.",
        ],
      },
      {
        type: "h2",
        text: "What we're not happy with yet",
      },
      {
        type: "p",
        text: "Our growing medium is still a coco-coir blend that we don't yet have a take-back or composting loop for at customer scale — it goes to municipal green waste, not back into our own system. We're testing reusable growing mats that would close that loop, but haven't found one that holds moisture consistently enough to switch over yet.",
      },
      {
        type: "p",
        text: "Our LED grow lights run on grid electricity, and Bangalore's grid is not majority renewable. Solar for the growing room is on our list, not yet on our roof.",
      },
      {
        type: "p",
        text: "We'd rather tell you both halves of that than round up to a word that implies we're finished. The reusable-tray and closed-loop water pieces took us over a year to get right; the growing-medium problem might take longer. We'll write about it again when there's something to report.",
      },
    ],
  },
  {
    slug: "the-case-for-eating-seasonally-indoors",
    title: "The Case For Eating Seasonally, Indoors",
    date: "16 May 2026",
    readTime: "5 min read",
    category: "Farm",
    excerpt:
      "Growing under lights doesn't mean ignoring the seasons. Our rotation still follows what grows best, and when.",
    image: "/images/journal/grow-room.webp",
    imageAlt: "Shelves of microgreen trays under soft grow lights in a bright indoor grow room",
    body: [
      {
        type: "p",
        text: "Growing indoors under LEDs means we can technically run any crop, any day of the year — the room doesn't know it's monsoon outside. It would be easy to treat that as license to ignore seasonality altogether. We don't, and here's why.",
      },
      {
        type: "p",
        text: "Even with controlled light and temperature, seed quality, humidity swings, and ambient temperature in the growing room still shift with the seasons outside — Bangalore's summer heat and winter dip both affect germination speed and how trays need to be managed, even indoors. Crops that are more sensitive to humidity, like sunflower shoots, are more reliable for us from October through February. Radish and mustard, which want a bit more warmth to germinate evenly, run better April through June.",
      },
      {
        type: "h2",
        text: "What this means for what's in your box",
      },
      {
        type: "p",
        text: "Our catalogue rotates a little across the year — not because the room can't grow something in the \"wrong\" season, but because we'd rather send you a crop grown in its better conditions than force a weaker batch onto the schedule to keep the catalogue static. If a variety looks different or is temporarily unavailable, that's usually why.",
      },
      {
        type: "p",
        text: "It's a smaller version of the same argument for eating seasonally outdoors: working with what grows well right now, instead of against it, usually gets you a better product. Indoor growing changes the range of what's possible, not the logic of paying attention to it.",
      },
    ],
  },
  {
    slug: "meet-the-team-behind-your-weekly-box",
    title: "Meet The Team Behind Your Weekly Box",
    date: "02 May 2026",
    readTime: "3 min read",
    category: "Farm",
    excerpt:
      "Six people, one growing room, and a 4am start. A short introduction to the hands that cut your greens.",
    image: "/images/story/step-03-box.webp",
    imageAlt: "A Mini Greens delivery box packed with fresh microgreen trays",
    body: [
      {
        type: "p",
        text: "Every box that reaches your door passed through the hands of a small, specific group of people, most mornings before sunrise. We don't talk about that enough, so here's a short introduction.",
      },
      {
        type: "p",
        text: "The day starts around 4am with harvest — trays are cut to order, not pulled from cold storage, which is the reason \"harvested this morning\" on our packaging isn't a slogan. By the time most of Bangalore is waking up, that morning's harvest is already washed, weighed, and boxed.",
      },
      {
        type: "p",
        text: "Six people currently run the growing room day to day: seeding, tray rotation, harvest, wash, pack, and quality checks each have an owner, though on a small team everyone covers more than one station most days. It's hands-on work — there's no automated harvesting line here, just people who've done this long enough to cut a tray cleanly in a few seconds.",
      },
      {
        type: "p",
        text: "We'll keep introducing people properly in future posts — for now, the short version is: it's not a big operation, it's a careful one, and the 4am start is real.",
      },
    ],
  },
];

export const JOURNAL_POSTS: JournalPost[] = [BRAND_POSTS[0], ...SEO_JOURNAL_POSTS, ...BRAND_POSTS.slice(1)];

export function getJournalPost(slug: string) {
  return JOURNAL_POSTS.find((post) => post.slug === slug) ?? null;
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// Converts our display date ("12 July 2026") to ISO 8601 ("2026-07-12") for
// structured data, without going through Date() and risking a timezone shift.
export function toIsoDate(displayDate: string): string {
  const [day, month, year] = displayDate.trim().split(/\s+/);
  const monthIndex = MONTHS.indexOf(month.toLowerCase());
  if (monthIndex === -1) return displayDate;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
}
