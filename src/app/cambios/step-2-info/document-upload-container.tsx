import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  FileText, 
  CheckCircle,
  Info,
  Building2,
  User,
  Calendar,
  Edit
} from 'lucide-react';
import { DocumentUploader } from '../../renovaciones/step-3-validation/document-uploader';

interface DocumentUploadContainerProps {
  hookInstance: any;
}

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
  const { state, uploadDocumentForChange, updateState } = hookInstance;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificado';
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Subir Documento de Cambio
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Sube el documento con los cambios para procesarlo y extraer los datos automáticamente
        </p>
      </div>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Info className="h-5 w-5" />
            Contexto del Cambio
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
                Póliza a Modificar
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="font-medium">Póliza {state.context.polizaOriginal?.numero || 'No especificado'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Vence: {formatDate(state.context.polizaOriginal?.vencimiento)}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                    <Edit className="h-3 w-3" />
                    Póliza Vigente
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Compañía de Seguros
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="font-medium text-lg">
                  {state.context.companiaInfo?.nombre || 'Se detectará automáticamente'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentUploader 
        onUpload={uploadDocumentForChange}
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
    </div>
  );
}