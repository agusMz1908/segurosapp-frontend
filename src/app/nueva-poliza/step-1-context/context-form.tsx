import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Building2, 
  FileText,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useMasterData } from '../../../hooks/use-master-data';
import { ClienteSearchCombobox } from '@/components/clientes/ClienteSearchCombobox';
import { formatDocument, getClienteContactText } from '@/lib/mappers';
import { FileUpload } from './file-upload';
import type { Cliente, Compania, Seccion } from '@/types/master-data';

interface ContextFormProps {
  hookInstance: any;
}

// Configuración simple de filtros - fácil de modificar
const COMPANIAS_HABILITADAS = [
  'BANCO DE SEGUROS',
  'MAPFRE', 
  'SURA SEGUROS',
  'PORTO SEGUROS'
];

const SECCIONES_HABILITADAS = [
  'AUTOMOVILES'
];

export function ContextForm({ hookInstance }: ContextFormProps) {
  console.log('DEBUG - Context State:', hookInstance.state.context);
  console.log('DEBUG - isContextValid:', hookInstance.isContextValid());
  const { state, updateContext, isContextValid, uploadWithContext, removeSelectedFile } = hookInstance;
  const { 
    getCompanias, 
    getSecciones, 
    loading: masterDataLoading,
    error: masterDataError 
  } = useMasterData();

  // Estados locales
  const [companias, setCompanias] = useState<Compania[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionesFiltradas, setSeccionesFiltradas] = useState<Seccion[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | undefined>();

  // Función para filtrar compañías
  const filtrarCompanias = (companias: Compania[]): Compania[] => {
    return companias.filter(compania => 
      COMPANIAS_HABILITADAS.some(nombreHabilitado => 
        compania.nombre.toUpperCase().includes(nombreHabilitado.toUpperCase()) ||
        compania.codigo?.toUpperCase() === nombreHabilitado.toUpperCase()
      )
    );
  };

  // Función para filtrar secciones
  const filtrarSecciones = (secciones: Seccion[]): Seccion[] => {
    console.log('🔍 DEBUG - Filtrando secciones:', {
      seccionesOriginales: secciones.map(s => ({ id: s.id, nombre: s.nombre, codigo: s.codigo })),
      seccionesHabilitadas: SECCIONES_HABILITADAS
    });
    
    const filtradas = secciones.filter(seccion => {
      const coincide = SECCIONES_HABILITADAS.some(nombreHabilitado => {
        const nombreCoincide = seccion.nombre.toUpperCase().includes(nombreHabilitado.toUpperCase());
        const codigoCoincide = seccion.codigo?.toUpperCase() === nombreHabilitado.toUpperCase();
        
        console.log(`🔍 Comparando "${seccion.nombre}" con "${nombreHabilitado}":`, {
          nombreCoincide,
          codigoCoincide,
          resultado: nombreCoincide || codigoCoincide
        });
        
        return nombreCoincide || codigoCoincide;
      });
      
      return coincide;
    });
    
    console.log('✅ Secciones filtradas:', filtradas.map(s => s.nombre));
    return filtradas;
  };

  // Cargar datos maestros al montar
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        console.log('Cargando datos maestros en ContextForm...');
        
        const [companiasData, seccionesData] = await Promise.all([
          getCompanias(),
          getSecciones()
        ]);
        
        // Aplicar filtros
        const companiasFiltradas = filtrarCompanias(companiasData);
        const seccionesFiltradas = filtrarSecciones(seccionesData);
        
        setCompanias(companiasFiltradas);
        setSecciones(seccionesFiltradas);
        
        console.log('Datos maestros cargados y filtrados:', {
          companiasTotal: companiasData.length,
          companiasFiltradas: companiasFiltradas.length,
          seccionesTotal: seccionesData.length,
          seccionesFiltradas: seccionesFiltradas.length
        });

        console.log('Compañías disponibles:', companiasFiltradas.map(c => c.nombre));
        console.log('Secciones disponibles:', seccionesFiltradas.map(s => s.nombre));
        
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, [getCompanias, getSecciones]);

  // Actualizar secciones filtradas cuando cambie la compañía
  useEffect(() => {
    // CAMBIO: No filtrar por compañía, mostrar todas las secciones habilitadas
    setSeccionesFiltradas(secciones);
  }, [secciones]);

  // Handlers
  const handleClienteChange = (clienteId: number | undefined, cliente?: Cliente) => {
    setClienteSeleccionado(cliente);
    updateContext({ 
      clienteId, 
      clienteInfo: cliente ? {
        id: cliente.id,
        nombre: cliente.nombre,
        documento: cliente.documento,
        documentType: cliente.documentType,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        activo: cliente.activo,
        displayName: cliente.displayName,
        contactInfo: cliente.contactInfo
      } : undefined
    });

    console.log('Cliente seleccionado en contexto:', cliente);
  };

  const handleCompaniaSelect = (companiaId: number) => {
    const compania = companias.find(c => c.id === companiaId);
    updateContext({ 
      companiaId, 
      companiaInfo: compania ? {
        id: compania.id,
        nombre: compania.nombre,
        codigo: compania.codigo,
        activa: compania.activa,
        displayName: compania.displayName
      } : undefined,
      // Limpiar sección cuando cambia compañía
      seccionId: undefined,
      seccionInfo: undefined
    });

    console.log('Compañía seleccionada:', compania);
  };

  const handleSeccionSelect = (seccionId: number) => {
    const seccion = seccionesFiltradas.find(s => s.id === seccionId);
    updateContext({ 
      seccionId, 
      seccionInfo: seccion ? {
        id: seccion.id,
        nombre: seccion.nombre,
        codigo: seccion.codigo,
        companiaId: seccion.companiaId,
        activa: seccion.activa,
        displayName: seccion.displayName
      } : undefined
    });

    console.log('Sección seleccionada:', seccion);
  };

  return (
    <div className="space-y-6">
      
      {/* Header del paso */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Configurar Contexto
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Selecciona el cliente, compañía y sección para establecer el contexto de la nueva póliza
        </p>
      </div>

      {/* Formulario de selección */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <User className="h-5 w-5" />
            Información de Contexto
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Todos los campos son obligatorios antes de poder cargar el documento PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Selector de Cliente */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <User className="h-4 w-4" />
                Cliente
                {state.context.clienteId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </label>
              
              <div className="w-full max-w-full">
                <ClienteSearchCombobox
                  value={state.context.clienteId}
                  onValueChange={handleClienteChange}
                  placeholder="Buscar cliente..."
                  className="w-full max-w-full"
                />
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Busca por nombre, documento o email del cliente
              </p>
            </div>

            {/* Selector de Compañía */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <Building2 className="h-4 w-4" />
                Compañía
                {state.context.companiaId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </label>
              
              <select
                className="w-full p-3 border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={state.context.companiaId || ''}
                onChange={(e) => handleCompaniaSelect(Number(e.target.value))}
                disabled={masterDataLoading}
              >
                <option value="">Seleccionar compañía...</option>
                {companias.map(compania => (
                  <option key={compania.id} value={compania.id}>
                    {compania.nombre}
                  </option>
                ))}
              </select>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Selecciona la compañía de seguros</p>
                {companias.length > 0 && (
                  <span className="text-blue-600 dark:text-blue-400">
                    {companias.length} compañías disponibles
                  </span>
                )}
              </div>
            </div>

            {/* Selector de Sección */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <FileText className="h-4 w-4" />
                Sección
                {state.context.seccionId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </label>
              
              <select
                className="w-full p-3 border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={state.context.seccionId || ''}
                onChange={(e) => handleSeccionSelect(Number(e.target.value))}
                disabled={masterDataLoading || !state.context.companiaId}
              >
                <option value="">Seleccionar sección...</option>
                {seccionesFiltradas.map(seccion => (
                  <option key={seccion.id} value={seccion.id}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Selecciona el tipo de póliza</p>
                {seccionesFiltradas.length > 0 && (
                  <span className="text-blue-600 dark:text-blue-400">
                    {seccionesFiltradas.length} secciones disponibles
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Información seleccionada */}
          {(clienteSeleccionado || state.context.companiaInfo || state.context.seccionInfo) && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Contexto Seleccionado
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {clienteSeleccionado && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Cliente:</span>
                    <p className="text-gray-900 dark:text-gray-100">{clienteSeleccionado.nombre}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {formatDocument(clienteSeleccionado.documento, clienteSeleccionado.documentType)}
                    </p>
                  </div>
                )}
                
                {state.context.companiaInfo && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Compañía:</span>
                    <p className="text-gray-900 dark:text-gray-100">{state.context.companiaInfo.nombre}</p>
                  </div>
                )}
                
                {state.context.seccionInfo && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Sección:</span>
                    <p className="text-gray-900 dark:text-gray-100">{state.context.seccionInfo.nombre}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error de datos maestros */}
      {masterDataError && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Error cargando datos maestros: {masterDataError}
          </AlertDescription>
        </Alert>
      )}

      {/* Área de carga de archivos */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FileText className="h-5 w-5" />
            Documento de Póliza
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Carga el archivo PDF de la póliza para procesar automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            disabled={!isContextValid}
            onFileUpload={uploadWithContext}
            onFileRemove={removeSelectedFile}
            uploadProgress={state.file.uploadProgress}
            uploadStatus={state.file.uploaded ? 'completed' : state.scan.status === 'scanning' ? 'uploading' : 'idle'}
            scanStatus={state.scan.status}
            scanResult={{
              completionPercentage: state.scan.completionPercentage,
              extractedData: state.scan.extractedData,
              requiresAttention: state.scan.requiresAttention,
              errorMessage: state.scan.errorMessage,
            }}
            acceptedFile={state.file.selected}
          />
          {/* Alertas contextuales */}
          {!isContextValid && (
            <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Completa la configuración del contexto para habilitar la carga de archivos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}