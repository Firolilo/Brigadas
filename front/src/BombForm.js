import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api/brigada';

// Section configuration with API endpoints and validation rules
const SECTIONS = [
    {
        id: 'info',
        name: 'Información de la Brigada',
        endpoint: '', // Empty string because the base route is already '/api/brigada'
        fields: ['nombre', 'cantidadactivos', 'nombrecomandante', 'celularcomandante', 'encargadologistica', 'celularlogistica', 'numerosemergencia'],
        required: ['nombre', 'cantidadactivos', 'nombrecomandante', 'celularcomandante']
    },
    {
        id: 'epp',
        name: 'Equipamiento EPP',
        endpoint: '/epp-ropa',
        fields: ['tipo', 'talla', 'cantidad', 'observaciones']
    },
    {
        id: 'tools',
        name: 'Herramientas',
        endpoint: '/herramientas',
        fields: ['nombre', 'cantidad', 'observaciones']
    },
    {
        id: 'logistics',
        name: 'Logística Vehículos',
        endpoint: '/logistica-repuestos',
        fields: ['tipo', 'descripcion', 'cantidad', 'observaciones']
    },
    {
        id: 'food',
        name: 'Alimentación',
        endpoint: '/alimentacion',
        fields: ['tipo', 'descripcion', 'cantidad', 'observaciones']
    },
    {
        id: 'camp',
        name: 'Equipo de Campo',
        endpoint: '/logistica-campo',
        fields: ['tipo', 'descripcion', 'cantidad', 'observaciones']
    },
    {
        id: 'hygiene',
        name: 'Limpieza Personal',
        endpoint: '/limpieza-personal',
        fields: ['tipo', 'descripcion', 'cantidad', 'observaciones']
    },
    {
        id: 'meds',
        name: 'Medicamentos',
        endpoint: '/medicamentos',
        fields: ['nombre', 'presentacion', 'cantidad', 'observaciones']
    },
    {
        id: 'animals',
        name: 'Rescate Animal',
        endpoint: '/rescate-animal',
        fields: ['tipo', 'descripcion', 'cantidad', 'observaciones']
    }
];

