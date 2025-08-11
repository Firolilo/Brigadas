import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api/brigada';

// Configuración de secciones con endpoints y reglas básicas
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
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'logistics',
        name: 'Logística Vehículos',
        endpoint: '/logistica-repuestos',
        fields: ['item', 'costo', 'observaciones']
    },
    {
        id: 'food',
        name: 'Alimentación',
        endpoint: '/alimentacion',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'camp',
        name: 'Equipo de Campo',
        endpoint: '/logistica-campo',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'hygiene',
        name: 'Limpieza',
        endpoint: '/limpieza-personal',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'meds',
        name: 'Medicamentos',
        endpoint: '/medicamentos',
        fields: ['item', 'cantidad', 'observaciones']
    },
    {
        id: 'animals',
        name: 'Rescate Animal',
        endpoint: '/rescate-animal',
        fields: ['item', 'cantidad', 'observaciones']
    }
];

const BombForm = () => {
    const [activeSection, setActiveSection] = useState('info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ success: null, message: '' });
    const [brigadaId, setBrigadaId] = useState(null);
    const [completedSections, setCompletedSections] = useState({});
    const [formErrors, setFormErrors] = useState({});

    // =============================
    // Catálogos de ítems por sección
    // =============================
    const EPP_ROPA_ITEMS = ['Camisa Forestal', 'Pantalón Forestal', 'Overol FR'];
    const EPP_EQUIPO_ITEMS = [
        'Esclavina', 'Linterna', 'Antiparra', 'Casco Forestal Ala Ancha',
        'Máscara para Polvo y Partículas', 'Máscara Media Cara', 'Barbijos'
    ];
    const BOTAS_SIZES = ['37', '38', '39', '40', '41', '42', '43', 'otra'];
    const GUANTES_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'otra'];
    const HERRAMIENTAS_ITEMS = [
        'Linternas de Cabeza', 'Pilas AA', 'Pilas AAA', 'Azadón',
        'Pala con Mango de Fibra', 'Rastrillo Mango de Fibra',
        'McLeod Mango de Fibra', 'Batefuego', 'Gorgui',
        'Pulasky con Mango de Fibra', 'Quemador de Goteo',
        'Mochila Forestal', 'Escobeta de Alambre'
    ];
    const LOGISTICA_REPUESTOS_ITEMS = [
        'Gasolina', 'Diésel', 'Amortiguadores', 'Prensa Disco',
        'Rectificación de Frenos', 'Llantas', 'Aceite de Motor',
        'Grasa', 'Cambio de Aceite', 'Otro Tipo de Arreglo'
    ];
    const ALIMENTACION_ITEMS = [
        'Alimentos y Bebidas', 'Agua', 'Rehidratantes', 'Barras Energizantes',
        'Lata de Atún', 'Lata de Frejol', 'Lata de Viandada', 'Lata de Chorizos',
        'Refresco en Sobres', 'Leche Polvo', 'Frutos Secos',
        'Pastillas de Menta o Dulces', 'Alimentos No Perecederos'
    ];
    const CAMPO_ITEMS = ['Carpas', 'Colchonetas', 'Mochilas Personales', 'Mantas', 'Cuerdas', 'Radio Comunicadores', 'Baterías Portátiles'];
    const LIMPIEZA_PERSONAL_ITEMS = ['Papel Higiénico', 'Cepillos de Dientes', 'Jabón', 'Pasta Dental', 'Toallas', 'Alcohol en Gel'];
    const LIMPIEZA_GENERAL_ITEMS = ['Detergente', 'Escobas', 'Trapeadores', 'Bolsas de Basura', 'Lavandina', 'Desinfectante'];
    const MEDICAMENTOS_ITEMS = ['Paracetamol', 'Ibuprofeno', 'Antibióticos', 'Suero Oral', 'Gasas', 'Vendas', 'Alcohol', 'Yodo', 'Curitas'];
    const RESCATE_ANIMAL_ITEMS = ['Jaulas de Transporte', 'Collares', 'Comida para Mascotas', 'Guantes Especiales', 'Medicamentos Veterinarios'];

    // =============================
    // Estado del formulario
    // =============================
    const [formData, setFormData] = useState({
        // Datos de brigada
        nombre: '',
        cantidadactivos: 0,
        nombrecomandante: '',
        celularcomandante: '',
        encargadologistica: '',
        celularlogistica: '',
        numerosemergencia: ''
    });

    // Estado específico por sección (controlado)
    const [eppRopa, setEppRopa] = useState(() => (
        Object.fromEntries(EPP_ROPA_ITEMS.map(item => [item, { xs: 0, s: 0, m: 0, l: 0, xl: 0, observaciones: '' }]))
    ));
    const [botas, setBotas] = useState(() => ({ '37': 0, '38': 0, '39': 0, '40': 0, '41': 0, '42': 0, '43': 0, otra: 0, otratalla: '', observaciones: '' }));
    const [guantes, setGuantes] = useState(() => ({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, otra: 0, otratalla: '' }));
    const [eppEquipo, setEppEquipo] = useState(() => (
        Object.fromEntries(EPP_EQUIPO_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    ));
    const [eppEquipoCustom, setEppEquipoCustom] = useState([]);
    const [herramientas, setHerramientas] = useState(() => (
        Object.fromEntries(HERRAMIENTAS_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    ));
    const [herramientasCustom, setHerramientasCustom] = useState([]);
    const [logisticaRepuestos, setLogisticaRepuestos] = useState(() => (
        Object.fromEntries(LOGISTICA_REPUESTOS_ITEMS.map(item => [item, { costo: 0, observaciones: '' }]))
    ));
    const [logisticaRepuestosCustom, setLogisticaRepuestosCustom] = useState([]);
    const [alimentacion, setAlimentacion] = useState(() => (
        Object.fromEntries(ALIMENTACION_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    ));
    const [alimentacionCustom, setAlimentacionCustom] = useState([]);
    const [logisticaCampo, setLogisticaCampo] = useState(() => (
        Object.fromEntries(CAMPO_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    ));
    const [logisticaCampoCustom, setLogisticaCampoCustom] = useState([]);
    const [limpiezaPersonal, setLimpiezaPersonal] = useState(() => (
        Object.fromEntries(LIMPIEZA_PERSONAL_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    ));
    const [limpiezaPersonalCustom, setLimpiezaPersonalCustom] = useState([]);
    const [limpiezaGeneral, setLimpiezaGeneral] = useState(() => (
        Object.fromEntries(LIMPIEZA_GENERAL_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    ));
    const [limpiezaGeneralCustom, setLimpiezaGeneralCustom] = useState([]);
    const [medicamentos, setMedicamentos] = useState(() => (
        Object.fromEntries(MEDICAMENTOS_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    ));
    const [medicamentosCustom, setMedicamentosCustom] = useState([]);
    const [rescateAnimal, setRescateAnimal] = useState(() => (
        Object.fromEntries(RESCATE_ANIMAL_ITEMS.map(item => [item, { cantidad: 0, observaciones: '' }]))
    ));
    const [rescateAnimalCustom, setRescateAnimalCustom] = useState([]);
    const [eppRopaCustom, setEppRopaCustom] = useState([]);

    // Manejador para campos simples de brigada
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let nextValue = type === 'checkbox' ? checked : value;

        // Forzar solo dígitos en campos estrictamente numéricos (p.ej. cantidadactivos)
        if (name === 'cantidadactivos') {
            nextValue = value.replace(/\D/g, '');
        }

        setFormData(prev => ({
            ...prev,
            [name]: nextValue
        }));
        
        // Clear error when field is edited
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Handlers específicos por sección para inputs controlados
    const handleEppRopaSizeChange = (item, sizeKey, value) => {
        setEppRopa(prev => ({
            ...prev,
            [item]: { ...prev[item], [sizeKey]: Number(value) || 0 }
        }));
    };
    const handleEppRopaObsChange = (item, text) => {
        setEppRopa(prev => ({
            ...prev,
            [item]: { ...prev[item], observaciones: text }
        }));
    };
    const handleBotasChange = (sizeKey, value) => {
        setBotas(prev => ({ ...prev, [sizeKey]: Number(value) || 0 }));
    };
    const handleBotasObsChange = (text) => {
        setBotas(prev => ({ ...prev, observaciones: text }));
    };
    const handleBotasOtraTallaText = (text) => {
        setBotas(prev => ({ ...prev, otratalla: text }));
    };
    const handleGuantesChange = (sizeKey, value) => {
        setGuantes(prev => ({ ...prev, [sizeKey]: Number(value) || 0 }));
    };
    const handleGuantesOtraTallaText = (text) => {
        setGuantes(prev => ({ ...prev, otratalla: text }));
    };
    const handleListQuantityChange = (setter) => (item, value) => {
        setter(prev => ({
            ...prev,
            [item]: { ...prev[item], cantidad: Number(value) || 0 }
        }));
    };
    const handleListCostChange = (setter) => (item, value) => {
        setter(prev => ({
            ...prev,
            [item]: { ...prev[item], costo: Number(value) || 0 }
        }));
    };
    const handleListObsChange = (setter) => (item, text) => {
        setter(prev => ({
            ...prev,
            [item]: { ...prev[item], observaciones: text }
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

    // Navegación entre secciones con validación de la actual
    const goToSection = (sectionId) => {
        if (sectionId === 'info' || validateSection(activeSection)) {
            setActiveSection(sectionId);
            window.scrollTo(0, 0);
        }
    };

    // Guardar una sección en el servidor según su tipo
    const saveSection = async (sectionId) => {
        const section = SECTIONS.find(s => s.id === sectionId);
        if (!section) return;
        
        try {
            setIsSubmitting(true);
            
            // 1) Datos de brigada
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
            } else if (sectionId === 'epp') {
                // 2) EPP: ropa, botas, guantes y equipo
                if (!brigadaId) {
                    throw new Error('No se ha creado la brigada aún');
                }

                // Colección de promesas
                const apiCalls = [];

                // 2.1 Ropa: por cada prenda y talla > 0
                Object.entries(eppRopa).forEach(([itemNombre, tallas]) => {
                    ['xs', 's', 'm', 'l', 'xl'].forEach(tallaKey => {
                        const cantidad = Number(tallas[tallaKey]) || 0;
                        if (cantidad > 0) {
                            apiCalls.push(
                                axios.post(`${API_BASE_URL}/${brigadaId}/epp-ropa`, {
                                    tipo: itemNombre,
                                    talla: tallaKey,
                                    cantidad,
                                    observaciones: tallas.observaciones || ''
                                })
                            );
                        }
                    });
                });

                // 2.2 Botas: por cada talla > 0
                Object.entries(botas).forEach(([talla, cantidad]) => {
                    if (talla === 'observaciones' || talla === 'otratalla') return;
                    const cant = Number(cantidad) || 0;
                    if (cant > 0) {
                        apiCalls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/botas`, {
                                tipo: 'botas',
                                talla: talla === 'otra' ? 'otra' : String(talla),
                                cantidad: cant,
                                observaciones: botas.observaciones || '',
                                otratalla: talla === 'otra' ? (botas.otratalla || '') : ''
                            })
                        );
                    }
                });

                // 2.3 Guantes: un solo registro agregado
                apiCalls.push(
                    axios.post(`${API_BASE_URL}/${brigadaId}/guantes`, {
                        xs: Number(guantes.XS) || 0,
                        s: Number(guantes.S) || 0,
                        m: Number(guantes.M) || 0,
                        l: Number(guantes.L) || 0,
                        xl: Number(guantes.XL) || 0,
                        xxl: Number(guantes.XXL) || 0,
                        otratalla: guantes.otratalla || null
                    })
                );

                // 2.4 EPP Equipo: por cada item del catálogo con cantidad > 0
                Object.entries(eppEquipo).forEach(([itemNombre, data]) => {
                    const cant = Number(data.cantidad) || 0;
                    if (cant > 0) {
                        apiCalls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/epp-equipo`, {
                                item: itemNombre,
                                cantidad: cant,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                // 2.5 EPP Ropa custom
                eppRopaCustom.forEach(custom => {
                    if (!custom.item) return;
                    ['xs','s','m','l','xl'].forEach(tallaKey => {
                        const cantidad = Number(custom[tallaKey]) || 0;
                        if (cantidad > 0) {
                            apiCalls.push(
                                axios.post(`${API_BASE_URL}/${brigadaId}/epp-ropa`, {
                                    tipo: custom.item,
                                    talla: tallaKey,
                                    cantidad,
                                    observaciones: custom.observaciones || ''
                                })
                            );
                        }
                    });
                });
                // 2.6 EPP Equipo custom
                eppEquipoCustom.forEach(custom => {
                    const cant = Number(custom.cantidad) || 0;
                    if (custom.item && cant > 0) {
                        apiCalls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/epp-equipo`, {
                                item: custom.item,
                                cantidad: cant,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });

                // Execute all API calls in parallel
                const results = await Promise.all(apiCalls);
                return { success: true, results };
            } else if (sectionId === 'tools') {
                if (!brigadaId) throw new Error('No se ha creado la brigada aún');
                const calls = [];
                Object.entries(herramientas).forEach(([itemNombre, data]) => {
                    const cant = Number(data.cantidad) || 0;
                    if (cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/herramientas`, {
                                item: itemNombre,
                                cantidad: cant,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                herramientasCustom.forEach(custom => {
                    const cant = Number(custom.cantidad) || 0;
                    if (custom.item && cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/herramientas`, {
                                item: custom.item,
                                cantidad: cant,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });
                const results = await Promise.all(calls);
                return { success: true, results };
            } else if (sectionId === 'logistics') {
                if (!brigadaId) throw new Error('No se ha creado la brigada aún');
                const calls = [];
                Object.entries(logisticaRepuestos).forEach(([itemNombre, data]) => {
                    const costo = Number(data.costo) || 0;
                    if (costo > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/logistica-repuestos`, {
                                item: itemNombre,
                                costo,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                logisticaRepuestosCustom.forEach(custom => {
                    const costo = Number(custom.costo) || 0;
                    if (custom.item && costo > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/logistica-repuestos`, {
                                item: custom.item,
                                costo,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });
                const results = await Promise.all(calls);
                return { success: true, results };
            } else if (sectionId === 'food') {
                if (!brigadaId) throw new Error('No se ha creado la brigada aún');
                const calls = [];
                Object.entries(alimentacion).forEach(([itemNombre, data]) => {
                    const cant = Number(data.cantidad) || 0;
                    if (cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/alimentacion`, {
                                item: itemNombre,
                                cantidad: cant,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                alimentacionCustom.forEach(custom => {
                    const cant = Number(custom.cantidad) || 0;
                    if (custom.item && cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/alimentacion`, {
                                item: custom.item,
                                cantidad: cant,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });
                const results = await Promise.all(calls);
                return { success: true, results };
            } else if (sectionId === 'camp') {
                if (!brigadaId) throw new Error('No se ha creado la brigada aún');
                const calls = [];
                Object.entries(logisticaCampo).forEach(([itemNombre, data]) => {
                    const cant = Number(data.cantidad) || 0;
                    if (cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/logistica-campo`, {
                                item: itemNombre,
                                cantidad: cant,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                logisticaCampoCustom.forEach(custom => {
                    const cant = Number(custom.cantidad) || 0;
                    if (custom.item && cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/logistica-campo`, {
                                item: custom.item,
                                cantidad: cant,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });
                const results = await Promise.all(calls);
                return { success: true, results };
            } else if (sectionId === 'hygiene') {
                if (!brigadaId) throw new Error('No se ha creado la brigada aún');
                const calls = [];
                Object.entries(limpiezaPersonal).forEach(([itemNombre, data]) => {
                    const cant = Number(data.cantidad) || 0;
                    if (cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/limpieza-personal`, {
                                item: itemNombre,
                                cantidad: cant,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                limpiezaPersonalCustom.forEach(custom => {
                    const cant = Number(custom.cantidad) || 0;
                    if (custom.item && cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/limpieza-personal`, {
                                item: custom.item,
                                cantidad: cant,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });
                Object.entries(limpiezaGeneral).forEach(([itemNombre, data]) => {
                    const cant = Number(data.cantidad) || 0;
                    if (cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/limpieza-general`, {
                                item: itemNombre,
                                cantidad: cant,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                limpiezaGeneralCustom.forEach(custom => {
                    const cant = Number(custom.cantidad) || 0;
                    if (custom.item && cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/limpieza-general`, {
                                item: custom.item,
                                cantidad: cant,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });
                const results = await Promise.all(calls);
                return { success: true, results };
            } else if (sectionId === 'meds') {
                if (!brigadaId) throw new Error('No se ha creado la brigada aún');
                const calls = [];
                Object.entries(medicamentos).forEach(([itemNombre, data]) => {
                    const cant = Number(data.cantidad) || 0;
                    if (cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/medicamentos`, {
                                item: itemNombre,
                                cantidad: cant,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                medicamentosCustom.forEach(custom => {
                    const cant = Number(custom.cantidad) || 0;
                    if (custom.item && cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/medicamentos`, {
                                item: custom.item,
                                cantidad: cant,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });
                const results = await Promise.all(calls);
                return { success: true, results };
            } else if (sectionId === 'animals') {
                if (!brigadaId) throw new Error('No se ha creado la brigada aún');
                const calls = [];
                Object.entries(rescateAnimal).forEach(([itemNombre, data]) => {
                    const cant = Number(data.cantidad) || 0;
                    if (cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/rescate-animal`, {
                                item: itemNombre,
                                cantidad: cant,
                                observaciones: data.observaciones || ''
                            })
                        );
                    }
                });
                rescateAnimalCustom.forEach(custom => {
                    const cant = Number(custom.cantidad) || 0;
                    if (custom.item && cant > 0) {
                        calls.push(
                            axios.post(`${API_BASE_URL}/${brigadaId}/rescate-animal`, {
                                item: custom.item,
                                cantidad: cant,
                                observaciones: custom.observaciones || ''
                            })
                        );
                    }
                });
                const results = await Promise.all(calls);
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
                            onClick={() => goToSection(section.id)}
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
                {submitStatus.success && activeSection === SECTIONS[SECTIONS.length - 1].id && (
                    <div className="mb-6 rounded-lg border border-green-600 bg-green-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">✓</span>
                                <div>
                                    <p className="font-semibold text-green-800">Formulario completado</p>
                                    <p className="text-sm text-green-700">Tus necesidades han sido registradas correctamente. ¡Gracias!</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="rounded-md border border-green-700 px-3 py-1 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white"
                                aria-label="Finalizar y reiniciar formulario"
                            >
                                Finalizar
                            </button>
                        </div>
                    </div>
                )}
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
                                    maxLength={120}
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
                                    step="1"
                                    inputMode="numeric"
                                    pattern="\\d+"
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
                                    maxLength={120}
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
                                    maxLength={30}
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
                                    maxLength={120}
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
                                    maxLength={30}
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
                                    maxLength={30}
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
                                        {EPP_ROPA_ITEMS.map((itemNombre, rowIndex) => (
                                            <tr key={itemNombre} className={rowIndex % 2 === 1 ? 'bg-gray-50' : ''}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{itemNombre}</td>
                                                {['xs','s','m','l','xl'].map(sizeKey => (
                                                    <td key={sizeKey} className="px-4 py-3">
                                                    <input
                                                            type="number"
                                                            min="0"
                                                        step="1"
                                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                                            value={eppRopa[itemNombre][sizeKey]}
                                                            onChange={(e) => handleEppRopaSizeChange(itemNombre, sizeKey, e.target.value)}
                                                            aria-label={`${itemNombre} talla ${sizeKey.toUpperCase()}`}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Notas"
                                                        value={eppRopa[itemNombre].observaciones}
                                                        maxLength={400}
                                                        onChange={(e) => handleEppRopaObsChange(itemNombre, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Botas para Bomberos</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['37','38','39','40','41','42','43','otra'].map(size => (
                                        <div key={size} className="flex items-center">
                                            <label className="text-sm text-gray-700 w-28">Talla {size === 'otra' ? 'Otra' : size}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="0"
                                                value={botas[size]}
                                                onChange={(e) => handleBotasChange(size, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                    <div className="col-span-full">
                                        <label className="text-sm text-gray-700">Otra talla (texto)</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Especifica otra talla, por ejemplo 44/45..."
                                            value={botas.otratalla}
                                            maxLength={80}
                                            onChange={(e) => handleBotasOtraTallaText(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-full">
                                        <label className="text-sm text-gray-700">Observaciones</label>
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Notas generales de botas"
                                            value={botas.observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleBotasObsChange(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Otros Equipos EPP</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {EPP_EQUIPO_ITEMS.map(item => (
                                        <div key={item} className="flex items-center justify-between">
                                            <label className="text-sm text-gray-700">{item}</label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                    placeholder="Cantidad"
                                                    value={eppEquipo[item].cantidad}
                                                    onChange={(e) => handleListQuantityChange(setEppEquipo)(item, e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="w-40 px-2 py-1 border border-gray-300 rounded"
                                                    placeholder="Observaciones"
                                                    value={eppEquipo[item].observaciones}
                                                    maxLength={400}
                                                    onChange={(e) => handleListObsChange(setEppEquipo)(item, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* EPP Equipo - Otros */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button
                                        type="button"
                                        className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white"
                                        onClick={() => setEppEquipoCustom(prev => [...prev, { item: '', cantidad: 0, observaciones: '' }])}
                                    >
                                        Añadir otro
                                    </button>
                                </div>
                                {eppEquipoCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {eppEquipoCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input
                                                    type="text"
                                                    className="px-2 py-1 border border-gray-300 rounded"
                                                    placeholder="Nombre del ítem"
                                                    value={row.item}
                                                    onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, item: e.target.value } : r))}
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="px-2 py-1 border border-gray-300 rounded"
                                                    placeholder="Cantidad"
                                                    value={row.cantidad}
                                                    onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, cantidad: Number(e.target.value)||0 } : r))}
                                                />
                                                <input
                                                    type="text"
                                                    className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2"
                                                    placeholder="Observaciones"
                                                    value={row.observaciones}
                                                    onChange={(e) => setEppEquipoCustom(prev => prev.map((r,i) => i===idx ? { ...r, observaciones: e.target.value } : r))}
                                                />
                                                <button
                                                    type="button"
                                                    className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white"
                                                    onClick={() => setEppEquipoCustom(prev => prev.filter((_,i)=> i!==idx))}
                                                >
                                                    Quitar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* EPP Ropa - Otros */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Ropa - Otros</h3>
                                    <button
                                        type="button"
                                        className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white"
                                        onClick={() => setEppRopaCustom(prev => [...prev, { item: '', xs:0,s:0,m:0,l:0,xl:0, observaciones:'' }])}
                                    >
                                        Añadir otro
                                    </button>
                                </div>
                                {eppRopaCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay prendas personalizadas aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {eppRopaCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                                                <input
                                                    type="text"
                                                    className="px-2 py-1 border border-gray-300 rounded"
                                                    placeholder="Prenda"
                                                    value={row.item}
                                                    onChange={(e) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))}
                                                />
                                                {['xs','s','m','l','xl'].map(sizeKey => (
                                                    <input
                                                        key={sizeKey}
                                                        type="number"
                                                        min="0"
                                                        className="px-2 py-1 border border-gray-300 rounded"
                                                        placeholder={sizeKey.toUpperCase()}
                                                        value={row[sizeKey]}
                                                        onChange={(e) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, [sizeKey]: Number(e.target.value)||0 } : r))}
                                                    />
                                                ))}
                                                <input
                                                    type="text"
                                                    className="px-2 py-1 border border-gray-300 rounded col-span-1"
                                                    placeholder="Observaciones"
                                                    value={row.observaciones}
                                                    onChange={(e) => setEppRopaCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))}
                                                />
                                                <button
                                                    type="button"
                                                    className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white"
                                                    onClick={() => setEppRopaCustom(prev => prev.filter((_,i)=> i!==idx))}
                                                >
                                                    Quitar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700 mb-3">Guantes</h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {GUANTES_SIZES.map(talla => (
                                        <div key={talla} className="flex items-center">
                                            <label className="text-sm text-gray-700 w-28">Talla {talla}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="0"
                                                value={guantes[talla]}
                                                onChange={(e) => handleGuantesChange(talla, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-3">
                                    <div className="flex items-center">
                                        <label className="text-sm text-gray-700 w-40">Otra talla (texto)</label>
                                        <input
                                            type="text"
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Describe talla extra (por ej. Talla única, 7.5, etc.)"
                                            value={guantes.otratalla}
                                            maxLength={80}
                                            onChange={(e) => handleGuantesOtraTallaText(e.target.value)}
                                        />
                                    </div>
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
                            {HERRAMIENTAS_ITEMS.map(tool => (
                                <div key={tool} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{tool}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Cantidad"
                                            value={herramientas[tool].cantidad}
                                            onChange={(e) => handleListQuantityChange(setHerramientas)(tool, e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={herramientas[tool].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setHerramientas)(tool, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            {/* Herramientas - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button
                                        type="button"
                                        className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white"
                                        onClick={() => setHerramientasCustom(prev => [...prev, { item: '', cantidad: 0, observaciones: '' }])}
                                    >
                                        Añadir otro
                                    </button>
                                </div>
                                {herramientasCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {herramientasCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <input type="number" min="0" className="px-2 py-1 border border-gray-300 rounded" placeholder="Cantidad" value={row.cantidad} onChange={(e)=> setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(e.target.value)||0 } : r))} />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setHerramientasCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Logística Vehículos */}
                {activeSection === 'logistics' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Logística: Repuestos y Combustibles</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {LOGISTICA_REPUESTOS_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-28 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Monto"
                                            value={logisticaRepuestos[item].costo}
                                            onChange={(e) => handleListCostChange(setLogisticaRepuestos)(item, e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={logisticaRepuestos[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setLogisticaRepuestos)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            {/* Logística - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setLogisticaRepuestosCustom(prev => [...prev, { item:'', costo:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {logisticaRepuestosCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {logisticaRepuestosCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <input type="number" min="0" className="px-2 py-1 border border-gray-300 rounded" placeholder="Costo" value={row.costo} onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, costo: Number(e.target.value)||0 } : r))} />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setLogisticaRepuestosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setLogisticaRepuestosCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Alimentación */}
                {activeSection === 'food' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Alimentación y Bebidas</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {ALIMENTACION_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Cantidad"
                                            value={alimentacion[item].cantidad}
                                            onChange={(e) => handleListQuantityChange(setAlimentacion)(item, e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={alimentacion[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setAlimentacion)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            {/* Alimentación - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setAlimentacionCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {alimentacionCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {alimentacionCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <input type="number" min="0" className="px-2 py-1 border border-gray-300 rounded" placeholder="Cantidad" value={row.cantidad} onChange={(e)=> setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(e.target.value)||0 } : r))} />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setAlimentacionCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeSection === 'camp' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Equipo de Campo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {CAMPO_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Cantidad"
                                            value={logisticaCampo[item].cantidad}
                                            onChange={(e) => handleListQuantityChange(setLogisticaCampo)(item, e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={logisticaCampo[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setLogisticaCampo)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            {/* Campo - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setLogisticaCampoCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {logisticaCampoCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {logisticaCampoCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <input type="number" min="0" className="px-2 py-1 border border-gray-300 rounded" placeholder="Cantidad" value={row.cantidad} onChange={(e)=> setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(e.target.value)||0 } : r))} />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setLogisticaCampoCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeSection === 'hygiene' && (
                    <div className="space-y-10">
                        {/* Limpieza Personal */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Limpieza Personal</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {LIMPIEZA_PERSONAL_ITEMS.map(item => (
                                    <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                        <label className="text-sm font-medium text-gray-700">{item}</label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="Cantidad"
                                                value={limpiezaPersonal[item].cantidad}
                                                onChange={(e) => handleListQuantityChange(setLimpiezaPersonal)(item, e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="w-40 px-2 py-1 border border-gray-300 rounded"
                                                placeholder="Observaciones"
                                                value={limpiezaPersonal[item].observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleListObsChange(setLimpiezaPersonal)(item, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Limpieza Personal - Otros */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setLimpiezaPersonalCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {limpiezaPersonalCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {limpiezaPersonalCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <input type="number" min="0" className="px-2 py-1 border border-gray-300 rounded" placeholder="Cantidad" value={row.cantidad} onChange={(e)=> setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(e.target.value)||0 } : r))} />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setLimpiezaPersonalCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Limpieza General */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Limpieza General</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {LIMPIEZA_GENERAL_ITEMS.map(item => (
                                    <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                        <label className="text-sm font-medium text-gray-700">{item}</label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                                placeholder="Cantidad"
                                                value={limpiezaGeneral[item].cantidad}
                                                onChange={(e) => handleListQuantityChange(setLimpiezaGeneral)(item, e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="w-40 px-2 py-1 border border-gray-300 rounded"
                                                placeholder="Observaciones"
                                                value={limpiezaGeneral[item].observaciones}
                                                maxLength={400}
                                                onChange={(e) => handleListObsChange(setLimpiezaGeneral)(item, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Limpieza General - Otros */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setLimpiezaGeneralCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {limpiezaGeneralCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {limpiezaGeneralCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <input type="number" min="0" className="px-2 py-1 border border-gray-300 rounded" placeholder="Cantidad" value={row.cantidad} onChange={(e)=> setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(e.target.value)||0 } : r))} />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setLimpiezaGeneralCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeSection === 'meds' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Medicamentos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {MEDICAMENTOS_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Cantidad"
                                            value={medicamentos[item].cantidad}
                                            onChange={(e) => handleListQuantityChange(setMedicamentos)(item, e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={medicamentos[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setMedicamentos)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            {/* Medicamentos - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setMedicamentosCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {medicamentosCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {medicamentosCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <input type="number" min="0" className="px-2 py-1 border border-gray-300 rounded" placeholder="Cantidad" value={row.cantidad} onChange={(e)=> setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(e.target.value)||0 } : r))} />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setMedicamentosCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeSection === 'animals' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3 py-1">Rescate Animal</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {RESCATE_ANIMAL_ITEMS.map(item => (
                                <div key={item} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700">{item}</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                            placeholder="Cantidad"
                                            value={rescateAnimal[item].cantidad}
                                            onChange={(e) => handleListQuantityChange(setRescateAnimal)(item, e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="w-40 px-2 py-1 border border-gray-300 rounded"
                                            placeholder="Observaciones"
                                            value={rescateAnimal[item].observaciones}
                                            maxLength={400}
                                            onChange={(e) => handleListObsChange(setRescateAnimal)(item, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            {/* Rescate Animal - Otros */}
                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-700">Otros</h3>
                                    <button type="button" className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800 hover:text-white" onClick={() => setRescateAnimalCustom(prev => [...prev, { item:'', cantidad:0, observaciones:'' }])}>Añadir otro</button>
                                </div>
                                {rescateAnimalCustom.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay ítems personalizados aún.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {rescateAnimalCustom.map((row, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded" placeholder="Nombre" value={row.item} onChange={(e)=> setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, item: e.target.value } : r))} />
                                                <input type="number" min="0" className="px-2 py-1 border border-gray-300 rounded" placeholder="Cantidad" value={row.cantidad} onChange={(e)=> setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(e.target.value)||0 } : r))} />
                                                <input type="text" className="px-2 py-1 border border-gray-300 rounded col-span-1 md:col-span-2" placeholder="Observaciones" value={row.observaciones} onChange={(e)=> setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, observaciones: e.target.value } : r))} />
                                                <button type="button" className="justify-self-end rounded-md border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-700 hover:text-white" onClick={()=> setRescateAnimalCustom(prev => prev.filter((_,i)=> i!==idx))}>Quitar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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