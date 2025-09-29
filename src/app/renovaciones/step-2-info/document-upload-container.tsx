import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  FileText, 
  CheckCircle,
  Info,
  Building2,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useMasterData } from '@/hooks/use-master-data';
import { DocumentUploader } from '../step-3-validation/document-uploader';
import type { Compania } from '@/types/master-data';

interface DocumentUploadContainerProps {
  hookInstance: any;
}

const COMPANIAS_HABILITADAS = [
  'BANCO DE SEGUROS',
  'MAPFRE', 
  'SURA SEGUROS',
  'PORTO SEGUROS'
];

function ClienteContextDisplay({ clienteInfo }: { clienteInfo?: any }) {
  if (!clienteInfo) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <p className="text-gray-500">No hay información del cliente disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
      <p className="font-medium">{clienteInfo.nombre}</p>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <div><strong>Documento:</strong> {clienteInfo.documento || 'No especificado'}</div>
        {clienteInfo.email && (
          <div><strong>Email:</strong> {clienteInfo.email}</div>
        )}
        {clienteInfo.telefono && (
          <div><strong>Teléfono:</strong> {clienteInfo.telefono}</div>
        )}
        <div>
          <strong>Estado:</strong>{' '}
          <span className={clienteInfo.activo ? 'text-green-600' : 'text-red-600'}>
            {clienteInfo.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DocumentUploadContainer({ hookInstance }: DocumentUploadContainerProps) {
  const { state, uploadDocumentForRenovacion, updateState } = hookInstance;
  const { getCompanias, loading: loadingCompanias } = useMasterData();
  
  const [companias, setCompanias] = useState<Compania[]>([]);
  const [usarMismaCompania, setUsarMismaCompania] = useState(true);
  const [companiaSeleccionada, setCompaniaSeleccionada] = useState<number | null>(null);
  const [companiaOriginalId, setCompaniaOriginalId] = useState<number | null>(null);

  useEffect(() => {
    const loadCompanias = async () => {
      try {
        const data = await getCompanias();
        const filtradas = data.filter(compania => 
          COMPANIAS_HABILITADAS.some(nombreHabilitado => 
            compania.nombre.toUpperCase().includes(nombreHabilitado.toUpperCase())
          )
        );
        setCompanias(filtradas);
      } catch (error) {
        console.error('Error cargando compañías:', error);
      }
    };
    loadCompanias();
  }, [getCompanias]);

  useEffect(() => {
    if (state.context.companiaInfo?.id && companiaOriginalId === null) {
      setCompaniaOriginalId(state.context.companiaInfo.id);
      setCompaniaSeleccionada(state.context.companiaInfo.id);
      console.log('💾 Compañía original guardada:', state.context.companiaInfo.nombre);
    }
  }, [state.context.companiaInfo, companiaOriginalId]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleToggleUsarMisma = (checked: boolean) => {
    setUsarMismaCompania(checked);
    
    if (checked && companiaOriginalId) {
      setCompaniaSeleccionada(companiaOriginalId);
      const companiaOriginal = companias.find(c => c.id === companiaOriginalId);
      
      updateState((prevState: any) => ({
        ...prevState,
        context: {
          ...prevState.context,
          companiaId: companiaOriginalId,
          companiaInfo: companiaOriginal ? {
            id: companiaOriginal.id,
            nombre: companiaOriginal.nombre,
            codigo: companiaOriginal.codigo
          } : prevState.context.companiaInfo
        }
      }));
      
      console.log('🔄 Compañía restaurada a original:', companiaOriginal?.nombre);
    }
  };

  const handleCompaniaChange = (companiaId: number) => {
    setCompaniaSeleccionada(companiaId);
    const compania = companias.find(c => c.id === companiaId);
    
    updateState((prevState: any) => ({
      ...prevState,
      context: {
        ...prevState.context,
        companiaId: companiaId,
        companiaInfo: compania ? {
          id: compania.id,
          nombre: compania.nombre,
          codigo: compania.codigo
        } : prevState.context.companiaInfo
      }
    }));
  };

  const handleFileRemove = () => {
    updateState({
      file: {
        selected: null,
        uploaded: false,
        scanId: null,
        uploadProgress: 0,
      },
      scan: {
        status: 'idle',
        extractedData: {},
        mappedData: {},
        normalizedData: {},
        completionPercentage: 0,
        confidence: 0,
        requiresAttention: [],
        errorMessage: undefined,
        fileName: undefined,
      }
    });
  };

  const canUpload = usarMismaCompania || companiaSeleccionada !== null;
  const nombreCompaniaFinal = usarMismaCompania 
    ? state.context.companiaInfo?.nombre 
    : companias.find(c => c.id === companiaSeleccionada)?.nombre;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Subir Documento de Renovación
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Sube la nueva póliza para procesarla y extraer los datos automáticamente
        </p>
      </div>

      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Info className="h-5 w-5" />
            Contexto de Renovación
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </h3>
              <ClienteContextDisplay clienteInfo={state.context.clienteInfo} />
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Póliza a Renovar
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="font-medium">Póliza {state.context.polizaOriginal?.numero || 'No especificado'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Vence: {formatDate(state.context.polizaOriginal?.vencimiento)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Compañía: {state.context.companiaInfo?.nombre}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`
        border-2 transition-all
        ${canUpload 
          ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
          : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
        }
      `}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Compañía de Seguros para la Renovación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="usar-misma-compania" className="text-base font-medium">
                Renovar con la misma compañía
              </Label>
              <p className="text-sm text-gray-500">
                {state.context.companiaInfo?.nombre 
                  ? `Mantener ${state.context.companiaInfo.nombre}`
                  : 'Usar la misma compañía de la póliza anterior'
                }
              </p>
            </div>
            <Switch
              id="usar-misma-compania"
              checked={usarMismaCompania}
              onCheckedChange={handleToggleUsarMisma}
            />
          </div>

          {!usarMismaCompania && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Seleccionar Nueva Compañía
                {companiaSeleccionada && <CheckCircle className="h-4 w-4 text-green-500" />}
              </Label>
              <select
                className="w-full p-3 border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={companiaSeleccionada || ''}
                onChange={(e) => handleCompaniaChange(Number(e.target.value))}
                disabled={loadingCompanias}
              >
                <option value="">Seleccionar compañía...</option>
                {companias.map(compania => (
                  <option key={compania.id} value={compania.id}>
                    {compania.nombre}
                  </option>
                ))}
              </select>
              
              {!companiaSeleccionada && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Debes seleccionar una compañía para continuar
                </p>
              )}
            </div>
          )}

          {canUpload && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Compañía seleccionada: <strong>{nombreCompaniaFinal}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {canUpload ? (
        <DocumentUploader 
          onUpload={uploadDocumentForRenovacion}
          onFileRemove={handleFileRemove}
          isUploading={state.isLoading}
          uploadStatus={state.scan.status}
          fileName={state.scan.fileName}
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={10}
          errorMessage={state.scan.errorMessage}
          progress={state.file?.uploadProgress || 0}
          scanResult={{
            completionPercentage: state.scan.completionPercentage || state.scan.confidence || 0,
            extractedData: state.scan.extractedData,
            requiresAttention: state.scan.requiresAttention || [],
            errorMessage: state.scan.errorMessage
          }}
          acceptedFile={state.file?.selected}
        />
      ) : (
        <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecciona una compañía de seguros antes de subir el documento
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}