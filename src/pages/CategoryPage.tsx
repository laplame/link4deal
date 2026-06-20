import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, Grid, List, Star, Heart, ShoppingCart, Eye } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    currency: string;
    image: string; 
    offer: string;
    category: string;
    brand: string;
    rating: number;
    reviewCount: number;
    stock: number;
    location: string;
    shipping: string;
    warranty: string;
    tags: string[];
    description: string;
    features: string[];
    seller: {
        name: string;
        rating: number;
        verified: boolean;
    };
    specifications: Record<string, string | undefined>;
    smartContract: {
        address: string;
        network: string;
        tokenStandard: string;
        blockchainExplorer: string;
    };
}

interface Category {
    name: string;
    subcategories: string[];
    description: string;
    icon: string;
}

const categories: Record<string, Category> = {
    "electronica": {
        name: "Electrónica",
        subcategories: ["Smartphones", "Laptops", "Auriculares", "Smartwatches", "Tablets"],
        description: "Descubre las mejores ofertas en tecnología y dispositivos electrónicos",
        icon: "📱"
    },
    "moda": {
        name: "Moda",
        subcategories: ["Ropa", "Zapatos", "Accesorios", "Bolsos", "Joyería"],
        description: "Ofertas exclusivas en moda y accesorios de las mejores marcas",
        icon: "👗"
    },
    "hogar": {
        name: "Hogar",
        subcategories: ["Muebles", "Decoración", "Cocina", "Jardín", "Iluminación"],
        description: "Transforma tu hogar con nuestras ofertas en decoración y mobiliario",
        icon: "🏠"
    },
    "deportes": {
        name: "Deportes",
        subcategories: ["Fitness", "Running", "Fútbol", "Natación", "Ciclismo"],
        description: "Equípate para tus actividades deportivas con descuentos increíbles",
        icon: "⚽"
    },
    "fotografia": {
        name: "Fotografía",
        subcategories: ["Cámaras", "Lentes", "Trípodes", "Iluminación", "Accesorios"],
        description: "Captura momentos especiales con equipos profesionales a precios únicos",
        icon: "📸"
    },
    "comida": {
        name: "Comida y Bebidas",
        subcategories: ["Restaurantes", "Delivery", "Bebidas", "Snacks", "Postres"],
        description: "Disfruta de las mejores ofertas en comida, bebidas y experiencias gastronómicas",
        icon: "🍕"
    },
    "servicios": {
        name: "Servicios",
        subcategories: ["Educación", "Salud", "Belleza", "Transporte", "Entretenimiento"],
        description: "Accede a servicios premium con descuentos exclusivos y promociones especiales",
        icon: "🛠️"
    },
    "digital": {
        name: "Productos Digitales",
        subcategories: ["Software", "Cursos Online", "E-books", "Música", "Streaming"],
        description: "Descubre ofertas en productos y servicios digitales de alta calidad",
        icon: "💻"
    },
    "viajes": {
        name: "Viajes y Turismo",
        subcategories: ["Hoteles", "Vuelos", "Paquetes", "Actividades", "Seguros"],
        description: "Explora el mundo con las mejores ofertas en viajes y experiencias turísticas",
        icon: "✈️"
    },
    "belleza": {
        name: "Belleza y Cuidado",
        subcategories: ["Cosméticos", "Skincare", "Perfumes", "Tratamientos", "Accesorios"],
        description: "Cuida tu belleza con productos premium y tratamientos especializados",
        icon: "💄"
    }
};

