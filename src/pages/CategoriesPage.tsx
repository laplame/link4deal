import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

interface Category {
    name: string;
    slug: string;
    subcategories: string[];
    description: string;
    icon: string;
    color: string;
    productCount: number;
}

const categories: Category[] = [
    {
        name: "Electrónica",
        slug: "electronica",
        subcategories: ["Smartphones", "Laptops", "Auriculares", "Smartwatches", "Tablets"],
        description: "Descubre las mejores ofertas en tecnología y dispositivos electrónicos",
        icon: "📱",
        color: "from-blue-500 to-cyan-500",
        productCount: 4
    },
    {
        name: "Moda",
        slug: "moda",
        subcategories: ["Ropa", "Zapatos", "Accesorios", "Bolsos", "Joyería"],
        description: "Ofertas exclusivas en moda y accesorios de las mejores marcas",
        icon: "👗",
        color: "from-pink-500 to-rose-500",
        productCount: 3
    },
    {
        name: "Hogar",
        slug: "hogar",
        subcategories: ["Muebles", "Decoración", "Cocina", "Jardín", "Iluminación"],
        description: "Transforma tu hogar con nuestras ofertas en decoración y mobiliario",
        icon: "🏠",
        color: "from-green-500 to-emerald-500",
        productCount: 2
    },
    {
        name: "Deportes",
        slug: "deportes",
        subcategories: ["Fitness", "Running", "Fútbol", "Natación", "Ciclismo"],
        description: "Equípate para tus actividades deportivas con descuentos increíbles",
        icon: "⚽",
        color: "from-orange-500 to-red-500",
        productCount: 2
    },
    {
        name: "Fotografía",
        slug: "fotografia",
        subcategories: ["Cámaras", "Lenses", "Trípodes", "Iluminación", "Accesorios"],
        description: "Captura momentos especiales con equipos profesionales a precios únicos",
        icon: "📸",
        color: "from-purple-500 to-indigo-500",
        productCount: 1
    },
    {
        name: "Comida y Bebidas",
        slug: "comida",
        subcategories: ["Restaurantes", "Delivery", "Bebidas", "Snacks", "Postres"],
        description: "Disfruta de las mejores ofertas en comida, bebidas y experiencias gastronómicas",
        icon: "🍕",
        color: "from-red-500 to-orange-500",
        productCount: 2
    },
    {
        name: "Servicios",
        slug: "servicios",
        subcategories: ["Educación", "Salud", "Belleza", "Transporte", "Entretenimiento"],
        description: "Accede a servicios premium con descuentos exclusivos y promociones especiales",
        icon: "🛠️",
        color: "from-gray-600 to-gray-800",
        productCount: 2
    },
    {
        name: "Productos Digitales",
        slug: "digital",
        subcategories: ["Software", "Cursos Online", "E-books", "Música", "Streaming"],
        description: "Descubre ofertas en productos y servicios digitales de alta calidad",
        icon: "💻",
        color: "from-indigo-500 to-purple-600",
        productCount: 2
    },
    {
        name: "Viajes y Turismo",
        slug: "viajes",
        subcategories: ["Hoteles", "Vuelos", "Paquetes", "Actividades", "Seguros"],
        description: "Explora el mundo con las mejores ofertas en viajes y experiencias turísticas",
        icon: "✈️",
        color: "from-sky-500 to-blue-600",
        productCount: 1
    },
    {
        name: "Belleza y Cuidado",
        slug: "belleza",
        subcategories: ["Cosméticos", "Skincare", "Perfumes", "Tratamientos", "Accesorios"],
        description: "Cuida tu belleza con productos premium y tratamientos especializados",
        icon: "💄",
        color: "from-rose-500 to-pink-600",
        productCount: 1
    }
];

export default function CategoriesPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/" className="text-blue-200 hover:text-white transition-colors">
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <ShoppingBag className="h-8 w-8" />
                        <h1 className="text-3xl font-bold">Categorías de Productos</h1>
                    </div>
                    <p className="text-xl text-blue-100 max-w-2xl">
                        Explora todas las categorías disponibles y encuentra las mejores ofertas en Link4Deal
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <Link
                            key={category.slug}
                            to={`/category/${category.slug}`}
                            className="group block"
                        >
                            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                                {/* Category Header */}
                                <div className={`bg-gradient-to-r ${category.color} p-6 text-white relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-4xl">{category.icon}</span>
                                            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                                                {category.productCount} productos
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                                        <p className="text-white/90 text-sm leading-relaxed">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Subcategories */}
                                <div className="p-6">
                                    <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                                        Subcategorías
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {category.subcategories.map((subcategory) => (
                                            <span
                                                key={subcategory}
                                                className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                                            >
                                                {subcategory}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Explore Button */}
                                    <div className="mt-6">
                                        <div className={`bg-gradient-to-r ${category.color} text-white py-3 px-6 rounded-xl text-center font-semibold group-hover:shadow-lg transition-all duration-300`}>
                                            Explorar {category.name}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="mt-16 text-center">
                    <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 rounded-3xl p-12 text-white">
                        <h2 className="text-3xl font-bold mb-4">
                            ¿No encuentras lo que buscas?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Nuestras categorías están en constante expansión. Si tienes una sugerencia 
                            para una nueva categoría, ¡nos encantaría escucharla!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/add-offer"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                            >
                                Crear Nueva Oferta
                            </Link>
                            <Link
                                to="/about"
                                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-900 transition-all duration-300"
                            >
                                Conocer Más
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
