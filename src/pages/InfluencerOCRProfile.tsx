import React, { useState, useRef, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Globe,
  Users,
  Heart,
  MessageCircle,
  Share2,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  ArrowLeft,
  Plus,
  Edit3,
  Save,
  RefreshCw,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SocialMediaPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  fields: string[];
}

interface ExtractedData {
  platform: string;
  data: Record<string, any>;
  confidence: number;
  timestamp: string;
}

interface InfluencerProfile {
  name: string;
  username: string;
  platforms: string[];
  totalFollowers: number;
  totalEngagement: number;
  totalPosts: number;
  averageLikes: number;
  averageComments: number;
  averageShares: number;
  categories: string[];
  location: string;
  bio: string;
  website?: string;
  email?: string;
  phone?: string;
  extractedData: ExtractedData[];
}

export default function InfluencerOCRProfile() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedProfiles, setExtractedProfiles] = useState<InfluencerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<InfluencerProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const socialMediaPlatforms: SocialMediaPlatform[] = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram className="h-5 w-5" />,
      color: 'from-pink-500 to-purple-600',
      fields: ['followers', 'following', 'posts', 'bio', 'verified', 'engagement_rate']
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: <Globe className="h-5 w-5" />,
      color: 'from-black to-gray-800',
      fields: ['followers', 'following', 'likes', 'videos', 'bio', 'verified']
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube className="h-5 w-5" />,
      color: 'from-red-500 to-red-700',
      fields: ['subscribers', 'videos', 'views', 'description', 'verified', 'join_date']
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: <Twitter className="h-5 w-5" />,
      color: 'from-blue-400 to-blue-600',
      fields: ['followers', 'following', 'tweets', 'bio', 'verified', 'join_date']
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="h-5 w-5" />,
      color: 'from-blue-600 to-blue-800',
      fields: ['followers', 'likes', 'posts', 'about', 'verified', 'category']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin className="h-5 w-5" />,
      color: 'from-blue-700 to-blue-900',
      fields: ['connections', 'posts', 'headline', 'about', 'verified', 'company']
    }
  ];

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && 
      !selectedFiles.some(existing => existing.name === file.name)
    );

    if (newFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Generate preview URLs
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [selectedFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-purple-500', 'bg-purple-50');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-purple-500', 'bg-purple-50');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-purple-500', 'bg-purple-50');
    }
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setOcrResults([]);
  };

  const detectPlatform = (imageData: string): string => {
    // Simulación de detección de plataforma basada en características visuales
    // En producción, esto se haría con ML/Computer Vision
    const randomPlatforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin'];
    return randomPlatforms[Math.floor(Math.random() * randomPlatforms.length)];
  };

  const simulateOCR = async (file: File, platform: string): Promise<any> => {
    // Simulación de OCR - en producción se usaría Tesseract.js o una API
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const mockData = {
      platform,
      confidence: 0.85 + Math.random() * 0.15,
      data: generateMockData(platform),
      timestamp: new Date().toISOString()
    };

    return mockData;
  };

  const generateMockData = (platform: string): Record<string, any> => {
    const baseData: Record<string, any> = {
      name: 'María García',
      username: '@mariagarcia',
      bio: 'Influencer de moda y lifestyle. Compartiendo mi pasión por la moda y los viajes.',
      verified: Math.random() > 0.5,
      location: 'Madrid, España',
      website: 'https://mariagarcia.com',
      email: 'maria@mariagarcia.com'
    };

    switch (platform) {
      case 'instagram':
        return {
          ...baseData,
          followers: Math.floor(Math.random() * 500000) + 10000,
          following: Math.floor(Math.random() * 1000) + 100,
          posts: Math.floor(Math.random() * 500) + 50,
          engagement_rate: (Math.random() * 5 + 2).toFixed(2),
          average_likes: Math.floor(Math.random() * 5000) + 500,
          average_comments: Math.floor(Math.random() * 200) + 20
        };
      case 'tiktok':
        return {
          ...baseData,
          followers: Math.floor(Math.random() * 1000000) + 50000,
          following: Math.floor(Math.random() * 2000) + 200,
          likes: Math.floor(Math.random() * 5000000) + 100000,
          videos: Math.floor(Math.random() * 200) + 30
        };
      case 'youtube':
        return {
          ...baseData,
          subscribers: Math.floor(Math.random() * 200000) + 10000,
          videos: Math.floor(Math.random() * 100) + 20,
          views: Math.floor(Math.random() * 10000000) + 500000,
          join_date: '2020-03-15'
        };
      default:
        return baseData;
    }
  };

  const processImages = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setCurrentStep(0);

    const results = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      setCurrentStep(i + 1);
      const platform = detectPlatform(previewUrls[i]);
      const result = await simulateOCR(selectedFiles[i], platform);
      results.push(result);
      setOcrResults(prev => [...prev, result]);
    }

    // Consolidar datos en un perfil
    const consolidatedProfile = consolidateProfileData(results);
    setExtractedProfiles(prev => [...prev, consolidatedProfile]);

    setIsProcessing(false);
    setCurrentStep(0);
  };

  const consolidateProfileData = (ocrResults: any[]): InfluencerProfile => {
    // Consolidar datos de múltiples plataformas
    const allData = ocrResults.reduce((acc, result) => {
      Object.assign(acc, result.data);
      return acc;
    }, {});

    const platforms = ocrResults.map(r => r.platform);
    const totalFollowers = ocrResults.reduce((sum, r) => {
      const followers = r.data.followers || r.data.subscribers || 0;
      return sum + followers;
    }, 0);

    return {
      name: allData.name || 'Nombre no detectado',
      username: allData.username || '@username',
      platforms,
      totalFollowers,
      totalEngagement: allData.engagement_rate || 0,
      totalPosts: allData.posts || allData.videos || 0,
      averageLikes: allData.average_likes || 0,
      averageComments: allData.average_comments || 0,
      averageShares: 0,
      categories: ['Moda', 'Lifestyle', 'Viajes'],
      location: allData.location || 'Ubicación no detectada',
      bio: allData.bio || 'Biografía no detectada',
      website: allData.website,
      email: allData.email,
      phone: allData.phone,
      extractedData: ocrResults
    };
  };

  const openProfileModal = (profile: InfluencerProfile) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  const saveProfile = (profile: InfluencerProfile) => {
    // Aquí se guardaría en la base de datos
    console.log('Guardando perfil:', profile);
    setShowProfileModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/" className="text-purple-200 hover:text-white transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <Camera className="h-8 w-8" />
            <h1 className="text-3xl font-bold">OCR de Perfiles de Influencers</h1>
          </div>
          <p className="text-xl text-purple-100 max-w-3xl">
            Extrae automáticamente datos de perfiles de influencers desde capturas de pantalla de redes sociales
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subir Capturas de Pantalla</h2>
          
          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all duration-200 hover:border-purple-400 hover:bg-purple-50"
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arrastra y suelta capturas de pantalla aquí
            </p>
            <p className="text-gray-500 mb-4">
              O haz clic para seleccionar archivos
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Seleccionar Archivos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Archivos Seleccionados ({selectedFiles.length})
                </h3>
                <button
                  onClick={clearAllFiles}
                  className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar Todo
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="relative">
                      <img
                        src={previewUrls[index]}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Process Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={processImages}
                  disabled={isProcessing}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Procesando... ({currentStep}/{selectedFiles.length})
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Procesar con OCR
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Procesando Imágenes</h3>
            <div className="space-y-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : index === currentStep ? (
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                    ) : (
                      <span className="text-sm text-gray-500">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index < currentStep ? 'bg-green-600 w-full' : 
                          index === currentStep ? 'bg-blue-600 w-1/2' : 
                          'bg-gray-300 w-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resultados del OCR</h2>
            <div className="space-y-4">
              {ocrResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {socialMediaPlatforms.find(p => p.id === result.platform)?.icon}
                      <span className="font-medium text-gray-900 capitalize">
                        {result.platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Confianza: {(result.confidence * 100).toFixed(1)}%
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        result.confidence > 0.8 ? 'bg-green-500' :
                        result.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(result.data).slice(0, 8).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <p className="font-medium text-gray-900">
                          {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Profiles */}
        {extractedProfiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Perfiles Extraídos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {extractedProfiles.map((profile, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                      <p className="text-gray-600">{profile.username}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {profile.platforms.map(platform => {
                        const platformInfo = socialMediaPlatforms.find(p => p.id === platform);
                        return platformInfo ? (
                          <div key={platform} className={`p-2 rounded-full bg-gradient-to-r ${platformInfo.color} text-white`}>
                            {platformInfo.icon}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Seguidores:</span>
                      <span className="font-medium">{(profile.totalFollowers / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Posts:</span>
                      <span className="font-medium">{profile.totalPosts}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Engagement:</span>
                      <span className="font-medium">{profile.totalEngagement}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ubicación:</span>
                      <span className="font-medium">{profile.location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openProfileModal(profile)}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => saveProfile(profile)}
                      className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Details Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                Perfil de {selectedProfile.name}
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={selectedProfile.name}
                      onChange={(e) => setSelectedProfile({...selectedProfile, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={selectedProfile.username}
                      onChange={(e) => setSelectedProfile({...selectedProfile, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                    <textarea
                      value={selectedProfile.bio}
                      onChange={(e) => setSelectedProfile({...selectedProfile, bio: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input
                      type="text"
                      value={selectedProfile.location}
                      onChange={(e) => setSelectedProfile({...selectedProfile, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Seguidores</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(selectedProfile.totalFollowers / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Posts</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{selectedProfile.totalPosts}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-gray-700">Engagement</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{selectedProfile.totalEngagement}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Promedio Likes</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(selectedProfile.averageLikes / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Plataformas</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedProfile.platforms.map(platform => {
                  const platformInfo = socialMediaPlatforms.find(p => p.id === platform);
                  return platformInfo ? (
                    <div key={platform} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-full bg-gradient-to-r ${platformInfo.color} text-white`}>
                          {platformInfo.icon}
                        </div>
                        <span className="font-medium text-gray-900 capitalize">{platform}</span>
                      </div>
                      <div className="space-y-2">
                        {platformInfo.fields.slice(0, 4).map(field => {
                          const value = selectedProfile.extractedData.find(d => d.platform === platform)?.data[field];
                          return value ? (
                            <div key={field} className="text-sm">
                              <span className="text-gray-500 capitalize">{field.replace(/_/g, ' ')}:</span>
                              <p className="font-medium text-gray-900">
                                {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                              </p>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => saveProfile(selectedProfile)}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                Guardar Perfil
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
