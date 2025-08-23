import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Tag, 
  Calendar, 
  DollarSign, 
  Users, 
  Target,
  ShoppingCart,
  MapPin,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CouponData {
  basicInfo: {
    code: string;
    name: string;
    description: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    currency: string;
  };
  restrictions: {
    minimumPurchase: number;
    maximumDiscount: number;
    usageLimit: number;
    usagePerUser: number;
    userGroups: string[];
    excludedCategories: string[];
    excludedProducts: string[];
  };
  validity: {
    startDate: string;
    endDate: string;
    activeDays: string[];
    activeHours: {
      start: string;
      end: string;
    };
  };
  targeting: {
    location: string;
    radius: number;
    userType: 'all' | 'influencers' | 'brands' | 'agencies' | 'custom';
    customUsers: string[];
    newUsersOnly: boolean;
    returningUsersOnly: boolean;
  };
  conditions: {
    firstTimePurchase: boolean;
    minimumItems: number;
    specificCategories: boolean;
    specificBrands: boolean;
    weekendOnly: boolean;
    holidayOnly: boolean;
  };
}

export default function CreateCoupon() {
  const [currentStep, setCurrentStep] = useState(1);
  const [couponData, setCouponData] = useState<CouponData>({
    basicInfo: {
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      currency: 'MXN'
    },
    restrictions: {
      minimumPurchase: 0,
      maximumDiscount: 0,
      usageLimit: 1000,
      usagePerUser: 1,
      userGroups: [],
      excludedCategories: [],
      excludedProducts: []
    },
    validity: {
      startDate: '',
      endDate: '',
      activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      activeHours: {
        start: '09:00',
        end: '18:00'
      }
    },
    targeting: {
      location: '',
      radius: 10,
      userType: 'all',
      customUsers: [],
      newUsersOnly: false,
      returningUsersOnly: false
    },
    conditions: {
      firstTimePurchase: false,
      minimumItems: 1,
      specificCategories: false,
      specificBrands: false,
      weekendOnly: false,
      holidayOnly: false
    }
  });

  const [errors, setErrors] = useState<Partial<CouponData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, title: 'Información Básica', icon: Tag },
    { id: 2, title: 'Restricciones', icon: Target },
    { id: 3, title: 'Validez', icon: Calendar },
    { id: 4, title: 'Segmentación', icon: Users },
    { id: 5, title: 'Condiciones', icon: CheckCircle }
  ];

  const couponTypes = [
    { value: 'percentage', label: 'Porcentaje de descuento', icon: DollarSign },
    { value: 'fixed', label: 'Descuento fijo', icon: DollarSign },
    { value: 'free_shipping', label: 'Envío gratuito', icon: ShoppingCart }
  ];

  const currencies = ['MXN', 'USD', 'EUR', 'ARS', 'COP'];
  const daysOfWeek = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  const userTypes = [
    { value: 'all', label: 'Todos los usuarios', icon: Users },
    { value: 'influencers', label: 'Solo influencers', icon: Users },
    { value: 'brands', label: 'Solo marcas', icon: Users },
    { value: 'agencies', label: 'Solo agencias', icon: Users },
    { value: 'custom', label: 'Usuarios específicos', icon: Users }
  ];

  const handleInputChange = (section: keyof CouponData, field: string, value: any) => {
    setCouponData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear error when user starts typing
    if (errors[section] && (errors[section] as any)[field]) {
      setErrors(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: undefined
        }
      }));
    }
  };

  const handleArrayChange = (section: keyof CouponData, field: string, value: string, action: 'add' | 'remove') => {
    setCouponData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: action === 'add' 
          ? [...(prev[section] as any)[field], value]
          : (prev[section] as any)[field].filter((item: string) => item !== value)
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<CouponData> = {};

    switch (step) {
      case 1:
        if (!couponData.basicInfo.code) newErrors.basicInfo = { ...newErrors.basicInfo, code: 'Código del cupón requerido' };
        if (!couponData.basicInfo.name) newErrors.basicInfo = { ...newErrors.basicInfo, name: 'Nombre del cupón requerido' };
        if (couponData.basicInfo.value <= 0) newErrors.basicInfo = { ...newErrors.basicInfo, value: 'Valor del descuento debe ser mayor a 0' };
        if (couponData.basicInfo.type === 'percentage' && couponData.basicInfo.value > 100) {
          newErrors.basicInfo = { ...newErrors.basicInfo, value: 'El porcentaje no puede ser mayor al 100%' };
        }
        break;
      case 2:
        if (couponData.restrictions.minimumPurchase < 0) newErrors.restrictions = { ...newErrors.restrictions, minimumPurchase: 'La compra mínima no puede ser negativa' };
        if (couponData.restrictions.usageLimit <= 0) newErrors.restrictions = { ...newErrors.restrictions, usageLimit: 'El límite de uso debe ser mayor a 0' };
        break;
      case 3:
        if (!couponData.validity.startDate) newErrors.validity = { ...newErrors.validity, startDate: 'Fecha de inicio requerida' };
        if (!couponData.validity.endDate) newErrors.validity = { ...newErrors.validity, endDate: 'Fecha de fin requerida' };
        if (new Date(couponData.validity.startDate) >= new Date(couponData.validity.endDate)) {
          newErrors.validity = { ...newErrors.validity, endDate: 'La fecha de fin debe ser posterior a la fecha de inicio' };
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    // Navigate to success or coupon list
    console.log('Cupón creado:', couponData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Información Básica del Cupón</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  value={couponData.basicInfo.code}
                  onChange={(e) => handleInputChange('basicInfo', 'code', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                    errors.basicInfo?.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="DESCUENTO20"
                />
                {errors.basicInfo?.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.basicInfo.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cupón *
                </label>
                <input
                  type="text"
                  value={couponData.basicInfo.name}
                  onChange={(e) => handleInputChange('basicInfo', 'name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.basicInfo?.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Descuento del 20%"
                />
                {errors.basicInfo?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.basicInfo.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={couponData.basicInfo.description}
                  onChange={(e) => handleInputChange('basicInfo', 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe el cupón y sus beneficios..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cupón *
                </label>
                <select
                  value={couponData.basicInfo.type}
                  onChange={(e) => handleInputChange('basicInfo', 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {couponTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor del Descuento *
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={couponData.basicInfo.value}
                    onChange={(e) => handleInputChange('basicInfo', 'value', parseFloat(e.target.value) || 0)}
                    className={`flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.basicInfo?.value ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="20"
                    min="0"
                    step="0.01"
                  />
                  <select
                    value={couponData.basicInfo.currency}
                    onChange={(e) => handleInputChange('basicInfo', 'currency', e.target.value)}
                    className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
                {errors.basicInfo?.value && (
                  <p className="mt-1 text-sm text-red-600">{errors.basicInfo.value}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {couponData.basicInfo.type === 'percentage' ? 'Porcentaje (0-100)' : 'Monto fijo en la moneda seleccionada'}
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Restricciones y Límites</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compra Mínima
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={couponData.restrictions.minimumPurchase}
                    onChange={(e) => handleInputChange('restrictions', 'minimumPurchase', parseFloat(e.target.value) || 0)}
                    className={`flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.restrictions?.minimumPurchase ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500">
                    {couponData.basicInfo.currency}
                  </span>
                </div>
                {errors.restrictions?.minimumPurchase && (
                  <p className="mt-1 text-sm text-red-600">{errors.restrictions.minimumPurchase}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">0 = Sin compra mínima</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento Máximo
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={couponData.restrictions.maximumDiscount}
                    onChange={(e) => handleInputChange('restrictions', 'maximumDiscount', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500">
                    {couponData.basicInfo.currency}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">0 = Sin límite máximo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite Total de Uso *
                </label>
                <input
                  type="number"
                  value={couponData.restrictions.usageLimit}
                  onChange={(e) => handleInputChange('restrictions', 'usageLimit', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.restrictions?.usageLimit ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1000"
                  min="1"
                />
                {errors.restrictions?.usageLimit && (
                  <p className="mt-1 text-sm text-red-600">{errors.restrictions.usageLimit}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uso por Usuario
                </label>
                <input
                  type="number"
                  value={couponData.restrictions.usagePerUser}
                  onChange={(e) => handleInputChange('restrictions', 'usagePerUser', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-500">Número de veces que un usuario puede usar este cupón</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Restricciones Adicionales</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Puedes configurar restricciones más específicas como categorías excluidas, 
                    grupos de usuarios específicos y productos no elegibles en los siguientes pasos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Validez y Horarios</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="datetime-local"
                  value={couponData.validity.startDate}
                  onChange={(e) => handleInputChange('validity', 'startDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.validity?.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.validity?.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.validity.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin *
                </label>
                <input
                  type="datetime-local"
                  value={couponData.validity.endDate}
                  onChange={(e) => handleInputChange('validity', 'endDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.validity?.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.validity?.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.validity.endDate}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de la Semana Activos
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeek.map(day => (
                    <label key={day.value} className="flex items-center justify-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={couponData.validity.activeDays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleArrayChange('validity', 'activeDays', day.value, 'add');
                          } else {
                            handleArrayChange('validity', 'activeDays', day.value, 'remove');
                          }
                        }}
                        className="sr-only"
                      />
                      <span className={`text-sm font-medium ${
                        couponData.validity.activeDays.includes(day.value)
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}>
                        {day.label.slice(0, 3)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={couponData.validity.activeHours.start}
                  onChange={(e) => handleInputChange('validity', 'activeHours', { ...couponData.validity.activeHours, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Fin
                </label>
                <input
                  type="time"
                  value={couponData.validity.activeHours.end}
                  onChange={(e) => handleInputChange('validity', 'activeHours', { ...couponData.validity.activeHours, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Segmentación de Usuarios</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuario *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userTypes.map(userType => (
                    <label key={userType.value} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <input
                        type="radio"
                        name="userType"
                        value={userType.value}
                        checked={couponData.targeting.userType === userType.value}
                        onChange={(e) => handleInputChange('targeting', 'userType', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border-2 rounded-full mr-3 ${
                        couponData.targeting.userType === userType.value
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {couponData.targeting.userType === userType.value && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <userType.icon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{userType.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {couponData.targeting.userType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuarios Específicos
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingresa los IDs o emails de usuarios separados por comas..."
                  />
                  <p className="mt-1 text-xs text-gray-500">Separa múltiples usuarios con comas</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={couponData.targeting.location}
                    onChange={(e) => handleInputChange('targeting', 'location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ciudad, Estado, País"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radio de Proximidad (km)
                  </label>
                  <input
                    type="number"
                    value={couponData.targeting.radius}
                    onChange={(e) => handleInputChange('targeting', 'radius', parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={couponData.targeting.newUsersOnly}
                    onChange={(e) => handleInputChange('targeting', 'newUsersOnly', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Solo usuarios nuevos</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={couponData.targeting.returningUsersOnly}
                    onChange={(e) => handleInputChange('targeting', 'returningUsersOnly', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Solo usuarios recurrentes</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Condiciones Adicionales</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compra Mínima de Artículos
                  </label>
                  <input
                    type="number"
                    value={couponData.conditions.minimumItems}
                    onChange={(e) => handleInputChange('conditions', 'minimumItems', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                    min="1"
                  />
                  <p className="mt-1 text-xs text-gray-500">Número mínimo de artículos en el carrito</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={couponData.conditions.firstTimePurchase}
                      onChange={(e) => handleInputChange('conditions', 'firstTimePurchase', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Primera compra únicamente</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={couponData.conditions.weekendOnly}
                      onChange={(e) => handleInputChange('conditions', 'weekendOnly', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Solo fines de semana</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={couponData.conditions.holidayOnly}
                      onChange={(e) => handleInputChange('conditions', 'holidayOnly', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Solo días festivos</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Resumen del Cupón</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Código:</span>
                    <span className="font-medium text-gray-900">{couponData.basicInfo.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium text-gray-900">
                      {couponTypes.find(t => t.value === couponData.basicInfo.type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium text-gray-900">
                      {couponData.basicInfo.value}
                      {couponData.basicInfo.type === 'percentage' ? '%' : ` ${couponData.basicInfo.currency}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compra mínima:</span>
                    <span className="font-medium text-gray-900">
                      {couponData.restrictions.minimumPurchase > 0 
                        ? `${couponData.restrictions.minimumPurchase} ${couponData.basicInfo.currency}`
                        : 'Sin mínimo'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usos totales:</span>
                    <span className="font-medium text-gray-900">{couponData.restrictions.usageLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usos por usuario:</span>
                    <span className="font-medium text-gray-900">{couponData.restrictions.usagePerUser}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              to="/admin" 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Crear Cupón
              </h1>
              <p className="text-gray-600 mt-1">
                Configura cupones y descuentos para tu plataforma
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span 
                key={step.id}
                className={`text-xs font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Siguiente
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando Cupón...
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4" />
                    Crear Cupón
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
