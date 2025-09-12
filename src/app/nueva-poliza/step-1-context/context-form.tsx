// step-1-context/context-form.tsx
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
import { FileUpload } from './file-upload';
import { ContextSummary } from './context-summary';

interface ContextFormProps {
  hookInstance: any;
}

export function ContextForm({ hookInstance }: ContextFormProps) {
  const { state, updateContext, isContextValid, uploadWithContext } = hookInstance;
  const { 
    searchClientes, 
    getCompanias, 
    getSecciones, 
    loading: masterDataLoading 
  } = useMasterData();

  // Estados locales
  const [clientes, setClientes] = useState<any[]>([]);
  const [companias, setCompanias] = useState<any[]>([]);
  const [secciones, setSecciones] = useState<any[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [isSearchingClientes, setIsSearchingClientes] = useState(false);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  // Cargar datos maestros al montar
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [companiasData, seccionesData] = await Promise.all([
          getCompanias(),
          getSecciones()
        ]);
        setCompanias(companiasData);
        setSecciones(seccionesData);
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, [getCompanias, getSecciones]);

  // Búsqueda de clientes con debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (clienteSearch.trim().length >= 2) {
        setIsSearchingClientes(true);
        try {
          const results = await searchClientes(clienteSearch);
          setClientes(results);
          setShowClienteDropdown(true);
        } catch (error) {
          console.error('Error searching clientes:', error);
        } finally {
          setIsSearchingClientes(false);
        }
      } else {
        setClientes([]);
        setShowClienteDropdown(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [clienteSearch, searchClientes]);

  const handleClienteSelect = (cliente: any) => {
    updateContext({ 
      clienteId: cliente.id, 
      clienteInfo: cliente 
    });
    setClienteSearch(`${cliente.nombre} - ${cliente.documento}`);
    setShowClienteDropdown(false);
  };

  const handleCompaniaSelect = (companiaId: number) => {
    const compania = companias.find(c => c.id === companiaId);
    updateContext({ 
      companiaId, 
      companiaInfo: compania 
    });
  };

  const handleSeccionSelect = (seccionId: number) => {
    const seccion = secciones.find(s => s.id === seccionId);
    updateContext({ 
      seccionId, 
      seccionInfo: seccion 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header del paso */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Configurar Contexto</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Selecciona el cliente, compañía y sección para establecer el contexto de la nueva póliza
        </p>
      </div>

      {/* Formulario de selección */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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
            {/* Selector de Cliente */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <User className="h-4 w-4" />
                Cliente
                {state.context.clienteId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre o documento..."
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  onFocus={() => setShowClienteDropdown(clientes.length > 0)}
                  className={`w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                    state.context.clienteId 
                      ? 'border-green-500 dark:border-green-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                
                {/* Dropdown de resultados */}
                {showClienteDropdown && clientes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {clientes.map((cliente) => (
                      <button
                        key={cliente.id}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-b-0 border-gray-200 dark:border-gray-600"
                        onClick={() => handleClienteSelect(cliente)}
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{cliente.documento}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Escribe al menos 2 caracteres para buscar
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
                className={`w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  state.context.companiaId 
                    ? 'border-green-500 dark:border-green-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                value={state.context.companiaId || ''}
                onChange={(e) => handleCompaniaSelect(parseInt(e.target.value))}
                disabled={masterDataLoading}
              >
                <option value="" className="text-gray-500 dark:text-gray-400">Seleccionar compañía...</option>
                {companias.map((compania) => (
                  <option key={compania.id} value={compania.id} className="text-gray-900 dark:text-gray-100">
                    {compania.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Sección */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <FileText className="h-4 w-4" />
                Sección
                {state.context.seccionId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </label>
              <select
                className={`w-full p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                  state.context.seccionId 
                    ? 'border-green-500 dark:border-green-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                value={state.context.seccionId || ''}
                onChange={(e) => handleSeccionSelect(parseInt(e.target.value))}
                disabled={masterDataLoading}
              >
                <option value="" className="text-gray-500 dark:text-gray-400">Seleccionar sección...</option>
                {secciones.map((seccion) => (
                  <option key={seccion.id} value={seccion.id} className="text-gray-900 dark:text-gray-100">
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumen de selección */}
          {isContextValid && (
            <ContextSummary context={state.context} />
          )}
        </CardContent>
      </Card>

      {/* Área de carga de archivos */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
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