import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Building2, 
    Upload, 
    Plus, 
    X,
    Users,
    Globe,
    DollarSign,
    CheckCircle,
    FileText,
    Award,
    Briefcase
} from 'lucide-react';

interface AgencyService {
    id: string;
    name: string;
    selected: boolean;
}

interface TeamMember {
    name: string;
    position: string;
    expertise: string[];
    experience: number;
}

const AgencySetup: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form data
    const [formData, setFormData] = useState({
        agencyName: '',
        type: '',
        founded: new Date().getFullYear(),
        employees: '',
        headquarters: '',
        website: '',
        description: '',
        services: [] as string[],
        team: [] as TeamMember[],
        clients: [] as string[],
        documents: [] as File[],
        logo: null as File | null
    });

    const [newTeamMember, setNewTeamMember] = useState({
        name: '',
        position: '',
        expertise: '',
        experience: 1
    });

    const [newClient, setNewClient] = useState({
        name: '',
        industry: '',
        services: '',
        duration: '',
        results: ''
    });

    const agencyTypes = [
        'influencer-marketing',
        'social-media-management',
        'content-creation',
        'brand-strategy',
        'creative-design',
        'media-buying',
        'public-relations',
        'event-marketing',
        'performance-marketing',
        'analytics',
        'full-service',
        'specialized'
    ];

    const agencyServices: AgencyService[] = [
        { id: 'influencer-marketing', name: 'Influencer Marketing', selected: false },
        { id: 'social-media-management', name: 'Gestión de Redes Sociales', selected: false },
        { id: 'content-creation', name: 'Creación de Contenido', selected: false },
        { id: 'brand-strategy', name: 'Estrategia de Marca', selected: false },
        { id: 'creative-design', name: 'Diseño Creativo', selected: false },
        { id: 'media-buying', name: 'Compra de Medios', selected: false },
        { id: 'public-relations', name: 'Relaciones Públicas', selected: false },
        { id: 'event-marketing', name: 'Marketing de Eventos', selected: false },
        { id: 'performance-marketing', name: 'Marketing de Performance', selected: false },
        { id: 'analytics', name: 'Analytics y Reportes', selected: false }
    ];

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleServiceToggle = (serviceId: string) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.includes(serviceId)
                ? prev.services.filter(id => id !== serviceId)
                : [...prev.services, serviceId]
        }));
    };

    const handleAddTeamMember = () => {
        if (newTeamMember.name && newTeamMember.position) {
            setFormData(prev => ({
                ...prev,
                team: [...prev.team, { ...newTeamMember }]
            }));
            setNewTeamMember({ name: '', position: '', expertise: '', experience: 1 });
        }
    };

    const handleRemoveTeamMember = (index: number) => {
        setFormData(prev => ({
            ...prev,
            team: prev.team.filter((_, i) => i !== index)
        }));
    };

    const handleAddClient = () => {
        if (newClient.name && newClient.industry) {
            setFormData(prev => ({
                ...prev,
                clients: [...prev.clients, { ...newClient }]
            }));
            setNewClient({ name: '', industry: '', services: '', duration: '', results: '' });
        }
    };

    const handleRemoveClient = (index: number) => {
        setFormData(prev => ({
            ...prev,
            clients: prev.clients.filter((_, i) => i !== index)
        }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'documents') => {
        const files = Array.from(event.target.files || []);
        
        if (type === 'logo') {
            setFormData(prev => ({
                ...prev,
                logo: files[0] || null
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                documents: [...prev.documents, ...files]
            }));
        }
    };

    const handleRemoveFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        
        try {
            // Aquí se haría la llamada a la API para crear el perfil de agencia
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Redirigir al dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error al crear perfil de agencia:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de la Agencia</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Agencia *
                </label>
                <input
                    type="text"
                    value={formData.agencyName}
                    onChange={(e) => handleInputChange('agencyName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre oficial de tu agencia"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Agencia *
                </label>
                <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Seleccionar tipo</option>
                    {agencyTypes.map(type => (
                        <option key={type} value={type}>
                            {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de la Agencia *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe qué hace tu agencia, su misión y valores..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año de Fundación
                    </label>
                    <select
                        value={formData.founded}
                        onChange={(e) => handleInputChange('founded', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Empleados
                    </label>
                    <select
                        value={formData.employees}
                        onChange={(e) => handleInputChange('employees', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccionar</option>
                        <option value="2-5">2-5</option>
                        <option value="6-10">6-10</option>
                        <option value="11-25">11-25</option>
                        <option value="26-50">26-50</option>
                        <option value="51-100">51-100</option>
                        <option value="100+">100+</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sede Principal
                    </label>
                    <input
                        type="text"
                        value={formData.headquarters}
                        onChange={(e) => handleInputChange('headquarters', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ciudad, País"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                </label>
                <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.tuagencia.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de la Agencia
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.logo ? (
                        <div className="flex items-center justify-center space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <img 
                                    src={URL.createObjectURL(formData.logo)} 
                                    alt="Logo preview" 
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-900">{formData.logo.name}</p>
                                <p className="text-sm text-gray-500">
                                    ({(formData.logo.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                                <label htmlFor="logo-upload" className="cursor-pointer">
                                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                                        Haz clic para subir logo
                                    </span>
                                </label>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                    className="sr-only"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                PNG, JPG, SVG hasta 5MB
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios y Equipo</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicios Ofrecidos
                </label>
                <p className="text-sm text-gray-600 mb-4">Selecciona los servicios que ofrece tu agencia</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {agencyServices.map(service => (
                        <button
                            key={service.id}
                            type="button"
                            onClick={() => handleServiceToggle(service.id)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                formData.services.includes(service.id)
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {service.name}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipo de Trabajo
                </label>
                <p className="text-sm text-gray-600 mb-4">Agrega los miembros clave de tu equipo</p>
                
                <div className="space-y-4">
                    {formData.team.map((member, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-gray-500">- {member.position}</span>
                                    <span className="text-sm text-gray-600">({member.experience} años)</span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {member.expertise}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveTeamMember(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                            type="text"
                            value={newTeamMember.name}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nombre"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <input
                            type="text"
                            value={newTeamMember.position}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, position: e.target.value }))}
                            placeholder="Posición"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <input
                            type="text"
                            value={newTeamMember.expertise}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, expertise: e.target.value }))}
                            placeholder="Especialidad"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <button
                            type="button"
                            onClick={handleAddTeamMember}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clientes y Portfolio
                </label>
                <p className="text-sm text-gray-600 mb-4">Agrega algunos de tus clientes más importantes</p>
                
                <div className="space-y-4">
                    {formData.clients.map((client, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{client.name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveClient(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-sm text-gray-600">
                                <p><strong>Industria:</strong> {client.industry}</p>
                                <p><strong>Servicios:</strong> {client.services}</p>
                                <p><strong>Duración:</strong> {client.duration}</p>
                                <p><strong>Resultados:</strong> {client.results}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={newClient.name}
                            onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nombre del cliente"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <input
                            type="text"
                            value={newClient.industry}
                            onChange={(e) => setNewClient(prev => ({ ...prev, industry: e.target.value }))}
                            placeholder="Industria"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <input
                            type="text"
                            value={newClient.services}
                            onChange={(e) => setNewClient(prev => ({ ...prev, services: e.target.value }))}
                            placeholder="Servicios proporcionados"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <input
                            type="text"
                            value={newClient.duration}
                            onChange={(e) => setNewClient(prev => ({ ...prev, duration: e.target.value }))}
                            placeholder="Duración del proyecto"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <div className="md:col-span-2">
                            <input
                                type="text"
                                value={newClient.results}
                                onChange={(e) => setNewClient(prev => ({ ...prev, results: e.target.value }))}
                                placeholder="Resultados obtenidos"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={handleAddClient}
                                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                <Plus className="w-4 h-4 inline mr-2" />
                                Agregar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Documentos y Verificación</h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documentos de Verificación
                </label>
                <p className="text-sm text-gray-600 mb-4">Sube los documentos necesarios para verificar tu agencia</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                        <label htmlFor="documents-upload" className="cursor-pointer">
                            <span className="text-blue-600 hover:text-blue-500 font-medium">
                                Haz clic para subir documentos
                            </span>
                            <span className="text-gray-500"> o arrastra y suelta</span>
                        </label>
                        <input
                            id="documents-upload"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, 'documents')}
                            className="sr-only"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, JPG hasta 10MB por archivo
                    </p>
                </div>

                {formData.documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {formData.documents.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                        <span className="text-xs text-gray-600">
                                            {file.name.split('.').pop()?.toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Documentos Requeridos</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Registro de agencia o acta constitutiva</li>
                    <li>• Identificación fiscal (RFC)</li>
                    <li>• Comprobante de domicilio</li>
                    <li>• Portfolio de clientes y trabajos</li>
                    <li>• Política de privacidad</li>
                    <li>• Términos y condiciones</li>
                </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Próximos pasos</h3>
                <ul className="text-sm text-green-800 space-y-1">
                    <li>• Revisaremos tu información en 24-48 horas</li>
                    <li>• Te contactaremos para verificación si es necesario</li>
                    <li>• Una vez aprobado, podrás gestionar marcas e influencers</li>
                </ul>
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            default:
                return renderStep1();
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.agencyName && formData.type && formData.description;
            case 2:
                return formData.services.length > 0 && formData.team.length > 0;
            case 3:
                return formData.documents.length > 0;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/user-type-selector" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-5 h-5" />
                            <span>Volver</span>
                        </Link>
                        
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                                Paso {currentStep} de 3
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(currentStep / 3) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mb-4">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Configura tu perfil de Agencia
                    </h1>
                    <p className="text-gray-600">
                        Completa la información para crear tu perfil de agencia profesional
                    </p>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    {renderStepContent()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            currentStep === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Anterior
                    </button>

                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                canProceed()
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Siguiente
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !canProceed()}
                            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                                isLoading || !canProceed()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creando perfil...
                                </>
                            ) : (
                                'Crear perfil de Agencia'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgencySetup;
