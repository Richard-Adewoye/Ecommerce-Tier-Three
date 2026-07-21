export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  description: string;
  unit: string;
  isBestseller: boolean;
  isFlashSale: boolean;
  reviews: Review[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'Placed' | 'Processing' | 'Out for Delivery' | 'Delivered';
  address: Address;
  deliveryZone: string;
  driverName?: string;
  paymentMethod: string;
  couponCode?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  orderCount: number;
  dateJoined: string;
  notes: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Gourmet Artisanal Sourdough Bread",
    category: "Bakery",
    price: 3200,
    originalPrice: 4000,
    image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=600",
    stock: 12,
    rating: 4.8,
    reviewsCount: 24,
    description: "Slow-fermented for 36 hours using high-grade wild yeast starters. Features a beautifully caramelized blistered crust with a soft, airy crumb inside. Perfect for premium table service, gourmet cheese boards, or morning toast.",
    unit: "750g Loaf",
    isBestseller: true,
    isFlashSale: true,
    reviews: [
      { id: "r1", userName: "Amara N.", rating: 5, comment: "Absolutely divine! The crust is beautifully crisp and the crumb is perfectly airy. Reminds me of European bakeries.", date: "2026-07-15", isVerified: true },
      { id: "r2", userName: "Tobi O.", rating: 4, comment: "Delicious and smells amazing. Stays fresh for a couple of days if wrapped in a linen cloth.", date: "2026-07-10", isVerified: true }
    ]
  },
  {
    id: "p2",
    name: "Premium Organic Heirloom Tomatoes",
    category: "Produce",
    price: 4500,
    originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600",
    stock: 4, // low stock to trigger warnings!
    rating: 4.9,
    reviewsCount: 18,
    description: "Hand-picked organic heirloom tomatoes sourced directly from the volcanic soils of Jos. Brimming with intense natural sweetness and loaded with vitamins. Ideal for fresh Caprese salads or rich authentic sauces.",
    unit: "1kg Basket",
    isBestseller: true,
    isFlashSale: true,
    reviews: [
      { id: "r3", userName: "Fatima B.", rating: 5, comment: "These are so incredibly sweet! Nothing like the watery supermarket stuff. Highly recommended.", date: "2026-07-18", isVerified: true }
    ]
  },
  {
    id: "p3",
    name: "Aged Oak-Wood Smoked Salmon Fillet",
    category: "Meat & Seafood",
    price: 24500,
    originalPrice: 28000,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600",
    stock: 8,
    rating: 4.7,
    reviewsCount: 15,
    description: "Sustainably farmed Atlantic salmon, cured with raw sea salt and slowly cold-smoked over organic oak-wood shavings for 18 hours. Sliced with surgical precision for an elite melt-in-your-mouth experience.",
    unit: "250g Pack",
    isBestseller: true,
    isFlashSale: false,
    reviews: [
      { id: "r4", userName: "Chidi E.", rating: 5, comment: "Incredibly premium cut. Perfect smoke balance, not overly salty. Will buy again for our dinner party.", date: "2026-07-12", isVerified: true }
    ]
  },
  {
    id: "p4",
    name: "Cold-Pressed Extra Virgin Olive Oil",
    category: "Pantry",
    price: 13500,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    stock: 22,
    rating: 4.6,
    reviewsCount: 31,
    description: "First cold-pressed Koroneiki olives harvested in early autumn. Extremely low acidity (<0.3%) with a vibrant green hue, peppery finish, and rich notes of green herbs. Perfect for finishing fine dishes.",
    unit: "500ml Glass Bottle",
    isBestseller: true,
    isFlashSale: false,
    reviews: [
      { id: "r5", userName: "Yemi A.", rating: 5, comment: "Very authentic peppery throat-catch. The real deal olive oil. Beautiful glass packaging too.", date: "2026-07-14", isVerified: true }
    ]
  },
  {
    id: "p5",
    name: "Pure Wildflower Jos plateau Honey",
    category: "Pantry",
    price: 6800,
    originalPrice: 8000,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600",
    stock: 3, // low stock!
    rating: 5.0,
    reviewsCount: 42,
    description: "Raw, unfiltered honey harvested by artisanal beekeepers in the wild meadows of the Jos Plateau. Retains all natural pollens and enzymes. Golden amber appearance with a clean, floral aroma.",
    unit: "450g Jar",
    isBestseller: false,
    isFlashSale: true,
    reviews: [
      { id: "r6", userName: "Bisi S.", rating: 5, comment: "Hands down the best honey in Nigeria. No added sugar syrups, pure thick wildflower essence.", date: "2026-07-17", isVerified: true }
    ]
  },
  {
    id: "p6",
    name: "Artisanal Double-Cream Brie Cheese",
    category: "Dairy",
    price: 11200,
    image: "https://images.unsplash.com/photo-1528256846576-0f1aa193000b?auto=format&fit=crop&q=80&w=600",
    stock: 14,
    rating: 4.5,
    reviewsCount: 9,
    description: "Rich, creamy, French-style double-cream brie cheese. Handcrafted with local grass-fed cow's milk. Boasts a snowy velvety rind and a luxuriously buttery, oozing interior at room temperature.",
    unit: "200g Wheel",
    isBestseller: false,
    isFlashSale: false,
    reviews: []
  },
  {
    id: "p7",
    name: "Prime Grass-Fed Angus Ribeye Steak",
    category: "Meat & Seafood",
    price: 21000,
    originalPrice: 25000,
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=600",
    stock: 6,
    rating: 4.9,
    reviewsCount: 29,
    description: "Exceptionally well-marbled USDA prime ribeye steak cut from pasture-raised, grass-fed Angus beef. Wet-aged for 21 days to concentrate deep beef flavors and achieve extreme tenderness.",
    unit: "350g Thick-Cut",
    isBestseller: true,
    isFlashSale: false,
    reviews: [
      { id: "r7", userName: "Segun A.", rating: 5, comment: "Insane marbling! Seared on a cast iron with garlic butter. Literally melted in our mouths.", date: "2026-07-11", isVerified: true }
    ]
  },
  {
    id: "p8",
    name: "Hydroponic Living Butterhead Lettuce",
    category: "Produce",
    price: 2600,
    image: "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&q=80&w=600",
    stock: 15,
    rating: 4.8,
    reviewsCount: 13,
    description: "Grown in pesticide-free, nutrient-rich water. Delivered living with its root system intact in a breathable bio-dome. Stays fresh and crisp in your kitchen cabinet for up to 10 days.",
    unit: "Single Live Plant",
    isBestseller: false,
    isFlashSale: false,
    reviews: []
  },
  {
    id: "p9",
    name: "Artisanal Lavender Dishwashing Elixir",
    category: "Pantry",
    price: 4900,
    originalPrice: 6000,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600",
    stock: 2, // low stock!
    rating: 4.7,
    reviewsCount: 7,
    description: "Biodegradable, plant-derived formula infused with pure organic lavender and rosemary essential oils. Easily cuts grease without drying out hands. Housed in an elegant reusable bottle.",
    unit: "500ml Dispenser",
    isBestseller: false,
    isFlashSale: true,
    reviews: []
  },
  {
    id: "p10",
    name: "Cold-Brew Madagascar Vanilla Extract",
    category: "Pantry",
    price: 9800,
    image: "https://images.unsplash.com/photo-1594911774802-8822a707cbb3?auto=format&fit=crop&q=80&w=600",
    stock: 19,
    rating: 4.9,
    reviewsCount: 16,
    description: "Slow-drip extracted over 3 months using grade-A Madagascar Bourbon vanilla beans and triple-distilled cane spirits. Contains zero synthetic flavorings or corn syrups.",
    unit: "100ml Bottle",
    isBestseller: false,
    isFlashSale: false,
    reviews: []
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    name: "Richard Adewoye",
    email: "richardadewoye031@gmail.com",
    phone: "+234 812 345 6789",
    totalSpent: 182500,
    orderCount: 5,
    dateJoined: "2026-01-10",
    notes: "Prefers evening deliveries on weekends. High-value shopper who frequently purchases aged meat and organic vegetables."
  },
  {
    id: "c2",
    name: "Amara Nwachukwu",
    email: "amara.n@example.com",
    phone: "+234 803 777 8888",
    totalSpent: 94000,
    orderCount: 3,
    dateJoined: "2026-02-15",
    notes: "Requires zero plastic packaging. Buys mostly gluten-free bakery products."
  },
  {
    id: "c3",
    name: "Segun Awosika",
    email: "segun.a@example.com",
    phone: "+234 905 111 2222",
    totalSpent: 312500,
    orderCount: 8,
    dateJoined: "2025-11-04",
    notes: "Chef at a boutique restaurant. Demands pristine cold-chain delivery for fresh meats."
  }
];

