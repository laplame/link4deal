import React, { useState } from 'react';
import { Building2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AddBrandPage() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: {
      en: '',
      es: ''
    },
    commission: '',
    price: {
      min: '',
      max: ''
    },
    image: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'brand',
          data: formData
        })
      });
      
      if (response.ok) {
        alert('Brand added successfully!');
      } else {
        throw new Error('Failed to add brand');
      }
    } catch (error) {
      alert('Error adding brand');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link to="/brands" className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Brands</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Building2 className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">List Your Brand</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                <option value="Fashion">Fashion</option>
                <option value="Tech">Tech</option>
                <option value="Beauty">Beauty</option>
                <option value="Fitness">Fitness</option>
                <option value="Food & Beverage">Food & Beverage</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sub-Category (English)
                </label>
                <select
                  required
                  value={formData.subCategory.en}
                  onChange={(e) => setFormData({
                    ...formData,
                    subCategory: { ...formData.subCategory, en: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a sub-category</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Wellness">Wellness</option>
                  <option value="Technology">Technology</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Minimalism">Minimalism</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sub-Category (Spanish)
                </label>
                <select
                  required
                  value={formData.subCategory.es}
                  onChange={(e) => setFormData({
                    ...formData,
                    subCategory: { ...formData.subCategory, es: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a sub-category</option>
                  <option value="Sostenibilidad y Conciencia Ecológica">Sostenibilidad y Conciencia Ecológica</option>
                  <option value="Bienestar y Salud Integral">Bienestar y Salud Integral</option>
                  <option value="Tecnología e Innovación">Tecnología e Innovación</option>
                  <option value="Lujo y Exclusividad">Lujo y Exclusividad</option>
                  <option value="Minimalismo y Simplicidad">Minimalismo y Simplicidad</option>
                  <option value="Seguridad y Estabilidad">Seguridad y Estabilidad</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Commission Rate
              </label>
              <input
                type="text"
                required
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15-20%"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Price ($)
                </label>
                <input
                  type="number"
                  required
                  value={formData.price.min}
                  onChange={(e) => setFormData({
                    ...formData,
                    price: { ...formData.price, min: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Price ($)
                </label>
                <input
                  type="number"
                  required
                  value={formData.price.max}
                  onChange={(e) => setFormData({
                    ...formData,
                    price: { ...formData.price, max: e.target.value }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Image URL
              </label>
              <input
                type="url"
                required
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Brand Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                placeholder="Describe your brand and what you're looking for in influencers..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              List Brand
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}