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
import { ContextSummary } from './context-summary';
import type { Cliente, Compania, Seccion } from '@/types/master-data';

interface ContextFormProps {
  hookInstance: any;
}

export function ContextForm({ hookInstance }: ContextFormProps) {
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

  // Cargar datos maestros al montar
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        console.log('🔄 Cargando datos maestros en ContextForm...');
        
        const [companiasData, seccionesData] = await Promise.all([
          getCompanias(),
          getSecciones()
        ]);
        
        setCompanias(companiasData);
        setSecciones(seccionesData);
        
        console.log('✅ Datos maestros cargados:', {
          companias: companiasData.length,
          secciones: seccionesData.length
        });
      } catch (error) {
        console.error('❌ Error loading master data:', error);
      }
    };

    loadMasterData();
  }, [getCompanias, getSecciones]);

  useEffect(() => {
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
      } : undefined
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
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Selector de Cliente - NUEVO COMPONENTE */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <User className="h-4 w-4" />
                Cliente
                {state.context.clienteId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </label>
              
              <ClienteSearchCombobox
                value={state.context.clienteId}
                onValueChange={handleClienteChange}
                placeholder="Buscar cliente por nombre o documento..."
                className="w-full"
              />
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Busca por nombre, documento o email del cliente
              </p>
            </div>

            {/* Selector de Compañía */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <Building2 className="h-4 w-4" />
                Compañía
                {state.context.companiaId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </label>
              <select
                className={`w-full p-2 border rounded-md text-gray-900 dark:text-gray-100 ${
                  state.context.companiaId 
                    ? 'border-green-500 dark:border-green-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                value={state.context.companiaId || ''}
                onChange={(e) => handleCompaniaSelect(parseInt(e.target.value))}
                disabled={masterDataLoading}
              >
                <option value="" className="bg-black text-gray-500 dark:text-gray-400">
                  Seleccionar compañía...
                </option>
                {companias.map((compania) => (
                  <option key={compania.id} value={compania.id} className="bg-black text-gray-900 dark:text-gray-100">
                    {compania.displayName || compania.nombre}
                  </option>
                ))}
              </select>
              
              {masterDataLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Cargando compañías...</p>
              )}
            </div>

            {/* Selector de Sección */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <FileText className="h-4 w-4" />
                Sección
                {state.context.seccionId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </label>
              <select
                className={`w-full p-2 border rounded-md text-gray-900 dark:text-gray-100 ${
                  state.context.seccionId 
                    ? 'border-green-500 dark:border-green-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                value={state.context.seccionId || ''}
                onChange={(e) => handleSeccionSelect(parseInt(e.target.value))}
                disabled={masterDataLoading}
              >
                <option value="" className="bg-black text-gray-500 dark:text-gray-400">
                  Seleccionar sección...
                </option>
                {seccionesFiltradas.map((seccion) => (
                  <option key={seccion.id} value={seccion.id} className="bg-black text-gray-900 dark:text-gray-100">
                    {seccion.displayName || seccion.nombre}
                  </option>
                ))}
              </select>
              
              {seccionesFiltradas.length === 0 && !masterDataLoading && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  No hay secciones disponibles
                </p>
              )}
            </div>
          </div>

          {/* Resumen de selección - Solo si el contexto es válido */}
          {isContextValid && (
            <ContextSummary context={state.context} />
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
              onFileRemove={removeSelectedFile}  // ← AGREGAR ESTA LÍNEA
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

          {isContextValid && !state.file.uploaded && (
            <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                ¡Perfecto! El contexto está configurado. Ahora puedes cargar el archivo PDF.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}