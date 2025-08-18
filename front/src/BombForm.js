import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Button from './components/common/Button';
import Input from './components/common/Input';
import Select from './components/common/Select';
import Label from './components/common/Label';
import NumberStepper from './components/common/NumberStepper';

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
    // Descarga Excel al finalizar
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadingExcel, setDownloadingExcel] = useState(false);


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

    // =============================
    // Estado y handlers: Listado de brigadas existentes
    // =============================
    const [showBrigadasModal, setShowBrigadasModal] = useState(false); // Controla la visibilidad del modal de brigadas
    const [brigadas, setBrigadas] = useState([]); // Lista de brigadas obtenida desde el backend
    const [isLoadingBrigadas, setIsLoadingBrigadas] = useState(false); // Flag de carga para el listado
    const [brigadasError, setBrigadasError] = useState(''); // Error del fetch
    const [brigadasQuery, setBrigadasQuery] = useState(''); // Texto de búsqueda en brigadas
    const [brigadasSortKey, setBrigadasSortKey] = useState('nombre'); // Clave de ordenamiento
    const [brigadasSortDir, setBrigadasSortDir] = useState('asc'); // Dirección de ordenamiento

    // Carga brigadas desde API
    const fetchBrigadas = async () => {
        setIsLoadingBrigadas(true);
        setBrigadasError('');
        try {
            const { data } = await axios.get(API_BASE_URL);
            setBrigadas(Array.isArray(data) ? data : []);
        } catch (error) {
            setBrigadasError(error.response?.data?.error || 'No se pudo obtener el listado de brigadas.');
        } finally {
            setIsLoadingBrigadas(false);
        }
    };

    // Abre el modal y carga las brigadas registradas
    const openBrigadasModal = async () => {
        setShowBrigadasModal(true);
        setBrigadasQuery('');
        setBrigadasSortKey('nombre');
        setBrigadasSortDir('asc');
        fetchBrigadas();
    };

    // Cierra el modal de brigadas
    const closeBrigadasModal = () => {
        setShowBrigadasModal(false);
    };
    // Ordenamiento de columnas en listado de brigadas
    const handleSortBrigadas = (key) => {
        if (brigadasSortKey === key) {
            setBrigadasSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setBrigadasSortKey(key);
        setBrigadasSortDir('asc');
    };

    // Carga una brigada para edición de datos base (Información de la Brigada)
    const handleEditBrigada = async (brigadaIdToLoad) => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdToLoad}`);
            setFormData(prev => ({
                ...prev,
                nombre: data?.nombre || '',
                cantidadactivos: data?.cantidadactivos ?? 0,
                nombrecomandante: data?.nombrecomandante || '',
                celularcomandante: data?.celularcomandante || '',
                encargadologistica: data?.encargadologistica || '',
                celularlogistica: data?.celularlogistica || '',
                numerosemergencia: data?.numerosemergencia || ''
            }));
            setBrigadaId(brigadaIdToLoad);
            setActiveSection('info');
            setSubmitStatus({ success: null, message: '' });
            setShowBrigadasModal(false);
            window.scrollTo(0, 0);
        } catch (error) {
            alert('No se pudo cargar la brigada seleccionada.');
        }
    };

    // Permite seleccionar una brigada existente y saltar a una sección para pedir más ítems
    const handlePedirMasItems = (brigadaIdToContinue, sectionId = 'epp') => {
        setBrigadaId(brigadaIdToContinue);
        setActiveSection(sectionId);
        setSubmitStatus({ success: null, message: '' });
        setShowBrigadasModal(false);
        window.scrollTo(0, 0);
    };

    // =============================
    // Estado y handlers: Resumen / Factura de una brigada
    // =============================
    const [showResumenModal, setShowResumenModal] = useState(false); // Modal del resumen
    const [resumenLoading, setResumenLoading] = useState(false); // Flag de carga
    const [resumenError, setResumenError] = useState(''); // Error de carga
    const [resumenBrigada, setResumenBrigada] = useState(null); // Datos base de brigada
    const [resumenData, setResumenData] = useState({ // Datos consolidados por categoría
        eppRopa: [],
        botas: {},
        guantes: {},
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

    // Estados de formulario para "Nuevo pedido" (inputs por categoría)
    const [pedidoInputs, setPedidoInputs] = useState({
        ropa: { item: EPP_ROPA_ITEMS[0], talla: 's', cantidad: 0, observaciones: '' },
        botas: { tipo: 'Botas', talla: '37', cantidad: 0, observaciones: '', otratalla: '' },
        guantes: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, otratalla: '' },
        equipo: { item: EPP_EQUIPO_ITEMS[0], cantidad: 0, observaciones: '' },
        herramientas: { item: HERRAMIENTAS_ITEMS[0], cantidad: 0, observaciones: '' },
        repuestos: { item: LOGISTICA_REPUESTOS_ITEMS[0], costo: 0, observaciones: '' },
        alimentacion: { item: ALIMENTACION_ITEMS[0], cantidad: 0, observaciones: '' },
        campo: { item: CAMPO_ITEMS[0], cantidad: 0, observaciones: '' },
        limpiezaPersonal: { item: LIMPIEZA_PERSONAL_ITEMS[0], cantidad: 0, observaciones: '' },
        limpiezaGeneral: { item: LIMPIEZA_GENERAL_ITEMS[0], cantidad: 0, observaciones: '' },
        medicamentos: { item: MEDICAMENTOS_ITEMS[0], cantidad: 0, observaciones: '' },
        rescateAnimal: { item: RESCATE_ANIMAL_ITEMS[0], cantidad: 0, observaciones: '' }
    });

    // Abre el modal de resumen y carga todos los datos en paralelo

    // =============================
    // Exportar a Excel (.xlsx)
    // =============================
    const fetchAllForExcel = async (brigadaIdValue) => {
        const requests = [
            axios.get(`${API_BASE_URL}/${brigadaIdValue}`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/epp-ropa`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/botas`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/guantes`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/epp-equipo`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/herramientas`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/logistica-repuestos`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/alimentacion`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/logistica-campo`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/limpieza-personal`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/limpieza-general`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/medicamentos`),
            axios.get(`${API_BASE_URL}/${brigadaIdValue}/rescate-animal`)
        ];
        const [
            brigadaRes, ropaRes, botasRes, guantesRes, equipoRes, herramientasRes,
            repuestosRes, alimentacionRes, campoRes, limpiezaPersRes, limpiezaGenRes,
            medicamentosRes, rescateRes
        ] = await Promise.all(requests);

        return {
            brigada: brigadaRes?.data || {},
            data: {
                eppRopa: ropaRes?.data || [],
                botas: botasRes?.data || {},
                guantes: guantesRes?.data || {},
                eppEquipo: equipoRes?.data || [],
                herramientas: herramientasRes?.data || [],
                logisticaRepuestos: repuestosRes?.data || [],
                alimentacion: alimentacionRes?.data || [],
                logisticaCampo: campoRes?.data || [],
                limpiezaPersonal: limpiezaPersRes?.data || [],
                limpiezaGeneral: limpiezaGenRes?.data || [],
                medicamentos: medicamentosRes?.data || [],
                rescateAnimal: rescateRes?.data || []
            }
        };
    };

    const safeAppendSheet = (wb, rows, title) => {
        try {
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
        } catch (_) {
            const fallback = Array.isArray(rows) ? rows.map((r, i) => ({ fila: i + 1, dato: JSON.stringify(r) })) : [{ dato: JSON.stringify(rows) }];
            const ws = XLSX.utils.json_to_sheet(fallback);
            XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
        }
    };

    const objectToRows = (obj, keyCol = 'clave', valCol = 'valor') => {
        if (!obj || typeof obj !== 'object') return [];
        return Object.entries(obj).map(([k, v]) => ({ [keyCol]: k, [valCol]: v }));
    };

    const buildAndDownloadExcel = (brigada, data) => {
        const wb = XLSX.utils.book_new();

        const infoRows = Object.entries(brigada || {}).map(([k, v]) => ({ campo: k, valor: v }));
        safeAppendSheet(wb, infoRows, 'Brigada');

        if (Array.isArray(data.eppRopa) && data.eppRopa.length)      safeAppendSheet(wb, data.eppRopa, 'EPP Ropa');
        if (data.botas && Object.keys(data.botas).length)            safeAppendSheet(wb, objectToRows(data.botas, 'talla', 'cantidad'), 'Botas');
        if (data.guantes && Object.keys(data.guantes).length)        safeAppendSheet(wb, objectToRows(data.guantes, 'talla', 'cantidad'), 'Guantes');
        if (Array.isArray(data.eppEquipo) && data.eppEquipo.length)  safeAppendSheet(wb, data.eppEquipo, 'EPP Equipo');
        if (Array.isArray(data.herramientas) && data.herramientas.length) safeAppendSheet(wb, data.herramientas, 'Herramientas');
        if (Array.isArray(data.logisticaRepuestos) && data.logisticaRepuestos.length) safeAppendSheet(wb, data.logisticaRepuestos, 'Logística/Repuestos');
        if (Array.isArray(data.alimentacion) && data.alimentacion.length) safeAppendSheet(wb, data.alimentacion, 'Alimentación');
        if (Array.isArray(data.logisticaCampo) && data.logisticaCampo.length) safeAppendSheet(wb, data.logisticaCampo, 'Logística/Campo');
        if (Array.isArray(data.limpiezaPersonal) && data.limpiezaPersonal.length) safeAppendSheet(wb, data.limpiezaPersonal, 'Limpieza Personal');
        if (Array.isArray(data.limpiezaGeneral) && data.limpiezaGeneral.length) safeAppendSheet(wb, data.limpiezaGeneral, 'Limpieza General');
        if (Array.isArray(data.medicamentos) && data.medicamentos.length) safeAppendSheet(wb, data.medicamentos, 'Medicamentos');
        if (Array.isArray(data.rescateAnimal) && data.rescateAnimal.length) safeAppendSheet(wb, data.rescateAnimal, 'Rescate Animal');

        const fileName = `Brigada_${brigada?.id ?? 'sin_id'}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const exportBrigadaToExcel = async () => {
        const id = brigadaId || resumenBrigada?.id;
        if (!id) {
            setSubmitStatus({ success: false, message: 'No hay brigada creada todavía. Guarda la información primero.' });
            return;
        }
        try {
            setDownloadingExcel(true);
            const all = await fetchAllForExcel(id);
            buildAndDownloadExcel(all.brigada, all.data);
        } catch (e) {
            setSubmitStatus({ success: false, message: 'No se pudo generar el Excel.' });
        } finally {
            setDownloadingExcel(false);
        }
    };


    const openResumenModal = async (brigadaIdToLoad) => {
        setShowResumenModal(true);
        setResumenLoading(true);
        setResumenError('');
        try {
            const requests = [
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/epp-ropa`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/botas`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/guantes`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/epp-equipo`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/herramientas`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/logistica-repuestos`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/alimentacion`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/logistica-campo`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/limpieza-personal`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/limpieza-general`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/medicamentos`),
                axios.get(`${API_BASE_URL}/${brigadaIdToLoad}/rescate-animal`)
            ];
            const [brigadaRes, ropaRes, botasRes, guantesRes, equipoRes, herramientasRes, repuestosRes, alimentacionRes, campoRes, limpiezaPersRes, limpiezaGenRes, medicamentosRes, rescateRes] = await Promise.all(requests);
            setResumenBrigada(brigadaRes.data || null);
            setResumenData({
                eppRopa: ropaRes.data || [],
                botas: botasRes.data || {},
                guantes: guantesRes.data || {},
                eppEquipo: equipoRes.data || [],
                herramientas: herramientasRes.data || [],
                logisticaRepuestos: repuestosRes.data || [],
                alimentacion: alimentacionRes.data || [],
                logisticaCampo: campoRes.data || [],
                limpiezaPersonal: limpiezaPersRes.data || [],
                limpiezaGeneral: limpiezaGenRes.data || [],
                medicamentos: medicamentosRes.data || [],
                rescateAnimal: rescateRes.data || []
            });
        } catch (error) {
            setResumenError('No se pudo cargar el resumen de la brigada.');
        } finally {
            setResumenLoading(false);
        }
    };

    // Cierra el modal de resumen
    const closeResumenModal = () => {
        setShowResumenModal(false);
    };

    // Utilitario: refrescar una categoría específica del resumen después de un nuevo pedido
    const refreshResumenCategory = async (brigadaIdValue, categoryKey) => {
        if (!brigadaIdValue) return;
        try {
            if (categoryKey === 'eppRopa') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/epp-ropa`);
                setResumenData(prev => ({ ...prev, eppRopa: data || [] }));
                return;
            }
            if (categoryKey === 'botas') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/botas`);
                setResumenData(prev => ({ ...prev, botas: data || {} }));
                return;
            }
            if (categoryKey === 'guantes') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/guantes`);
                setResumenData(prev => ({ ...prev, guantes: data || {} }));
                return;
            }
            if (categoryKey === 'eppEquipo') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/epp-equipo`);
                setResumenData(prev => ({ ...prev, eppEquipo: data || [] }));
                return;
            }
            if (categoryKey === 'herramientas') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/herramientas`);
                setResumenData(prev => ({ ...prev, herramientas: data || [] }));
                return;
            }
            if (categoryKey === 'logisticaRepuestos') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/logistica-repuestos`);
                setResumenData(prev => ({ ...prev, logisticaRepuestos: data || [] }));
                return;
            }
            if (categoryKey === 'alimentacion') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/alimentacion`);
                setResumenData(prev => ({ ...prev, alimentacion: data || [] }));
                return;
            }
            if (categoryKey === 'logisticaCampo') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/logistica-campo`);
                setResumenData(prev => ({ ...prev, logisticaCampo: data || [] }));
                return;
            }
            if (categoryKey === 'limpiezaPersonal') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/limpieza-personal`);
                setResumenData(prev => ({ ...prev, limpiezaPersonal: data || [] }));
                return;
            }
            if (categoryKey === 'limpiezaGeneral') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/limpieza-general`);
                setResumenData(prev => ({ ...prev, limpiezaGeneral: data || [] }));
                return;
            }
            if (categoryKey === 'medicamentos') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/medicamentos`);
                setResumenData(prev => ({ ...prev, medicamentos: data || [] }));
                return;
            }
            if (categoryKey === 'rescateAnimal') {
                const { data } = await axios.get(`${API_BASE_URL}/${brigadaIdValue}/rescate-animal`);
                setResumenData(prev => ({ ...prev, rescateAnimal: data || [] }));
            }
        } catch (e) {
            // Silencioso; el UI seguirá mostrando lo que tenía si el refresco falla
        }
    };

    // Handlers: envío de nuevos pedidos por categoría
    const handleNuevoPedidoRopa = async () => {
        if (!resumenBrigada?.id) return;
        const { item, talla, cantidad, observaciones } = pedidoInputs.ropa;
        if (!item || !talla || !cantidad) return;
        try {
            await axios.post(`${API_BASE_URL}/${resumenBrigada.id}/epp-ropa`, {
                tipo: item,
                talla: talla.toLowerCase(),
                cantidad: Number(cantidad) || 0,
                observaciones: observaciones || ''
            });
            await refreshResumenCategory(resumenBrigada.id, 'eppRopa');
            setPedidoInputs(prev => ({ ...prev, ropa: { ...prev.ropa, cantidad: 0, observaciones: '' } }));
        } catch (e) {
            alert('No se pudo registrar el pedido de EPP Ropa.');
        }
    };

    const handleNuevoPedidoBotas = async () => {
        if (!resumenBrigada?.id) return;
        const { tipo, talla, cantidad, observaciones, otratalla } = pedidoInputs.botas;
        if (!talla || !cantidad) return;
        try {
            await axios.post(`${API_BASE_URL}/${resumenBrigada.id}/botas`, {
                tipo,
                talla,
                cantidad: Number(cantidad) || 0,
                observaciones: observaciones || '',
                otratalla: otratalla || ''
            });
            await refreshResumenCategory(resumenBrigada.id, 'botas');
            setPedidoInputs(prev => ({ ...prev, botas: { ...prev.botas, cantidad: 0, observaciones: '' } }));
        } catch (e) {
            alert('No se pudo registrar el pedido de Botas.');
        }
    };

    const handleNuevoPedidoGuantes = async () => {
        if (!resumenBrigada?.id) return;
        const { xs, s, m, l, xl, xxl, otratalla } = pedidoInputs.guantes;
        const total = (xs||0)+(s||0)+(m||0)+(l||0)+(xl||0)+(xxl||0);
        if (total <= 0) return;
        try {
            await axios.post(`${API_BASE_URL}/${resumenBrigada.id}/guantes`, { xs, s, m, l, xl, xxl, otratalla });
            await refreshResumenCategory(resumenBrigada.id, 'guantes');
            setPedidoInputs(prev => ({ ...prev, guantes: { xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, otratalla: '' } }));
        } catch (e) {
            alert('No se pudo registrar el pedido de Guantes.');
        }
    };

    const handleNuevoPedidoLista = async (categoryKey, endpoint, body) => {
        if (!resumenBrigada?.id) return;
        try {
            await axios.post(`${API_BASE_URL}/${resumenBrigada.id}${endpoint}`, body);
            await refreshResumenCategory(resumenBrigada.id, categoryKey);
        } catch (e) {
            alert('No se pudo registrar el nuevo pedido.');
        }
    };

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
                setShowDownloadModal(true);
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
                    className={`px-4 py-2 border font-medium transition-colors rounded-md ${
                        currentIndex === 0
                            ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                            : 'border-red-300 text-red-700 hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-500 hover:text-white'
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
                        className={`px-6 py-2 border font-medium transition-colors rounded-md ${
                            isSubmitting
                                ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                                : 'border-red-300 text-red-700 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-600 hover:text-white'
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
        <form onSubmit={handleSubmit} className="bg-white text-neutral-900 border border-red-100 rounded-xl">
            {/* Header con paleta original rojo/naranja */}
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 py-6 px-8 text-white rounded-t-xl">
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
                    <div className="flex items-center gap-3">
                        <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                            <p className="text-white text-sm">Fecha: <span className="font-semibold">05/08/2025</span></p>
                        </div>
                        <Button
                            type="button"
                            onClick={openBrigadasModal}
                            variant="secondary"
                            size="md"
                            aria-label="Ver brigadas registradas"
                        >
                            Ver brigadas registradas
                        </Button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="px-4 py-3 border-b border-red-100 bg-white">
                <div className="flex overflow-x-auto pb-2 gap-2">
                    {SECTIONS.map(section => (
                        <Button
                            key={section.id}
                            onClick={() => goToSection(section.id)}
                            size="sm"
                            variant={activeSection === section.id ? 'primary' : 'secondary'}
                        >
                            {section.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Form Sections */}
            <div className="p-6">
                {submitStatus.success && activeSection === SECTIONS[SECTIONS.length - 1].id && (
                    <div className="mb-6 border border-black px-6 py-4 bg-black text-white">
                        <div className="flex items-center justify-between">
                            <p className="text-base">Formulario completado. Tus necesidades han sido registradas.</p>
                            <Button type="button" variant="secondary" size="sm" onClick={() => window.location.reload()} aria-label="Finalizar y reiniciar formulario">
                                Finalizar
                            </Button>
                        </div>
                    </div>
                )}
                {/* Información de la Brigada */}
                {activeSection === 'info' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold tracking-tight">Datos de la Brigada</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label>Nombre de la Brigada</Label>
                                <Input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Ingrese el nombre"
                                    maxLength={120}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Cantidad de Bomberos Activos</Label>
                                <NumberStepper
                                    value={formData.cantidadactivos}
                                    onChange={(val) => handleInputChange({ target: { name: 'cantidadactivos', value: String(val), type: 'number' } })}
                                    min={0}
                                    step={1}
                                    ariaLabel="Cantidad de bomberos activos"
                                />
                            </div>

                            <div>
                                <Label>Comandante</Label>
                                <Input
                                    type="text"
                                    name="nombrecomandante"
                                    value={formData.nombrecomandante}
                                    onChange={handleInputChange}
                                    placeholder="Nombre del comandante"
                                    maxLength={120}
                                    aria-invalid={!!formErrors.nombrecomandante}
                                    required
                                />
                                {formErrors.nombrecomandante && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.nombrecomandante}</p>
                                )}
                            </div>

                            <div>
                                <Label>Contacto Celular Comandante</Label>
                                <Input
                                    type="tel"
                                    name="celularcomandante"
                                    value={formData.celularcomandante}
                                    onChange={handleInputChange}
                                    placeholder="Número de teléfono"
                                    maxLength={30}
                                    aria-invalid={!!formErrors.celularcomandante}
                                    required
                                />
                                {formErrors.celularcomandante && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.celularcomandante}</p>
                                )}
                            </div>

                            <div>
                                <Label>Encargado de Logística</Label>
                                <Input
                                    type="text"
                                    name="encargadologistica"
                                    value={formData.encargadologistica}
                                    onChange={handleInputChange}
                                    placeholder="Nombre del encargado"
                                    maxLength={120}
                                />
                            </div>

                            <div>
                                <Label>Contacto Celular Logística</Label>
                                <Input
                                    type="tel"
                                    name="celularlogistica"
                                    value={formData.celularlogistica}
                                    onChange={handleInputChange}
                                    placeholder="Número de teléfono"
                                    maxLength={30}
                                    aria-invalid={!!formErrors.celularlogistica}
                                    required
                                />
                                {formErrors.celularlogistica && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.celularlogistica}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <Label>Número de Emergencia Público (si lo tiene)</Label>
                                <Input
                                    type="tel"
                                    name="numerosemergencia"
                                    value={formData.numerosemergencia}
                                    onChange={handleInputChange}
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
                                                        <NumberStepper
                                                            value={eppRopa[itemNombre][sizeKey]}
                                                            onChange={(val) => handleEppRopaSizeChange(itemNombre, sizeKey, val)}
                                                            min={0}
                                                            step={1}
                                                            ariaLabel={`${itemNombre} talla ${sizeKey.toUpperCase()}`}
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
                                        <div key={size} className="flex items-center gap-2">
                                            <label className="text-sm text-gray-700 w-28">Talla {size === 'otra' ? 'Otra' : size}</label>
                                            <NumberStepper
                                                value={botas[size]}
                                                onChange={(val) => handleBotasChange(size, val)}
                                                min={0}
                                                step={1}
                                                ariaLabel={`Botas talla ${size}`}
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
                                                <NumberStepper
                                                    value={eppEquipo[item].cantidad}
                                                    onChange={(val) => handleListQuantityChange(setEppEquipo)(item, val)}
                                                    min={0}
                                                    step={1}
                                                    ariaLabel={`Cantidad ${item}`}
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
                                            <NumberStepper
                                                value={guantes[talla]}
                                                onChange={(val) => handleGuantesChange(talla, val)}
                                                min={0}
                                                step={1}
                                                ariaLabel={`Guantes talla ${talla}`}
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
                                        <NumberStepper
                                            value={herramientas[tool].cantidad}
                                            onChange={(val) => handleListQuantityChange(setHerramientas)(tool, val)}
                                            min={0}
                                            step={1}
                                            ariaLabel={`Cantidad ${tool}`}
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
                                                <NumberStepper value={row.cantidad} onChange={(val)=> setHerramientasCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(val)||0 } : r))} min={0} step={1} ariaLabel={`Cantidad fila ${idx+1}`} />
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
                                        <NumberStepper
                                            value={logisticaRepuestos[item].costo}
                                            onChange={(val) => handleListCostChange(setLogisticaRepuestos)(item, val)}
                                            min={0}
                                            step={1}
                                            ariaLabel={`Costo ${item}`}
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
                                        <NumberStepper
                                            value={alimentacion[item].cantidad}
                                            onChange={(val) => handleListQuantityChange(setAlimentacion)(item, val)}
                                            min={0}
                                            step={1}
                                            ariaLabel={`Cantidad ${item}`}
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
                                                <NumberStepper value={row.cantidad} onChange={(val)=> setAlimentacionCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(val)||0 } : r))} min={0} step={1} ariaLabel={`Cantidad fila ${idx+1}`} />
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
                                        <NumberStepper
                                            value={logisticaCampo[item].cantidad}
                                            onChange={(val) => handleListQuantityChange(setLogisticaCampo)(item, val)}
                                            min={0}
                                            step={1}
                                            ariaLabel={`Cantidad ${item}`}
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
                                                <NumberStepper value={row.cantidad} onChange={(val)=> setLogisticaCampoCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(val)||0 } : r))} min={0} step={1} ariaLabel={`Cantidad fila ${idx+1}`} />
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
                                            <NumberStepper
                                                value={limpiezaPersonal[item].cantidad}
                                                onChange={(val) => handleListQuantityChange(setLimpiezaPersonal)(item, val)}
                                                min={0}
                                                step={1}
                                                ariaLabel={`Cantidad ${item}`}
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
                                                <NumberStepper value={row.cantidad} onChange={(val)=> setLimpiezaPersonalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(val)||0 } : r))} min={0} step={1} ariaLabel={`Cantidad fila ${idx+1}`} />
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
                                            <NumberStepper
                                                value={limpiezaGeneral[item].cantidad}
                                                onChange={(val) => handleListQuantityChange(setLimpiezaGeneral)(item, val)}
                                                min={0}
                                                step={1}
                                                ariaLabel={`Cantidad ${item}`}
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
                                                <NumberStepper value={row.cantidad} onChange={(val)=> setLimpiezaGeneralCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(val)||0 } : r))} min={0} step={1} ariaLabel={`Cantidad fila ${idx+1}`} />
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
                                        <NumberStepper
                                            value={medicamentos[item].cantidad}
                                            onChange={(val) => handleListQuantityChange(setMedicamentos)(item, val)}
                                            min={0}
                                            step={1}
                                            ariaLabel={`Cantidad ${item}`}
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
                                                <NumberStepper value={row.cantidad} onChange={(val)=> setMedicamentosCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(val)||0 } : r))} min={0} step={1} ariaLabel={`Cantidad fila ${idx+1}`} />
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
                                                <NumberStepper value={row.cantidad} onChange={(val)=> setRescateAnimalCustom(prev => prev.map((r,i)=> i===idx ? { ...r, cantidad: Number(val)||0 } : r))} min={0} step={1} ariaLabel={`Cantidad fila ${idx+1}`} />
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

            {/* Modal: Listado de Brigadas Registradas */}
            {showBrigadasModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Fondo oscurecido accesible */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        role="button"
                        tabIndex={0}
                        aria-label="Cerrar listado de brigadas"
                        onClick={closeBrigadasModal}
                        onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') closeBrigadasModal(); }}
                    />
                    {/* Contenedor del modal */}
                    <div className="relative bg-white text-neutral-900 w-[95vw] max-w-4xl max-h-[80vh] overflow-hidden border border-neutral-200 rounded-xl shadow-xl">
                        {/* Header del modal */}
                        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                            <h3 className="text-base font-semibold">Brigadas registradas</h3>
                            <button
                                type="button"
                                onClick={closeBrigadasModal}
                                className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100"
                                aria-label="Cerrar"
                            >
                                Cerrar
                            </button>
                        </div>
                        {/* Cuerpo del modal */}
                        <div className="p-5 overflow-auto">
                            {/* Barra de acciones: búsqueda y refrescar */}
                            <div className="mb-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        className="w-full h-10 px-3 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Buscar por nombre, comandante o teléfono..."
                                        value={brigadasQuery}
                                        onChange={(e) => setBrigadasQuery(e.target.value)}
                                        aria-label="Buscar brigadas"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={fetchBrigadas}
                                        className="px-3 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                                    >
                                        Recargar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setBrigadasQuery(''); fetchBrigadas(); }}
                                        className="px-3 py-2 border border-neutral-300 rounded-md hover:bg-neutral-100"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>
                            {isLoadingBrigadas && (
                                <div className="text-sm text-neutral-500">Cargando brigadas...</div>
                            )}
                            {!isLoadingBrigadas && brigadasError && (
                                <div className="text-sm text-red-600">{brigadasError}</div>
                            )}
                            {!isLoadingBrigadas && !brigadasError && (
                                <div className="overflow-x-auto border border-red-100 rounded-xl">
                                    <table className="min-w-full text-sm">
                                        <thead className="sticky top-0 bg-white">
                                        <tr className="text-left border-b border-red-100">
                                            {[
                                                { key: 'nombre', label: 'Nombre' },
                                                { key: 'nombrecomandante', label: 'Comandante' },
                                                { key: 'cantidadactivos', label: 'Activos' },
                                                { key: 'celularcomandante', label: 'Tel. Comandante' }
                                            ].map(col => (
                                                <th key={col.key} className="py-2 px-3 font-medium text-neutral-700">
                                                    <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => handleSortBrigadas(col.key)}>
                                                        {col.label}
                                                        {brigadasSortKey === col.key && (
                                                            <span className="text-neutral-400">{brigadasSortDir === 'asc' ? '▲' : '▼'}</span>
                                                        )}
                                                    </button>
                                                </th>
                                            ))}
                                            <th className="py-2 px-3 font-medium text-neutral-700">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {brigadas
                                            .filter(b => {
                                                if (!brigadasQuery.trim()) return true;
                                                const q = brigadasQuery.toLowerCase();
                                                return (
                                                    (b.nombre || '').toLowerCase().includes(q) ||
                                                    (b.nombrecomandante || '').toLowerCase().includes(q) ||
                                                    (b.celularcomandante || '').toLowerCase().includes(q)
                                                );
                                            })
                                            .sort((a,b) => {
                                                const dir = brigadasSortDir === 'asc' ? 1 : -1;
                                                const ka = a[brigadasSortKey] ?? '';
                                                const kb = b[brigadasSortKey] ?? '';
                                                if (typeof ka === 'number' && typeof kb === 'number') return (ka - kb) * dir;
                                                return String(ka).localeCompare(String(kb)) * dir;
                                            })
                                            .map((b, idx) => (
                                                <tr key={b.id} className={idx % 2 === 1 ? 'bg-red-50/40' : ''}>
                                                    <td className="py-2 px-3">{b.nombre || '-'}</td>
                                                    <td className="py-2 px-3">{b.nombrecomandante || '-'}</td>
                                                    <td className="py-2 px-3">{b.cantidadactivos ?? '-'}</td>
                                                    <td className="py-2 px-3">{b.celularcomandante || '-'}</td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditBrigada(b.id)}
                                                                className="px-3 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100"
                                                                aria-label={`Editar brigada ${b.nombre}`}
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePedirMasItems(b.id, 'epp')}
                                                                className="px-3 py-1 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                                                                aria-label={`Pedir más ítems para ${b.nombre}`}
                                                            >
                                                                Pedir más ítems
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openResumenModal(b.id)}
                                                                className="px-3 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100"
                                                                aria-label={`Ver resumen de ${b.nombre}`}
                                                            >
                                                                Ver resumen
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        {brigadas.filter(b => (brigadasQuery.trim() ? ((b.nombre||'').toLowerCase().includes(brigadasQuery.toLowerCase()) || (b.nombrecomandante||'').toLowerCase().includes(brigadasQuery.toLowerCase()) || (b.celularcomandante||'').toLowerCase().includes(brigadasQuery.toLowerCase())) : true)).length === 0 && (
                                            <tr>
                                                <td className="py-4 text-neutral-500" colSpan={5}>No hay brigadas que coincidan con la búsqueda.</td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Resumen / Factura de Brigada */}
            {showResumenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60"
                        role="button"
                        tabIndex={0}
                        aria-label="Cerrar resumen de brigada"
                        onClick={closeResumenModal}
                        onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') closeResumenModal(); }}
                    />
                    <div className="relative bg-white text-neutral-900 w-[96vw] max-w-6xl max-h-[85vh] overflow-hidden border border-neutral-200 rounded-xl shadow-xl">
                        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                            <div>
                                <h3 className="text-base font-semibold">Resumen / Factura</h3>
                                <p className="text-xs text-neutral-500">
                                    {resumenBrigada ? `${resumenBrigada.nombre} — Comandante: ${resumenBrigada.nombrecomandante || '-'}` : 'Cargando...'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeResumenModal}
                                className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-100"
                                aria-label="Cerrar"
                            >
                                Cerrar
                            </button>
                        </div>
                        <div className="p-5 space-y-6 overflow-auto">
                            {resumenLoading && <div className="text-sm text-neutral-500">Cargando resumen...</div>}
                            {!resumenLoading && resumenError && (
                                <div className="text-sm text-red-600">{resumenError}</div>
                            )}
                            {!resumenLoading && !resumenError && resumenBrigada && (
                                <div className="space-y-8">
                                    {/* Sección: EPP Ropa */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold">EPP Ropa</h4>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
                                                    value={pedidoInputs.ropa.item}
                                                    onChange={(e) => setPedidoInputs(prev => ({ ...prev, ropa: { ...prev.ropa, item: e.target.value } }))}
                                                    aria-label="Seleccionar prenda"
                                                >
                                                    {EPP_ROPA_ITEMS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
                                                    value={pedidoInputs.ropa.talla}
                                                    onChange={(e) => setPedidoInputs(prev => ({ ...prev, ropa: { ...prev.ropa, talla: e.target.value } }))}
                                                    aria-label="Seleccionar talla"
                                                >
                                                    {['xs','s','m','l','xl'].map(t => (
                                                        <option key={t} value={t}>{t.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-24 border border-neutral-300 rounded-md px-2 py-1 text-sm"
                                                    value={pedidoInputs.ropa.cantidad}
                                                    onChange={(e) => setPedidoInputs(prev => ({ ...prev, ropa: { ...prev.ropa, cantidad: Number(e.target.value) || 0 } }))}
                                                    placeholder="Cant."
                                                    aria-label="Cantidad"
                                                />
                                                <input
                                                    type="text"
                                                    className="border border-neutral-300 rounded-md px-2 py-1 text-sm w-64"
                                                    value={pedidoInputs.ropa.observaciones}
                                                    onChange={(e) => setPedidoInputs(prev => ({ ...prev, ropa: { ...prev.ropa, observaciones: e.target.value } }))}
                                                    placeholder="Observaciones (opcional)"
                                                    aria-label="Observaciones"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleNuevoPedidoRopa}
                                                    className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                                                >
                                                    Nuevo pedido
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                <tr className="border-b border-neutral-200 text-left">
                                                    <th className="py-2 pr-4">Prenda</th>
                                                    <th className="py-2 pr-4">XS</th>
                                                    <th className="py-2 pr-4">S</th>
                                                    <th className="py-2 pr-4">M</th>
                                                    <th className="py-2 pr-4">L</th>
                                                    <th className="py-2 pr-4">XL</th>
                                                    <th className="py-2 pr-4">Obs.</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {resumenData.eppRopa.length === 0 && (
                                                    <tr><td className="py-3 text-neutral-500" colSpan={7}>Sin registros</td></tr>
                                                )}
                                                {resumenData.eppRopa.map((r) => (
                                                    <tr key={`${r.item}-${r.id || Math.random()}`} className="border-b border-neutral-100">
                                                        <td className="py-2 pr-4">{r.item}</td>
                                                        <td className="py-2 pr-4">{r.xs ?? 0}</td>
                                                        <td className="py-2 pr-4">{r.s ?? 0}</td>
                                                        <td className="py-2 pr-4">{r.m ?? 0}</td>
                                                        <td className="py-2 pr-4">{r.l ?? 0}</td>
                                                        <td className="py-2 pr-4">{r.xl ?? 0}</td>
                                                        <td className="py-2 pr-4">{r.observaciones || '-'}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Sección: Botas */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold">Botas</h4>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
                                                    value={pedidoInputs.botas.talla}
                                                    onChange={(e) => setPedidoInputs(prev => ({ ...prev, botas: { ...prev.botas, talla: e.target.value } }))}
                                                    aria-label="Seleccionar talla"
                                                >
                                                    {BOTAS_SIZES.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-24 border border-neutral-300 rounded-md px-2 py-1 text-sm"
                                                    value={pedidoInputs.botas.cantidad}
                                                    onChange={(e) => setPedidoInputs(prev => ({ ...prev, botas: { ...prev.botas, cantidad: Number(e.target.value) || 0 } }))}
                                                    placeholder="Cant."
                                                    aria-label="Cantidad"
                                                />
                                                <input
                                                    type="text"
                                                    className="border border-neutral-300 rounded-md px-2 py-1 text-sm w-64"
                                                    value={pedidoInputs.botas.observaciones}
                                                    onChange={(e) => setPedidoInputs(prev => ({ ...prev, botas: { ...prev.botas, observaciones: e.target.value } }))}
                                                    placeholder="Observaciones (opcional)"
                                                    aria-label="Observaciones"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleNuevoPedidoBotas}
                                                    className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                                                >
                                                    Nuevo pedido
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                <tr className="border-b border-neutral-200 text-left">
                                                    <th className="py-2 pr-4">37</th>
                                                    <th className="py-2 pr-4">38</th>
                                                    <th className="py-2 pr-4">39</th>
                                                    <th className="py-2 pr-4">40</th>
                                                    <th className="py-2 pr-4">41</th>
                                                    <th className="py-2 pr-4">42</th>
                                                    <th className="py-2 pr-4">43</th>
                                                    <th className="py-2 pr-4">Otra</th>
                                                    <th className="py-2 pr-4">Obs.</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr>
                                                    <td className="py-2 pr-4">{resumenData.botas?.talla37 ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.botas?.talla38 ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.botas?.talla39 ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.botas?.talla40 ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.botas?.talla41 ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.botas?.talla42 ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.botas?.talla43 ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.botas?.otratalla || '-'}</td>
                                                    <td className="py-2 pr-4">{resumenData.botas?.observaciones || '-'}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Sección: Guantes */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold">Guantes</h4>
                                            <div className="flex items-center gap-2">
                                                {['xs','s','m','l','xl','xxl'].map(t => (
                                                    <input
                                                        key={`g-${t}`}
                                                        type="number"
                                                        min="0"
                                                        className="w-20 border border-neutral-300 rounded-md px-2 py-1 text-sm"
                                                        value={pedidoInputs.guantes[t] || 0}
                                                        onChange={(e) => setPedidoInputs(prev => ({ ...prev, guantes: { ...prev.guantes, [t]: Number(e.target.value) || 0 } }))}
                                                        placeholder={t.toUpperCase()}
                                                        aria-label={`Cantidad ${t.toUpperCase()}`}
                                                    />
                                                ))}
                                                <input
                                                    type="text"
                                                    className="border border-neutral-300 rounded-md px-2 py-1 text-sm w-64"
                                                    value={pedidoInputs.guantes.otratalla}
                                                    onChange={(e) => setPedidoInputs(prev => ({ ...prev, guantes: { ...prev.guantes, otratalla: e.target.value } }))}
                                                    placeholder="Otra talla (texto)"
                                                    aria-label="Otra talla"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleNuevoPedidoGuantes}
                                                    className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                                                >
                                                    Nuevo pedido
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                <tr className="border-b border-neutral-200 text-left">
                                                    <th className="py-2 pr-4">XS</th>
                                                    <th className="py-2 pr-4">S</th>
                                                    <th className="py-2 pr-4">M</th>
                                                    <th className="py-2 pr-4">L</th>
                                                    <th className="py-2 pr-4">XL</th>
                                                    <th className="py-2 pr-4">XXL</th>
                                                    <th className="py-2 pr-4">Otra</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr>
                                                    <td className="py-2 pr-4">{resumenData.guantes?.xs ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.guantes?.s ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.guantes?.m ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.guantes?.l ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.guantes?.xl ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.guantes?.xxl ?? 0}</td>
                                                    <td className="py-2 pr-4">{resumenData.guantes?.otratalla || '-'}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Secciones de lista genérica (equipo, herramientas, repuestos, alimentacion, campo, limpieza, medicamentos, rescate) */}
                                    {[
                                        { key: 'eppEquipo', title: 'EPP Equipo', endpoint: '/epp-equipo', inputKey: 'equipo', inputShape: ['item','cantidad','observaciones'], items: EPP_EQUIPO_ITEMS },
                                        { key: 'herramientas', title: 'Herramientas', endpoint: '/herramientas', inputKey: 'herramientas', inputShape: ['item','cantidad','observaciones'], items: HERRAMIENTAS_ITEMS },
                                        { key: 'logisticaRepuestos', title: 'Logística Repuestos', endpoint: '/logistica-repuestos', inputKey: 'repuestos', inputShape: ['item','costo','observaciones'], items: LOGISTICA_REPUESTOS_ITEMS },
                                        { key: 'alimentacion', title: 'Alimentación', endpoint: '/alimentacion', inputKey: 'alimentacion', inputShape: ['item','cantidad','observaciones'], items: ALIMENTACION_ITEMS },
                                        { key: 'logisticaCampo', title: 'Logística Campo', endpoint: '/logistica-campo', inputKey: 'campo', inputShape: ['item','cantidad','observaciones'], items: CAMPO_ITEMS },
                                        { key: 'limpiezaPersonal', title: 'Limpieza Personal', endpoint: '/limpieza-personal', inputKey: 'limpiezaPersonal', inputShape: ['item','cantidad','observaciones'], items: LIMPIEZA_PERSONAL_ITEMS },
                                        { key: 'limpiezaGeneral', title: 'Limpieza General', endpoint: '/limpieza-general', inputKey: 'limpiezaGeneral', inputShape: ['item','cantidad','observaciones'], items: LIMPIEZA_GENERAL_ITEMS },
                                        { key: 'medicamentos', title: 'Medicamentos', endpoint: '/medicamentos', inputKey: 'medicamentos', inputShape: ['item','cantidad','observaciones'], items: MEDICAMENTOS_ITEMS },
                                        { key: 'rescateAnimal', title: 'Rescate Animal', endpoint: '/rescate-animal', inputKey: 'rescateAnimal', inputShape: ['item','cantidad','observaciones'], items: RESCATE_ANIMAL_ITEMS }
                                    ].map(section => (
                                        <div key={section.key}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-semibold">{section.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
                                                        value={pedidoInputs[section.inputKey].item}
                                                        onChange={(e) => setPedidoInputs(prev => ({ ...prev, [section.inputKey]: { ...prev[section.inputKey], item: e.target.value } }))}
                                                        aria-label={`Seleccionar ítem en ${section.title}`}
                                                    >
                                                        {section.items.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-24 border border-neutral-300 rounded-md px-2 py-1 text-sm"
                                                        value={pedidoInputs[section.inputKey][section.inputShape.includes('costo') ? 'costo' : 'cantidad']}
                                                        onChange={(e) => setPedidoInputs(prev => ({
                                                            ...prev,
                                                            [section.inputKey]: {
                                                                ...prev[section.inputKey],
                                                                [section.inputShape.includes('costo') ? 'costo' : 'cantidad']: Number(e.target.value) || 0
                                                            }
                                                        }))}
                                                        placeholder={section.inputShape.includes('costo') ? 'Costo' : 'Cant.'}
                                                        aria-label={section.inputShape.includes('costo') ? 'Costo' : 'Cantidad'}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="border border-neutral-300 rounded-md px-2 py-1 text-sm w-64"
                                                        value={pedidoInputs[section.inputKey].observaciones}
                                                        onChange={(e) => setPedidoInputs(prev => ({ ...prev, [section.inputKey]: { ...prev[section.inputKey], observaciones: e.target.value } }))}
                                                        placeholder="Observaciones (opcional)"
                                                        aria-label="Observaciones"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNuevoPedidoLista(
                                                            section.key,
                                                            section.endpoint,
                                                            {
                                                                item: pedidoInputs[section.inputKey].item,
                                                                [section.inputShape.includes('costo') ? 'costo' : 'cantidad']:
                                                                    Number(pedidoInputs[section.inputKey][section.inputShape.includes('costo') ? 'costo' : 'cantidad']) || 0,
                                                                observaciones: pedidoInputs[section.inputKey].observaciones || ''
                                                            }
                                                        )}
                                                        className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                                                    >
                                                        Nuevo pedido
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead>
                                                    <tr className="border-b border-neutral-200 text-left">
                                                        <th className="py-2 pr-4">Ítem</th>
                                                        <th className="py-2 pr-4">{section.inputShape.includes('costo') ? 'Costo' : 'Cantidad'}</th>
                                                        <th className="py-2 pr-4">Obs.</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {resumenData[section.key].length === 0 && (
                                                        <tr><td className="py-3 text-neutral-500" colSpan={3}>Sin registros</td></tr>
                                                    )}
                                                    {resumenData[section.key].map((r) => (
                                                        <tr key={`${r.item}-${r.id || Math.random()}`} className="border-b border-neutral-100">
                                                            <td className="py-2 pr-4">{r.item}</td>
                                                            <td className="py-2 pr-4">{(section.inputShape.includes('costo') ? r.costo : r.cantidad) ?? 0}</td>
                                                            <td className="py-2 pr-4">{r.observaciones || '-'}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Descargar Excel al finalizar */}
            {showDownloadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60"
                        role="button"
                        tabIndex={0}
                        aria-label="Cerrar modal de descarga"
                        onClick={() => setShowDownloadModal(false)}
                        onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setShowDownloadModal(false); }}
                    />
                    <div className="relative bg-white text-neutral-900 w-[90vw] max-w-md border border-neutral-200 rounded-xl shadow-xl">
                        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
                            <h3 className="text-base font-semibold">Descargar Excel</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm text-neutral-700">
                                ¿Deseas descargar un archivo Excel (.xlsx) con <b>toda</b> la información registrada de esta brigada,
                                incluyendo EPP, herramientas, logística, alimentación, limpieza, medicamentos y rescate animal?
                            </p>
                        </div>
                        <div className="px-5 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDownloadModal(false)}
                                className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-100"
                            >
                                No, gracias
                            </button>
                            <button
                                type="button"
                                onClick={exportBrigadaToExcel}
                                disabled={downloadingExcel}
                                className="px-4 py-2 rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium disabled:opacity-60"
                            >
                                {downloadingExcel ? 'Generando…' : 'Descargar Excel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </form>
    );
};

export default BombForm;