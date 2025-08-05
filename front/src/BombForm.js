
import React, { useState } from 'react';

const BombForm = () => {
    const [activeSection, setActiveSection] = useState('info');

    const sections = [
        { id: 'info', name: 'Información de la Brigada' },
        { id: 'epp', name: 'Equipamiento EPP' },
        { id: 'tools', name: 'Herramientas' },
        { id: 'logistics', name: 'Logística Vehículos' },
        { id: 'food', name: 'Alimentación' },
        { id: 'camp', name: 'Equipo de Campo' },
        { id: 'hygiene', name: 'Limpieza Personal' },
        { id: 'meds', name: 'Medicamentos' },
        { id: 'animals', name: 'Rescate Animal' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
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
                    {sections.map(section => (
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Ingrese el nombre"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Bomberos Activos</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Número de bomberos"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comandante</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Nombre del comandante"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto Celular Comandante</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Número de teléfono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Encargado de Logística</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Nombre del encargado"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto Celular Logística</label>
                                <input
                                    type="tel"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Número de teléfono"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Emergencia Público (si lo tiene)</label>
                                <input
                                    type="tel"
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

                {/* Footer */}
                <div className="mt-10 pt-6 border-t border-gray-200 flex justify-between">
                    <button className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Guardar Formulario
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BombForm;