export const INITIAL_ADDRESSES: Address[] = [
  {
    id: "a1",
    label: "Home (Victoria Island)",
    fullName: "Richard Adewoye",
    phone: "+234 812 345 6789",
    street: "Plot 14, Karimu Kotun Street",
    city: "Victoria Island",
    state: "Lagos State",
    isDefault: true
  },
  {
    id: "a2",
    label: "Office (Lekki Phase 1)",
    fullName: "Richard Adewoye",
    phone: "+234 812 345 9999",
    street: "Capital Hub, Block B, Admiralty Way",
    city: "Lekki Phase 1",
    state: "Lagos State",
    isDefault: false
  },
  {
    id: "a3",
    label: "Family (Ikeja GRA)",
    fullName: "Adewoye Family",
    phone: "+234 802 111 3333",
    street: "5, Joel Ogunnaike Street",
    city: "Ikeja GRA",
    state: "Lagos State",
    isDefault: false
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "NOU-2026-001",
    date: "2026-07-12",
    items: [
      {
        product: INITIAL_PRODUCTS[0], // Sourdough
        quantity: 2
      },
      {
        product: INITIAL_PRODUCTS[6], // Steak
        quantity: 1
      }
    ],
    subtotal: 27400,
    discount: 2740,
    deliveryFee: 1500,
    total: 26160,
    status: "Delivered",
    address: INITIAL_ADDRESSES[0],
    deliveryZone: "Victoria Island (Lagos)",
    driverName: "Chinedu Okafor",
    paymentMethod: "Credit Card",
    couponCode: "WELCOME10"
  },
  {
    id: "NOU-2026-002",
    date: "2026-07-19",
    items: [
      {
        product: INITIAL_PRODUCTS[1], // Tomatoes
        quantity: 1
      },
      {
        product: INITIAL_PRODUCTS[2], // Salmon
        quantity: 1
      },
      {
        product: INITIAL_PRODUCTS[4], // Honey
        quantity: 1
      }
    ],
    subtotal: 35800,
    discount: 0,
    deliveryFee: 2000,
    total: 37800,
    status: "Processing",
    address: INITIAL_ADDRESSES[0],
    deliveryZone: "Victoria Island (Lagos)",
    driverName: "Emeka Nwosu",
    paymentMethod: "Bank Transfer"
  }
];

export const COUPONS: Record<string, { type: 'percent' | 'flat'; value: number }> = {
  "SAVE10": { type: 'percent', value: 10 },
  "LAGOS50": { type: 'percent', value: 15 },
  "FREESHIP": { type: 'flat', value: 2000 },
  "WELCOME20": { type: 'percent', value: 20 }
};

export const DELIVERY_ZONES = [
  "Victoria Island (Lagos)",
  "Lekki Phase 1 (Lagos)",
  "Ikoyi (Lagos)",
  "Ikeja GRA (Lagos)",
  "Maitama (Abuja)",
  "Wuse II (Abuja)"
];

export const DRIVERS = [
  "Chinedu Okafor",
  "Emeka Nwosu",
  "Babajide Sanwo",
  "Musa Ibrahim",
  "Seyi Makinde"
];
