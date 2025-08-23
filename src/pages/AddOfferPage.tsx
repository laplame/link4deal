import React, { useState } from 'react';
import { ArrowLeft, Upload, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AddOfferPage() {
  const [selectedType, setSelectedType] = useState('discount');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link to="/brands" className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Brands</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="flex items-center justify-center flex-col mb-8">
              <Phone className="h-16 w-16 text-green-400 mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Get Coupon</h1>
              <p className="text-gray-400 text-center">
                Get your link, generate promos, and share
              </p>
              <p className="text-gray-400 text-center mt-2">
                Influencer, monetize your content by bringing your TikTok, YouTube, Instagram, and Facebook followers to your physical store!
              </p>
            </div>

            <form action="/upload" method="post" encType="multipart/form-data" className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Upload your promo photo
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                    </div>
                    <input type="file" name="image" className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Promo URL (optional)
                </label>
                <input
                  type="text"
                  name="telefono"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="donde"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store
                </label>
                <input
                  type="text"
                  name="tienda"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commercial Conditions
                </label>
                <textarea
                  name="condiciones"
                  rows={5}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  defaultValue="Valid only for selected products: Coupons are only valid for the specific products listed in the promotion. Expiration Date: Coupons are valid until the specified date on the coupon and cannot be used after that date. Limited to one coupon per person: Each person can only use one coupon during the promotion. Not combinable with other offers: Coupons cannot be combined with other offers or discounts. Only valid for online purchases: Coupons are only valid for online purchases and cannot be used in physical stores."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Validity End Date
                </label>
                <input
                  type="date"
                  name="fin"
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="discount">Discount</option>
                    <option value="other">Other Type</option>
                  </select>
                </div>

                {selectedType === 'discount' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount Expressed in Percentage
                    </label>
                    <input
                      type="number"
                      name="desc"
                      defaultValue="20"
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Other Information
                    </label>
                    <input
                      type="text"
                      name="otherInfo"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="categoria"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Get
              </button>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4">How does it work?</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-400">
                  <li>Upload your promo photo</li>
                  <li>Enter your registered WhatsApp number, you will receive messages from each person requesting your coupon</li>
                  <li>Enter the name of the person responsible for the promotion</li>
                  <li>Copy the code</li>
                  <li>Use it on your preferred channel or social media platform</li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}