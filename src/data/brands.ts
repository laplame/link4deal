export const brands = [
  // Fashion & Sustainability
  {
    id: '1',
    name: 'Nike',
    category: 'Fashion',
    subCategory: {
      en: 'Sustainability',
      es: 'Sostenibilidad y Conciencia Ecológica'
    },
    commission: '15-20%',
    chance: 82,
    volume: '$253.5k',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    price: { min: 50, max: 200 }
  },
  {
    id: '2',
    name: 'Patagonia',
    category: 'Fashion',
    subCategory: {
      en: 'Sustainability',
      es: 'Sostenibilidad y Conciencia Ecológica'
    },
    commission: '10-15%',
    chance: 75,
    volume: '$156.3k',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985',
    price: { min: 80, max: 300 }
  },

  // Fashion & Wellness
  {
    id: '3',
    name: 'Lululemon',
    category: 'Fashion',
    subCategory: {
      en: 'Wellness',
      es: 'Bienestar y Salud Integral'
    },
    commission: '12-18%',
    chance: 82,
    volume: '$312.7k',
    image: 'https://images.lululemon.com/is/image/lululemon/NA_NOV24_Membership_EA_Launch_Ecomm_MediaAction_D?wid=2644&op_usm=0.8,1,10,0&fmt=webp&qlt=80,1&fit=constrain,0&op_sharpen=0&resMode=sharp2&iccEmbed=0&printRes=72',
    price: { min: 60, max: 180 }
  },
  {
    id: '4',
    name: 'Athleta',
    category: 'Fashion',
    subCategory: {
      en: 'Wellness',
      es: 'Bienestar y Salud Integral'
    },
    commission: '15-20%',
    chance: 78,
    volume: '$198.2k',
    image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f',
    price: { min: 45, max: 180 }
  },

  // Tech & Innovation
  {
    id: '5',
    name: 'Apple',
    category: 'Tech',
    subCategory: {
      en: 'Technology',
      es: 'Tecnología e Innovación'
    },
    commission: '8-12%',
    chance: 65,
    volume: '$452.1k',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9',
    price: { min: 200, max: 2000 }
  },
  {
    id: '6',
    name: 'Samsung',
    category: 'Tech',
    subCategory: {
      en: 'Technology',
      es: 'Tecnología e Innovación'
    },
    commission: '10-15%',
    chance: 70,
    volume: '$387.4k',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf',
    price: { min: 150, max: 1500 }
  },

  // Beauty & Luxury
  {
    id: '7',
    name: 'Fenty Beauty',
    category: 'Beauty',
    subCategory: {
      en: 'Luxury',
      es: 'Lujo y Exclusividad'
    },
    commission: '20-25%',
    chance: 85,
    volume: '$178.9k',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b',
    price: { min: 25, max: 120 }
  },
  {
    id: '8',
    name: 'Charlotte Tilbury',
    category: 'Beauty',
    subCategory: {
      en: 'Luxury',
      es: 'Lujo y Exclusividad'
    },
    commission: '18-23%',
    chance: 82,
    volume: '$165.4k',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
    price: { min: 30, max: 150 }
  },

  // Beauty & Minimalism
  {
    id: '9',
    name: 'The Ordinary',
    category: 'Beauty',
    subCategory: {
      en: 'Minimalism',
      es: 'Minimalismo y Simplicidad'
    },
    commission: '15-20%',
    chance: 88,
    volume: '$143.2k',
    image: 'https://cdn.media.amplience.net/i/deciem/D-Homepage-Hero-Slide-2-Regimen-Builder4K?fmt=auto&$poi$&sm=aspect&w=3100&aspect=1.85:1',
    price: { min: 10, max: 50 }
  },
  {
    id: '10',
    name: 'Glossier',
    category: 'Beauty',
    subCategory: {
      en: 'Minimalism',
      es: 'Minimalismo y Simplicidad'
    },
    commission: '17-22%',
    chance: 86,
    volume: '$156.8k',
    image: 'https://images.unsplash.com/photo-1607602132700-068258431c6c',
    price: { min: 15, max: 60 }
  },

  // Fitness & Wellness
  {
    id: '11',
    name: 'Peloton',
    category: 'Fitness',
    subCategory: {
      en: 'Wellness',
      es: 'Bienestar y Salud Integral'
    },
    commission: '12-18%',
    chance: 72,
    volume: '$298.5k',
    image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77',
    price: { min: 1000, max: 2500 }
  },
  {
    id: '12',
    name: 'Gymshark',
    category: 'Fitness',
    subCategory: {
      en: 'Wellness',
      es: 'Bienestar y Salud Integral'
    },
    commission: '15-20%',
    chance: 80,
    volume: '$167.8k',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    price: { min: 30, max: 100 }
  },

  // Food & Wellness
  {
    id: '13',
    name: 'HelloFresh',
    category: 'Food & Beverage',
    subCategory: {
      en: 'Wellness',
      es: 'Bienestar y Salud Integral'
    },
    commission: '25-30%',
    chance: 90,
    volume: '$423.1k',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71',
    price: { min: 60, max: 200 }
  },
  {
    id: '14',
    name: 'Blue Apron',
    category: 'Food & Beverage',
    subCategory: {
      en: 'Wellness',
      es: 'Bienestar y Salud Integral'
    },
    commission: '23-28%',
    chance: 88,
    volume: '$387.2k',
    image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759',
    price: { min: 50, max: 180 }
  },

  // Fashion & Minimalism
  {
    id: '15',
    name: 'Uniqlo',
    category: 'Fashion',
    subCategory: {
      en: 'Minimalism',
      es: 'Minimalismo y Simplicidad'
    },
    commission: '10-15%',
    chance: 75,
    volume: '$234.5k',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050',
    price: { min: 20, max: 150 }
  },
  {
    id: '16',
    name: 'COS',
    category: 'Fashion',
    subCategory: {
      en: 'Minimalism',
      es: 'Minimalismo y Simplicidad'
    },
    commission: '12-17%',
    chance: 73,
    volume: '$198.6k',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
    price: { min: 40, max: 200 }
  },

  // Tech & Security
  {
    id: '17',
    name: 'Ring',
    category: 'Tech',
    subCategory: {
      en: 'Security',
      es: 'Seguridad y Estabilidad'
    },
    commission: '15-20%',
    chance: 78,
    volume: '$287.4k',
    image: 'https://images.unsplash.com/photo-1558000143-a78f8299c40b',
    price: { min: 100, max: 500 }
  },
  {
    id: '18',
    name: 'Nest',
    category: 'Tech',
    subCategory: {
      en: 'Security',
      es: 'Seguridad y Estabilidad'
    },
    commission: '12-18%',
    chance: 76,
    volume: '$265.8k',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827',
    price: { min: 120, max: 600 }
  }
];

export const sortBrands = (brands: typeof brands) => {
  return brands.sort((a, b) => {
    if (a.category === b.category) {
      return a.name.localeCompare(b.name);
    }
    return a.category.localeCompare(b.category);
  });
};