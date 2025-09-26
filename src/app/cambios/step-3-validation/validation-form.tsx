import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Settings,
  MessageSquare,
  User,
  Building2,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import { ExtractedDataForm } from '../step-3-validation/extracted-data-form';
import { MasterDataForm } from '../step-3-validation/master-data-form';
import { PDFViewer } from '../../../components/pdf/PDFViewer';
import { usePDFViewer } from '../../../hooks/usePDFViewer';

interface ValidationFormProps {
  hookInstance: any;
}

export function ValidationForm({ hookInstance }: ValidationFormProps) {
  const { state, updateState, updateExtractedData, updateMasterData } = hookInstance;
  const { isViewerOpen, openViewer, closeViewer } = usePDFViewer();

  // Datos para mostrar
  const displayData = state.scan.normalizedData && Object.keys(state.scan.normalizedData).length > 0 
    ? state.scan.normalizedData 
    : state.scan.extractedData || {};

  const completionPercentage = state.scan.confidence || state.scan.completionPercentage || 0;
  const requiresAttention = state.scan.requiresAttention || [];
  const scanStatus = state.scan.status;

  const handleObservacionesChange = (value: string) => {
    updateState({
      masterData: {
        ...state.masterData,
        observaciones: value
      }
    });
  };

  // Si hay datos extraídos, mostrar el formulario completo de validación
  if (scanStatus === 'completed' && displayData && Object.keys(displayData).length > 0) {
    return (
      <div className="w-full">
        {/* Layout principal usando flexbox horizontal igual que Renovaciones */}
        <div className={`flex gap-6 ${isViewerOpen ? '' : 'justify-center'}`}>
          
          {/* Columna del formulario */}
          <div className={`space-y-6 transition-all duration-300 ${
            isViewerOpen ? 'w-1/2 flex-shrink-0' : 'w-full max-w-4xl'
          }`}>
            
            {/* Header del paso - Solo cuando PDF está cerrado */}
            {!isViewerOpen && (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Validar Información del Cambio
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Revisa los datos extraídos automáticamente y completa la información con datos maestros
                </p>
              </div>
            )}

            {/* 🔥 CAMBIO: Usar colores azules como Nueva Póliza en lugar de violeta */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Cliente</span>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {state.context?.clienteInfo?.nombre || "No seleccionado"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Compañía</span>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {state.context?.companiaInfo?.nombre || "No seleccionada"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Edit className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Modificando</span>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {state.context?.polizaOriginal?.numero || "Póliza"}
                  </p>
                </div>
              </div>
            </div>

            <Card className="shadow-lg">
              <CardContent className={`space-y-6 ${isViewerOpen ? 'p-4' : 'p-8'}`}>
                
                {/* 1. Datos del Documento - 🔥 CAMBIO: Usar azul en lugar de violeta */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg ${isViewerOpen ? 'p-1' : 'p-2'}`}>
                        <FileText className={`text-blue-600 dark:text-blue-400 ${isViewerOpen ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${isViewerOpen ? 'text-base' : 'text-lg'}`}>
                          Datos de la Póliza Modificada
                        </h3>
                        <p className={`text-gray-600 dark:text-gray-400 ${isViewerOpen ? 'text-xs' : 'text-sm'}`}>
                          Extraídos del PDF • {completionPercentage}% confianza
                        </p>
                      </div>
                    </div>
                    
                    {/* Botón Ver PDF - 🔥 CAMBIO: Usar azul en lugar de violeta */}
                    {(state.file?.selected || state.scan?.file) ? (
                      <Button
                        variant={isViewerOpen ? "secondary" : "default"}
                        size="sm"
                        onClick={isViewerOpen ? closeViewer : openViewer}
                        className={`flex items-center gap-2 shrink-0 ${
                          isViewerOpen 
                            ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        {isViewerOpen ? 'Ocultar' : 'Ver PDF'}
                      </Button>
                    ) : (
                      <div className="text-xs text-red-500 p-2 bg-red-50 rounded">
                        No hay archivo PDF disponible
                      </div>
                    )}
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className={isViewerOpen ? 'p-3' : 'p-6'}>
                      <ExtractedDataForm hookInstance={hookInstance} />
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* 2. Datos Maestros - 🔥 CAMBIO: Usar verde en lugar de indigo */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 bg-green-100 dark:bg-green-800 rounded-lg ${isViewerOpen ? 'p-1' : 'p-2'}`}>
                      <Settings className={`text-green-600 dark:text-green-400 ${isViewerOpen ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${isViewerOpen ? 'text-base' : 'text-lg'}`}>
                        Datos Maestros para Velneo
                      </h3>
                      <p className={`text-gray-600 dark:text-gray-400 ${isViewerOpen ? 'text-xs' : 'text-sm'}`}>
                        Configuración específica del cambio
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <MasterDataForm hookInstance={hookInstance} />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* 3. Observaciones */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 bg-amber-100 dark:bg-amber-800 rounded-lg ${isViewerOpen ? 'p-1' : 'p-2'}`}>
                      <MessageSquare className={`text-amber-600 dark:text-amber-400 ${isViewerOpen ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${isViewerOpen ? 'text-base' : 'text-lg'}`}>
                        Observaciones del Cambio
                      </h3>
                      <p className={`text-gray-600 dark:text-gray-400 ${isViewerOpen ? 'text-xs' : 'text-sm'}`}>
                        Notas específicas sobre este cambio en la póliza
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Escribe aquí observaciones específicas sobre este cambio (motivo del cambio, modificaciones realizadas, etc.)..."
                      value={state.masterData?.observaciones || ''}
                      onChange={(e) => handleObservacionesChange(e.target.value)}
                      className={`resize-y ${isViewerOpen ? 'min-h-[80px]' : 'min-h-[100px]'}`}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>Se incluirán automáticamente en las observaciones del cambio</span>
                      <span>{(state.masterData?.observaciones || '').length}/500</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Columna del visor PDF */}
          {isViewerOpen && (
            <div className="w-1/2 flex-1 min-h-0">
              <PDFViewer
                file={state.file?.selected || state.scan?.file || null}
                isOpen={isViewerOpen}
                onClose={closeViewer}
              />
              
              {/* Debug info para ayudar con el troubleshooting */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Debug PDF:</p>
                  <p>state.file?.selected: {state.file?.selected ? 'Sí' : 'No'}</p>
                  <p>state.scan?.file: {state.scan?.file ? 'Sí' : 'No'}</p>
                  <p>fileName: {state.scan?.fileName || 'N/A'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Estado de carga o error
  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Validar Información del Cambio
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Esperando procesamiento del documento...
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">
              Procesando documento para cambio de póliza...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}