// Mock products data - in a real app this would come from an API
const allProducts: Product[] = [
    // Electrónica
    {
        id: "1",
        name: "iPhone 15 Pro Max",
        price: 999,
        originalPrice: 1199,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=500&q=80",
        offer: "20% OFF",
        category: "electronica",
        brand: "Apple",
        rating: 4.8,
        reviewCount: 1247,
        stock: 50,
        location: "Miami, FL",
        shipping: "Envío gratis",
        warranty: "1 año",
        tags: ["Smartphone", "5G", "iOS", "Premium"],
        description: "El iPhone más avanzado con chip A17 Pro, cámara de 48MP y diseño de titanio.",
        features: ["Chip A17 Pro", "Cámara 48MP", "5G", "iOS 17", "Titanio"],
        seller: {
            name: "Apple Store",
            rating: 4.9,
            verified: true
        },
        specifications: {
            "Pantalla": "6.7 pulgadas",
            "Procesador": "A17 Pro",
            "RAM": "8GB",
            "Almacenamiento": "256GB"
        },
        smartContract: {
            address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
        }
    },
    {
        id: "2",
        name: "MacBook Air M2",
        price: 1099,
        originalPrice: 1299,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80",
        offer: "15% OFF",
        category: "electronica",
        brand: "Apple",
        rating: 4.9,
        reviewCount: 892,
        stock: 30,
        location: "Miami, FL",
        shipping: "Envío gratis",
        warranty: "1 año",
        tags: ["Laptop", "M2", "macOS", "Portátil"],
        description: "Laptop ultraligera con chip M2, perfecta para trabajo y creatividad.",
        features: ["Chip M2", "13.6 pulgadas", "macOS Ventura", "18 horas batería"],
        seller: {
            name: "Apple Store",
            rating: 4.9,
            verified: true
        },
        specifications: {
            "Pantalla": "13.6 pulgadas",
            "Procesador": "M2",
            "RAM": "8GB",
            "Almacenamiento": "256GB"
        },
        smartContract: {
            address: "0x8ba1f109551bD432803012645Hac136c22C177e9",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x8ba1f109551bD432803012645Hac136c22C177e9"
        }
    },
    {
        id: "3",
        name: "Samsung Galaxy S24 Ultra",
        price: 1199,
        originalPrice: 1399,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80",
        offer: "14% OFF",
        category: "electronica",
        brand: "Samsung",
        rating: 4.7,
        reviewCount: 756,
        stock: 40,
        location: "Los Angeles, CA",
        shipping: "Envío gratis",
        warranty: "1 año",
        tags: ["Smartphone", "Android", "5G", "Premium"],
        description: "El smartphone más avanzado de Samsung con S Pen integrado y cámara de 200MP.",
        features: ["S Pen", "Cámara 200MP", "5G", "Android 14", "S Pen"],
        seller: {
            name: "Samsung Store",
            rating: 4.8,
            verified: true
        },
        specifications: {
            "Pantalla": "6.8 pulgadas",
            "Procesador": "Snapdragon 8 Gen 3",
            "RAM": "12GB",
            "Almacenamiento": "256GB"
        },
        smartContract: {
            address: "0x1234567890abcdef1234567890abcdef12345678",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678"
        }
    },
    {
        id: "4",
        name: "AirPods Pro 2",
        price: 199,
        originalPrice: 249,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=500&q=80",
        offer: "20% OFF",
        category: "electronica",
        brand: "Apple",
        rating: 4.6,
        reviewCount: 432,
        stock: 100,
        location: "Miami, FL",
        shipping: "Envío gratis",
        warranty: "1 año",
        tags: ["Auriculares", "Wireless", "Noise Cancelling", "iOS"],
        description: "Auriculares inalámbricos con cancelación de ruido activa y audio espacial.",
        features: ["Noise Cancelling", "Audio Espacial", "Transparencia", "Carga MagSafe"],
        seller: {
            name: "Apple Store",
            rating: 4.9,
            verified: true
        },
        specifications: {
            "Tecnología": "Bluetooth 5.0",
            "Batería": "6 horas",
            "Peso": "5.4g",
            "Resistencia": "IPX4"
        },
        smartContract: {
            address: "0xabcdef1234567890abcdef1234567890abcdef12",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0xabcdef1234567890abcdef1234567890abcdef12"
        }
    },
    // Moda
    {
        id: "5",
        name: "Nike Air Max 270",
        price: 89,
        originalPrice: 150,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
        offer: "40% OFF",
        category: "moda",
        brand: "Nike",
        rating: 4.6,
        reviewCount: 567,
        stock: 100,
        location: "Los Angeles, CA",
        shipping: "Envío $5",
        warranty: "30 días",
        tags: ["Zapatos", "Deportivos", "Comfort", "Estilo"],
        description: "Zapatos deportivos con tecnología Air Max para máximo confort.",
        features: ["Air Max", "Material transpirable", "Suela de goma", "Comfort premium"],
        seller: {
            name: "Nike Store",
            rating: 4.7,
            verified: true
        },
        specifications: {
            "Material": "Mesh transpirable",
            "Suela": "Goma Air Max",
            "Peso": "320g",
            "Cierre": "Cordones"
        },
        smartContract: {
            address: "0x567890abcdef1234567890abcdef1234567890ab",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x567890abcdef1234567890abcdef1234567890ab"
        }
    },
    {
        id: "6",
        name: "Camiseta Premium de Algodón",
        price: 29,
        originalPrice: 59,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80",
        offer: "51% OFF",
        category: "moda",
        brand: "H&M",
        rating: 4.3,
        reviewCount: 234,
        stock: 200,
        location: "New York, NY",
        shipping: "Envío gratis",
        warranty: "30 días",
        tags: ["Ropa", "Algodón", "Premium", "Básico"],
        description: "Camiseta de algodón 100% premium con corte moderno y comodidad excepcional.",
        features: ["100% Algodón", "Corte moderno", "Comodidad", "Durabilidad"],
        seller: {
            name: "H&M",
            rating: 4.4,
            verified: true
        },
        specifications: {
            "Material": "100% Algodón",
            "Peso": "180g/m²",
            "Colores": "Disponibles",
            "Tallas": "XS-XXL"
        },
        smartContract: {
            address: "0x9876543210fedcba9876543210fedcba98765432",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x9876543210fedcba9876543210fedcba98765432"
        }
    },
    {
        id: "7",
        name: "Bolso de Cuero Genuino",
        price: 89,
        originalPrice: 199,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=500&q=80",
        offer: "55% OFF",
        category: "moda",
        brand: "Coach",
        rating: 4.5,
        reviewCount: 189,
        stock: 75,
        location: "Chicago, IL",
        shipping: "Envío $10",
        warranty: "1 año",
        tags: ["Bolso", "Cuero", "Premium", "Elegante"],
        description: "Bolso de cuero genuino con diseño elegante y funcionalidad excepcional.",
        features: ["Cuero genuino", "Diseño elegante", "Funcional", "Durabilidad"],
        seller: {
            name: "Coach Store",
            rating: 4.6,
            verified: true
        },
        specifications: {
            "Material": "Cuero genuino",
            "Dimensiones": "30x25x10 cm",
            "Color": "Marrón",
            "Interior": "Forrado"
        },
        smartContract: {
            address: "0xfedcba0987654321fedcba0987654321fedcba09",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0xfedcba0987654321fedcba0987654321fedcba09"
        }
    },
    // Hogar
    {
        id: "8",
        name: "Sofá Moderno 3 Plazas",
        price: 599,
        originalPrice: 899,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=500&q=80",
        offer: "33% OFF",
        category: "hogar",
        brand: "IKEA",
        rating: 4.4,
        reviewCount: 234,
        stock: 25,
        location: "Chicago, IL",
        shipping: "Envío $50",
        warranty: "5 años",
        tags: ["Muebles", "Sofá", "Moderno", "Comfort"],
        description: "Sofá moderno y elegante perfecto para cualquier sala de estar.",
        features: ["3 plazas", "Material premium", "Diseño moderno", "Fácil limpieza"],
        seller: {
            name: "IKEA",
            rating: 4.5,
            verified: true
        },
        specifications: {
            "Dimensiones": "200x85x75 cm",
            "Material": "Tela premium",
            "Color": "Gris",
            "Peso": "45kg"
        },
        smartContract: {
            address: "0xabcdef1234567890abcdef1234567890abcdef12",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0xabcdef1234567890abcdef1234567890abcdef12"
        }
    },
    {
        id: "9",
        name: "Lámpara de Mesa LED",
        price: 49,
        originalPrice: 89,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500&q=80",
        offer: "45% OFF",
        category: "hogar",
        brand: "Philips",
        rating: 4.2,
        reviewCount: 156,
        stock: 120,
        location: "Miami, FL",
        shipping: "Envío gratis",
        warranty: "2 años",
        tags: ["Iluminación", "LED", "Moderno", "Eficiente"],
        description: "Lámpara de mesa LED moderna con luz ajustable y diseño elegante.",
        features: ["LED", "Luz ajustable", "Diseño moderno", "Eficiente"],
        seller: {
            name: "Philips",
            rating: 4.3,
            verified: true
        },
        specifications: {
            "Potencia": "10W",
            "Luminosidad": "800lm",
            "Color": "Ajustable",
            "Material": "Metal y plástico"
        },
        smartContract: {
            address: "0x1234567890abcdef1234567890abcdef12345678",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678"
        }
    },
    // Deportes
    {
        id: "10",
        name: "Pelota de Fútbol Profesional",
        price: 45,
        originalPrice: 80,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1579952363873-27d3badeef2f?auto=format&fit=crop&w=500&q=80",
        offer: "44% OFF",
        category: "deportes",
        brand: "Adidas",
        rating: 4.7,
        reviewCount: 189,
        stock: 75,
        location: "Dallas, TX",
        shipping: "Envío gratis",
        warranty: "1 año",
        tags: ["Fútbol", "Profesional", "Calidad", "Durabilidad"],
        description: "Pelota de fútbol profesional aprobada por FIFA para competiciones.",
        features: ["Aprobada FIFA", "Material premium", "Diseño aerodinámico", "Durabilidad"],
        seller: {
            name: "Adidas Store",
            rating: 4.8,
            verified: true
        },
        specifications: {
            "Tamaño": "5",
            "Material": "Poliuretano",
            "Peso": "420g",
            "Presión": "0.6-1.1 bar"
        },
        smartContract: {
            address: "0x567890abcdef1234567890abcdef1234567890ab",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x567890abcdef1234567890abcdef1234567890ab"
        }
    },
    {
        id: "11",
        name: "Pesas de Gimnasio 20kg",
        price: 79,
        originalPrice: 129,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=500&q=80",
        offer: "39% OFF",
        category: "deportes",
        brand: "Bowflex",
        rating: 4.5,
        reviewCount: 98,
        stock: 45,
        location: "Phoenix, AZ",
        shipping: "Envío $15",
        warranty: "1 año",
        tags: ["Fitness", "Pesas", "Gimnasio", "Fuerza"],
        description: "Pesas de gimnasio de alta calidad para entrenamiento de fuerza.",
        features: ["Alta calidad", "Diseño ergonómico", "Durabilidad", "Seguridad"],
        seller: {
            name: "Bowflex",
            rating: 4.6,
            verified: true
        },
        specifications: {
            "Peso": "20kg",
            "Material": "Hierro fundido",
            "Recubrimiento": "Neopreno",
            "Grip": "Ergonómico"
        },
        smartContract: {
            address: "0x9876543210fedcba9876543210fedcba98765432",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x9876543210fedcba9876543210fedcba98765432"
        }
    },
    // Fotografía
    {
        id: "12",
        name: "Cámara DSLR Canon EOS R",
        price: 1799,
        originalPrice: 2499,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80",
        offer: "28% OFF",
        category: "fotografia",
        brand: "Canon",
        rating: 4.9,
        reviewCount: 342,
        stock: 20,
        location: "San Francisco, CA",
        shipping: "Envío gratis",
        warranty: "1 año",
        tags: ["Cámara", "DSLR", "Profesional", "Canon"],
        description: "Cámara DSLR profesional con sensor full-frame y tecnología RF avanzada.",
        features: ["Sensor full-frame", "RF Mount", "4K Video", "Dual Pixel AF"],
        seller: {
            name: "Canon Store",
            rating: 4.9,
            verified: true
        },
        specifications: {
            "Sensor": "30.3MP Full-frame",
            "Video": "4K 30fps",
            "Pantalla": "3.2 pulgadas",
            "Conectividad": "WiFi, Bluetooth"
        },
        smartContract: {
            address: "0xfedcba0987654321fedcba0987654321fedcba09",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0xfedcba0987654321fedcba0987654321fedcba09"
        }
    },
    // Comida y Bebidas
    {
        id: "13",
        name: "Cena para 2 en Restaurante Premium",
        price: 79,
        originalPrice: 150,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80",
        offer: "47% OFF",
        category: "comida",
        brand: "Gourmet Express",
        rating: 4.8,
        reviewCount: 156,
        stock: 50,
        location: "Miami, FL",
        shipping: "Reserva digital",
        warranty: "No aplica",
        tags: ["Restaurante", "Cena", "Premium", "Romántico"],
        description: "Experiencia gastronómica premium para dos personas con menú degustación completo.",
        features: ["Menú degustación", "Bebidas incluidas", "Ambiente romántico", "Reserva garantizada"],
        seller: {
            name: "Gourmet Express",
            rating: 4.8,
            verified: true
        },
        specifications: {
            "Duración": "2-3 horas",
            "Incluye": "Entrada, plato principal, postre",
            "Bebidas": "2 copas de vino",
            "Válido": "3 meses"
        },
        smartContract: {
            address: "0x1234567890abcdef1234567890abcdef12345678",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678"
        }
    },
    {
        id: "14",
        name: "Curso de Cocina Online Premium",
        price: 49,
        originalPrice: 199,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=500&q=80",
        offer: "75% OFF",
        category: "comida",
        brand: "Chef Academy",
        rating: 4.7,
        reviewCount: 89,
        stock: 1000,
        location: "Online",
        shipping: "Acceso digital",
        warranty: "Acceso de por vida",
        tags: ["Curso", "Cocina", "Online", "Premium"],
        description: "Aprende a cocinar como un chef profesional con más de 50 recetas exclusivas.",
        features: ["50+ recetas", "Videos HD", "Acceso de por vida", "Certificado"],
        seller: {
            name: "Chef Academy",
            rating: 4.7,
            verified: true
        },
        specifications: {
            "Duración": "20 horas",
            "Nivel": "Principiante-Intermedio",
            "Idioma": "Español",
            "Formato": "Video + PDF"
        },
        smartContract: {
            address: "0xabcdef1234567890abcdef1234567890abcdef12",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0xabcdef1234567890abcdef1234567890abcdef12"
        }
    },
    // Servicios
    {
        id: "15",
        name: "Sesión de Coaching Personal 1:1",
        price: 99,
        originalPrice: 200,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=500&q=80",
        offer: "50% OFF",
        category: "servicios",
        brand: "Life Coach Pro",
        rating: 4.9,
        reviewCount: 234,
        stock: 25,
        location: "Online",
        shipping: "Sesión virtual",
        warranty: "Satisfacción garantizada",
        tags: ["Coaching", "Personal", "Online", "Desarrollo"],
        description: "Sesión personalizada de coaching para alcanzar tus metas personales y profesionales.",
        features: ["Sesión 1:1", "Plan personalizado", "Seguimiento", "Material de apoyo"],
        seller: {
            name: "Life Coach Pro",
            rating: 4.9,
            verified: true
        },
        specifications: {
            "Duración": "60 minutos",
            "Modalidad": "Online",
            "Incluye": "Plan de acción",
            "Seguimiento": "1 mes"
        },
        smartContract: {
            address: "0x567890abcdef1234567890abcdef1234567890ab",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x567890abcdef1234567890abcdef1234567890ab"
        }
    },
    {
        id: "16",
        name: "Tratamiento de Belleza Premium",
        price: 89,
        originalPrice: 180,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500&q=80",
        offer: "51% OFF",
        category: "servicios",
        brand: "Beauty Spa Elite",
        rating: 4.6,
        reviewCount: 167,
        stock: 40,
        location: "Los Angeles, CA",
        shipping: "No aplica",
        warranty: "30 días",
        tags: ["Belleza", "Spa", "Premium", "Relajación"],
        description: "Tratamiento completo de belleza incluyendo facial, masaje y manicure premium.",
        features: ["Facial premium", "Masaje relajante", "Manicure", "Bebida incluida"],
        seller: {
            name: "Beauty Spa Elite",
            rating: 4.6,
            verified: true
        },
        specifications: {
            "Duración": "90 minutos",
            "Incluye": "Facial, masaje, manicure",
            "Productos": "Premium",
            "Ambiente": "Luxury"
        },
        smartContract: {
            address: "0x9876543210fedcba9876543210fedcba98765432",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x9876543210fedcba9876543210fedcba98765432"
        }
    },
    // Productos Digitales
    {
        id: "17",
        name: "Curso de Marketing Digital Avanzado",
        price: 79,
        originalPrice: 299,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80",
        offer: "74% OFF",
        category: "digital",
        brand: "Digital Academy",
        rating: 4.8,
        reviewCount: 456,
        stock: 5000,
        location: "Online",
        shipping: "Acceso digital",
        warranty: "Acceso de por vida",
        tags: ["Marketing", "Digital", "Curso", "Online"],
        description: "Domina el marketing digital con estrategias avanzadas y casos de estudio reales.",
        features: ["30+ módulos", "Casos de estudio", "Certificado", "Comunidad"],
        seller: {
            name: "Digital Academy",
            rating: 4.8,
            verified: true
        },
        specifications: {
            "Duración": "40 horas",
            "Nivel": "Avanzado",
            "Certificado": "Sí",
            "Soporte": "24/7"
        },
        smartContract: {
            address: "0xfedcba0987654321fedcba0987654321fedcba09",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0xfedcba0987654321fedcba0987654321fedcba09"
        }
    },
    {
        id: "18",
        name: "Software de Diseño Gráfico Pro",
        price: 149,
        originalPrice: 399,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=500&q=80",
        offer: "63% OFF",
        category: "digital",
        brand: "Design Pro",
        rating: 4.7,
        reviewCount: 289,
        stock: 1000,
        location: "Online",
        shipping: "Descarga digital",
        warranty: "1 año",
        tags: ["Software", "Diseño", "Profesional", "Digital"],
        description: "Software profesional de diseño gráfico con todas las herramientas avanzadas.",
        features: ["Herramientas avanzadas", "Templates premium", "Soporte técnico", "Actualizaciones"],
        seller: {
            name: "Design Pro",
            rating: 4.7,
            verified: true
        },
        specifications: {
            "Plataforma": "Windows, Mac, Linux",
            "Licencia": "1 año",
            "Actualizaciones": "Incluidas",
            "Soporte": "Técnico incluido"
        },
        smartContract: {
            address: "0x1234567890abcdef1234567890abcdef12345678",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x1234567890abcdef1234567890abcdef12345678"
        }
    },
    // Viajes
    {
        id: "19",
        name: "Paquete de Viaje a Cancún 4 Días",
        price: 599,
        originalPrice: 1200,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=500&q=80",
        offer: "50% OFF",
        category: "viajes",
        brand: "Travel Dreams",
        rating: 4.6,
        reviewCount: 178,
        stock: 30,
        location: "Cancún, México",
        shipping: "No aplica",
        warranty: "Seguro incluido",
        tags: ["Viaje", "Cancún", "Paquete", "Playa"],
        description: "Paquete completo de viaje a Cancún con hotel 4 estrellas y vuelos incluidos.",
        features: ["Hotel 4 estrellas", "Vuelos incluidos", "Traslados", "Desayuno"],
        seller: {
            name: "Travel Dreams",
            rating: 4.6,
            verified: true
        },
        specifications: {
            "Duración": "4 días / 3 noches",
            "Hotel": "4 estrellas",
            "Incluye": "Vuelos + hotel + traslados",
            "Seguro": "Viaje incluido"
        },
        smartContract: {
            address: "0xabcdef1234567890abcdef1234567890abcdef12",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0xabcdef1234567890abcdef1234567890abcdef12"
        }
    },
    // Belleza
    {
        id: "20",
        name: "Kit de Skincare Premium Completo",
        price: 89,
        originalPrice: 180,
        currency: "USD",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80",
        offer: "51% OFF",
        category: "belleza",
        brand: "SkinCare Pro",
        rating: 4.8,
        reviewCount: 234,
        stock: 150,
        location: "New York, NY",
        shipping: "Envío gratis",
        warranty: "30 días",
        tags: ["Skincare", "Premium", "Kit completo", "Natural"],
        description: "Kit completo de skincare premium con productos naturales y resultados comprobados.",
        features: ["Productos naturales", "Kit completo", "Resultados comprobados", "Sin químicos"],
        seller: {
            name: "SkinCare Pro",
            rating: 4.8,
            verified: true
        },
        specifications: {
            "Productos": "5 en 1",
            "Tipo de piel": "Todas",
            "Ingredientes": "100% Naturales",
            "Duración": "3 meses"
        },
        smartContract: {
            address: "0x567890abcdef1234567890abcdef1234567890ab",
            network: "Ethereum",
            tokenStandard: "ERC-777",
            blockchainExplorer: "https://etherscan.io/address/0x567890abcdef1234567890abcdef1234567890ab"
        }
    }
];