const BombForm = () => {
    const [activeSection, setActiveSection] = useState('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ success: null, message: '' });
    const [brigadaId, setBrigadaId] = useState(null);
    const [completedSections, setCompletedSections] = useState({});
    const [formErrors, setFormErrors] = useState({});

    // Initialize form data structure
    const [formData, setFormData] = useState({
        // Brigada Info
        nombre: '',
        cantidadactivos: 0,
        nombrecomandante: '',
        celularcomandante: '',
        encargadologistica: '',
        celularlogistica: '',
        numerosemergencia: '',
        
        // Other sections will be managed separately
        eppRopa: [],
        eppEquipo: [],
        herramientas: [],
        logisticaRepuestos: [],
        alimentacion: [],
        logisticaCampo: [],
        limpiezaPersonal: [],
        limpiezaGeneral: [],
        medicamentos: [],
        rescateAnimal: []
    });

    // Handle input changes for simple fields
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when field is edited
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Handle changes in array fields (e.g., eppRopa, herramientas, etc.)
    const handleArrayFieldChange = (field, index, key, value) => {
        setFormData(prev => {
            const newArray = [...(prev[field] || [])];
            if (!newArray[index]) {
                newArray[index] = {};
            }
            newArray[index][key] = value;
            return {
                ...prev,
                [field]: newArray
            };
        });
    };

    // Add new item to an array field
    const addArrayItem = (field, defaultItem = {}) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), { ...defaultItem }]
        }));
    };

    // Remove item from an array field
    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    // Validate current section
    const validateSection = (sectionId) => {
        const section = SECTIONS.find(s => s.id === sectionId);
        if (!section || !section.required) return true;
        
        const errors = {};
        let isValid = true;
        
        section.required.forEach(field => {
            if (!formData[field]) {
                errors[field] = 'Este campo es obligatorio';
                isValid = false;
            }
        });
        
        setFormErrors(errors);
        return isValid;
    };

    // Handle section navigation
    const goToSection = (sectionId) => {
        if (sectionId === 'info' || validateSection(activeSection)) {
            setActiveSection(sectionId);
            window.scrollTo(0, 0);
        }
    };

    // Save section data to the server
    const saveSection = async (sectionId) => {
        const section = SECTIONS.find(s => s.id === sectionId);
        if (!section) return;
        
        try {
            setIsSubmitting(true);
            
            // Handle brigada info section
            if (sectionId === 'info') {
                const dataToSend = {};
                section.fields.forEach(field => {
                    dataToSend[field] = formData[field];
                });
                
                const url = brigadaId ? `${API_BASE_URL}/${brigadaId}` : API_BASE_URL;
                const method = brigadaId ? 'put' : 'post';
                const response = await axios[method](url, dataToSend);
                
                if (!brigadaId && response.data.brigadaId) {
                    setBrigadaId(response.data.brigadaId);
                }
                
                return response.data;
            } 
            // Handle EPP section and its sub-sections
            else if (sectionId === 'epp') {
                if (!brigadaId) {
                    throw new Error('No se ha creado la brigada aún');
                }

                // Array to store all API calls
                const apiCalls = [];

                // 1. Handle EPP Ropa
                if (formData.eppRopa && formData.eppRopa.length > 0) {
                    formData.eppRopa.forEach(item => {
                        apiCalls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/epp-ropa`, {
                                tipo: item.tipo,
                                talla: item.talla,
                                cantidad: item.cantidad,
                                observaciones: item.observaciones
                            })
                        );
                    });
                }

                // 2. Handle Botas
                if (formData.botas && formData.botas.length > 0) {
                    formData.botas.forEach(item => {
                        apiCalls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/botas`, {
                                tipo: item.tipo,
                                talla: item.talla,
                                cantidad: item.cantidad,
                                observaciones: item.observaciones
                            })
                        );
                    });
                }

                // 3. Handle Guantes
                if (formData.guantes && formData.guantes.length > 0) {
                    formData.guantes.forEach(item => {
                        apiCalls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/guantes`, {
                                tipo: item.tipo,
                                talla: item.talla,
                                cantidad: item.cantidad,
                                observaciones: item.observaciones
                            })
                        );
                    });
                }

                // 4. Handle EPP Equipo
                if (formData.eppEquipo && formData.eppEquipo.length > 0) {
                    formData.eppEquipo.forEach(item => {
                        apiCalls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/epp-equipo`, {
                                item: item.item,
                                cantidad: item.cantidad,
                                observaciones: item.observaciones
                            })
                        );
                    });
                }

                // Execute all API calls in parallel
                const results = await Promise.all(apiCalls);
                return { success: true, results };
            }
            // Handle other sections (herramientas, etc.)
            else {
                const sectionData = formData[section.id] || [];
                const results = [];
                
                for (const item of sectionData) {
                    const url = item.id 
                        ? `${API_BASE_URL}/${brigadaId}${section.endpoint}/${item.id}`
                        : `${API_BASE_URL}/${brigadaId}${section.endpoint}`;
                    
                    const method = item.id ? 'put' : 'post';
                    const response = await axios[method](url, {
                        ...item,
                        brigadaId: brigadaId
                    });
                    
                    results.push(response.data);
                }
                
                return { success: true, results };
            }
        } catch (error) {
            console.error(`Error saving ${section.name}:`, error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // First save the current section
        if (!validateSection(activeSection)) {
            setSubmitStatus({
                success: false,
                message: 'Por favor complete los campos requeridos antes de continuar.'
            });
            return;
        }
        
        try {
            setIsSubmitting(true);
            setSubmitStatus({ success: null, message: '' });
            
            // Save current section
            await saveSection(activeSection);
            
            // Mark section as completed
            setCompletedSections(prev => ({
                ...prev,
                [activeSection]: true
            }));
            
            // Move to next section or complete
            const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
            if (currentIndex < SECTIONS.length - 1) {
                // Go to next section
                const nextSection = SECTIONS[currentIndex + 1];
                setActiveSection(nextSection.id);
                setSubmitStatus({
                    success: true,
                    message: `${SECTIONS[currentIndex].name} guardado correctamente.`
                });
            } else {
                // Form completed
                setSubmitStatus({
                    success: true,
                    message: '¡Formulario completado exitosamente!'
                });
            }
        } catch (error) {
            console.error('Error saving form:', error);
            setSubmitStatus({
                success: false,
                message: `Error al guardar: ${error.response?.data?.message || error.message}`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Navigation buttons
    const renderNavigation = () => {
        const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
        
        return (
            <div className="mt-8 flex justify-between">
                <button
                    type="button"
                    onClick={() => {
                        if (currentIndex > 0) {
                            goToSection(SECTIONS[currentIndex - 1].id);
                        }
                    }}
                    disabled={currentIndex === 0}
                    className={`px-6 py-2 rounded-lg font-medium ${
                        currentIndex === 0 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                >
                    Anterior
                </button>
                
                <div className="flex items-center space-x-4">
                    {submitStatus.message && (
                        <div className={`px-4 py-2 rounded-lg ${
                            submitStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {submitStatus.message}
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded-lg font-medium text-white ${
                            isSubmitting 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {currentIndex === SECTIONS.length - 1 
                            ? (isSubmitting ? 'Enviando...' : 'Finalizar')
                            : (isSubmitting ? 'Guardando...' : 'Siguiente')}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 py-6 px-8">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <div className="bg-yellow-400 p-3 rounded-full mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Formulario de Necesidades</h1>
                            <p className="text-yellow-100 mt-1">Cuerpo de Bomberos</p>
                        </div>
                    </div>
                    <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                        <p className="text-white text-sm">Fecha: <span className="font-semibold">05/08/2025</span></p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-gray-100 px-4 py-3 border-b">
                <div className="flex overflow-x-auto pb-2 space-x-2">
                    {SECTIONS.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                                activeSection === section.id
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {section.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Sections */}
            <div className="p-6">
                {/* Información de la Brigada */}
                {activeSection === 'info' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Datos de la Brigada</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Brigada</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Ingrese el nombre"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Bomberos Activos</label>
                                <input
                                    type="number"
                                    name="cantidadactivos"
                                    value={formData.cantidadactivos}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Número de bomberos"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comandante</label>
                                <input
                                    type="text"
                                    name="nombrecomandante"
                                    value={formData.nombrecomandante}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${
                                        formErrors.nombrecomandante ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                                    placeholder="Nombre del comandante"
                                    required
                                />
                                {formErrors.nombrecomandante && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.nombrecomandante}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto Celular Comandante</label>
                                <input
                                    type="tel"
                                    name="celularcomandante"
                                    value={formData.celularcomandante}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${
                                        formErrors.celularcomandante ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                                    placeholder="Número de teléfono"
                                    required
                                />
                                {formErrors.celularcomandante && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.celularcomandante}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Encargado de Logística</label>
                                <input
                                    type="text"
                                    name="encargadologistica"
                                    value={formData.encargadologistica}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Nombre del encargado"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto Celular Logística</label>
                                <input
                                    type="tel"
                                    name="celularlogistica"
                                    value={formData.celularlogistica}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border ${
                                        formErrors.celularlogistica ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500`}
                                    placeholder="Número de teléfono"
                                    required
                                />
                                {formErrors.celularlogistica && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.celularlogistica}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Emergencia Público (si lo tiene)</label>
                                <input
                                    type="tel"
                                    name="numerosemergencia"
                                    value={formData.numerosemergencia}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Número de emergencia"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Equipamiento EPP */}
                {activeSection === 'epp' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Equipamiento de Protección Personal</h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Ropa</h3>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artículo</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">XS</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">S</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">M</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">XL</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        <tr>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">Camisa Forestal</td>
                                            {[0,0,0,0,0].map((_, i) => (
                                                <td key={i} className="px-4 py-3">
                                                    <input type="number" min="0" className="w-16 px-2 py-1 border border-gray-300 rounded text-center" />
                                                </td>
                                            ))}
                                            <td className="px-4 py-3">
                                                <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Notas" />
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">Pantalón Forestal</td>
                                            {[0,0,0,0,0].map((_, i) => (
                                                <td key={i} className="px-4 py-3">
                                                    <input type="number" min="0" className="w-16 px-2 py-1 border border-gray-300 rounded text-center" />
                                                </td>
                                            ))}
                                            <td className="px-4 py-3">
                                                <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Notas" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">Overol FR</td>
                                            {[0,0,0,0,0].map((_, i) => (
                                                <td key={i} className="px-4 py-3">
                                                    <input type="number" min="0" className="w-16 px-2 py-1 border border-gray-300 rounded text-center" />
                                                </td>
                                            ))}
                                            <td className="px-4 py-3">
                                                <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Notas" />
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Botas para Bomberos</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[37, 38, 39, 40, 41, 42, 43, 'Otra Talla'].map(size => (
                                        <div key={size} className="flex items-center">
                                            <label className="text-sm text-gray-700 w-24">Talla {size}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Otros Equipos EPP</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        'Esclavina', 'Linterna', 'Antiparra', 'Casco Forestal Ala Ancha',
                                        'Máscara para Polvo y Partículas', 'Máscara Media Cara', 'Barbijos'
                                    ].map(item => (
                                        <div key={item} className="flex items-center justify-between">
                                            <label className="text-sm text-gray-700">{item}</label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                    placeholder="Cantidad"
                                                />
                                                <input
                                                    type="text"
                                                    className="w-32 px-2 py-1 border border-gray-300 rounded"
                                                    placeholder="Observaciones"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Guantes</h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Otra Talla'].map(talla => (
                                        <div key={talla} className="flex items-center">
                                            <label className="text-sm text-gray-700 w-24">Talla {talla}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Herramientas */}
                {activeSection === 'tools' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Herramientas</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                'Linternas de Cabeza', 'Pilas AA', 'Pilas AAA', 'Azadón',
                                'Pala con Mango de Fibra', 'Rastrillo Mango de Fibra',
                                'McLeod Mango de Fibra', 'Batefuego', 'Gorgui',
                                'Pulasky con Mango de Fibra', 'Quemador de Goteo',
                                'Mochila Forestal', 'Escobeta de Alambre'
                            ].map(tool => (
                                <div key={tool} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{tool}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Cantidad"
                                        />
                                        <input
                                            type="text"
                                            className="w-32 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Logística Vehículos */}
                {activeSection === 'logistics' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Logística: Repuestos y Combustibles</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                'Gasolina', 'Diésel', 'Amortiguadores', 'Prensa Disco',
                                'Rectificación de Frenos', 'Llantas', 'Aceite de Motor',
                                'Grasa', 'Cambio de Aceite', 'Otro Tipo de Arreglo'
                            ].map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Monto"
                                        />
                                        <input
                                            type="text"
                                            className="w-32 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Alimentación */}
                {activeSection === 'food' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Alimentación y Bebidas</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                'Alimentos y Bebidas', 'Agua', 'Rehidratantes', 'Barras Energizantes',
                                'Lata de Atún', 'Lata de Frejol', 'Lata de Viandada', 'Lata de Chorizos',
                                'Refresco en Sobres', 'Leche Polvo', 'Frutos Secos',
                                'Pastillas de Menta o Dulces', 'Alimentos No Perecederos'
                            ].map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Cantidad"
                                        />
                                        <input
                                            type="text"
                                            className="w-32 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeSection === 'camp' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Equipo de Campo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                'Carpas', 'Colchonetas', 'Mochilas Personales', 'Mantas', 'Cuerdas', 'Radio Comunicadores', 'Baterías Portátiles'
                            ].map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="number" min="0" className="w-20 px-2 py-1 border border-gray-300 rounded text-center" placeholder="Cantidad" />
                                        <input type="text" className="w-32 px-2 py-1 border border-gray-300 rounded" placeholder="Observaciones" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeSection === 'hygiene' && (
                    <div className="space-y-10">
                        {/* Limpieza Personal */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Limpieza Personal</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['Papel Higiénico', 'Cepillos de Dientes', 'Jabón', 'Pasta Dental', 'Toallas', 'Alcohol en Gel'].map(item => (
                                    <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                        <label className="text-sm font-medium text-gray-700">{item}</label>
                                        <div className="flex items-center space-x-2">
                                            <input type="number" min="0" className="w-20 px-2 py-1 border border-gray-300 rounded text-center" placeholder="Cantidad" />
                                            <input type="text" className="w-32 px-2 py-1 border border-gray-300 rounded" placeholder="Observaciones" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Limpieza General */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Limpieza General</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['Detergente', 'Escobas', 'Trapeadores', 'Bolsas de Basura', 'Lavandina', 'Desinfectante'].map(item => (
                                    <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                        <label className="text-sm font-medium text-gray-700">{item}</label>
                                        <div className="flex items-center space-x-2">
                                            <input type="number" min="0" className="w-20 px-2 py-1 border border-gray-300 rounded text-center" placeholder="Cantidad" />
                                            <input type="text" className="w-32 px-2 py-1 border border-gray-300 rounded" placeholder="Observaciones" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeSection === 'meds' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Medicamentos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                'Paracetamol', 'Ibuprofeno', 'Antibióticos', 'Suero Oral', 'Gasas', 'Vendas', 'Alcohol', 'Yodo', 'Curitas'
                            ].map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="number" min="0" className="w-20 px-2 py-1 border border-gray-300 rounded text-center" placeholder="Cantidad" />
                                        <input type="text" className="w-32 px-2 py-1 border border-gray-300 rounded" placeholder="Observaciones" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeSection === 'animals' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Rescate Animal</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                'Jaulas de Transporte', 'Collares', 'Comida para Mascotas', 'Guantes Especiales', 'Medicamentos Veterinarios'
                            ].map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="number" min="0" className="w-20 px-2 py-1 border border-gray-300 rounded text-center" placeholder="Cantidad" />
                                        <input type="text" className="w-32 px-2 py-1 border border-gray-300 rounded" placeholder="Observaciones" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Footer */}
                {renderNavigation()}
            </div>
        </form>
    );
};

export default BombForm;