export default function CategoryPage() {
    const { categorySlug } = useParams<{ categorySlug: string }>();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<string>('relevance');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

    const category = categories[categorySlug || ''];
    const categoryProducts = allProducts.filter(product => product.category === categorySlug);

    if (!category) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Categoría no encontrada</h1>
                    <Link to="/" className="text-blue-600 hover:text-blue-700">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    const handleAddToCart = (productId: string) => {
        console.log('Agregando al carrito:', productId);
    };

    const handleAddToWishlist = (productId: string) => {
        console.log('Agregando a favoritos:', productId);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/" className="text-blue-200 hover:text-white transition-colors">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <span className="text-2xl">{category.icon}</span>
                        <h1 className="text-3xl font-bold">{category.name}</h1>
                    </div>
                    <p className="text-xl text-blue-100 max-w-2xl">
                        {category.description}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtros
                            </h3>

                            {/* Sort By */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ordenar por
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="relevance">Relevancia</option>
                                    <option value="price-low">Precio: Menor a Mayor</option>
                                    <option value="price-high">Precio: Mayor a Menor</option>
                                    <option value="rating">Mejor Valorados</option>
                                    <option value="newest">Más Nuevos</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rango de Precio
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Subcategories */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subcategorías
                                </label>
                                <div className="space-y-2">
                                    {category.subcategories.map((subcategory) => (
                                        <label key={subcategory} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedSubcategories.includes(subcategory)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSubcategories([...selectedSubcategories, subcategory]);
                                                    } else {
                                                        setSelectedSubcategories(selectedSubcategories.filter(s => s !== subcategory));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{subcategory}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Brands */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Marcas
                                </label>
                                <div className="space-y-2">
                                    {Array.from(new Set(categoryProducts.map(p => p.brand))).map((brand) => (
                                        <label key={brand} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedBrands([...selectedBrands, brand]);
                                                    } else {
                                                        setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{brand}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="lg:w-3/4">
                        {/* View Mode Toggle */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    <Grid className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    <List className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-gray-600">
                                {categoryProducts.length} productos encontrados
                            </p>
                        </div>

                        {/* Products */}
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                            {categoryProducts.map((product) => (
                                <div key={product.id} className={`bg-white rounded-lg shadow-md overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                                    {/* Product Image */}
                                    <div className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className={`w-full object-cover ${viewMode === 'list' ? 'h-48' : 'h-64'}`}
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                {product.offer}
                                            </span>
                                            <button
                                                onClick={() => handleAddToWishlist(product.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Heart className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {product.name}
                                        </h3>

                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center">
                                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">({product.reviewCount})</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl font-bold text-gray-900">
                                                ${product.price}
                                            </span>
                                            {product.originalPrice && (
                                                <span className="text-lg text-gray-500 line-through">
                                                    ${product.originalPrice}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-sm text-gray-600">{product.brand}</span>
                                            <span className="text-sm text-gray-500">•</span>
                                            <span className="text-sm text-gray-600">{product.location}</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAddToCart(product.id)}
                                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ShoppingCart className="h-4 w-4" />
                                                Agregar
                                            </button>
                                            <Link
                                                to={`/promotion-details/${product.id}`}
                                                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Ver
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {categoryProducts.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No se encontraron productos en esta categoría</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
