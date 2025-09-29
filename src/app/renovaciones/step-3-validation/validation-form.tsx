import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Settings,
  MessageSquare,
  User,
  Building2,
  Hash,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import { ExtractedDataForm } from './extracted-data-form';
import { MasterDataForm } from './master-data-form';
import { PDFViewer } from '../../../components/pdf/PDFViewer';
import { usePDFViewer } from '../../../hooks/usePDFViewer';

interface ValidationFormProps {
  hookInstance: any;
}

export function ValidationForm({ hookInstance }: ValidationFormProps) {
  const { state, updateState, updateExtractedData, updateMasterData } = hookInstance;
  const { isViewerOpen, openViewer, closeViewer } = usePDFViewer();

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

  if (scanStatus === 'completed' && displayData && Object.keys(displayData).length > 0) {
    return (
      <div className="w-full">
        <div className={`flex gap-6 ${isViewerOpen ? '' : 'justify-center'}`}>
          <div className={`space-y-6 transition-all duration-300 ${
            isViewerOpen ? 'w-1/2 flex-shrink-0' : 'w-full max-w-4xl'}`}>
            
            {!isViewerOpen && (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Validar Información de la Renovación
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Revisa los datos extraídos automáticamente y completa la información con datos maestros
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-green-600 dark:text-green-400" />
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Cliente</span>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {state.context?.clienteInfo?.nombre || "No seleccionado"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Compañía</span>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {state.context?.companiaInfo?.nombre || "No seleccionada"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 text-green-600 dark:text-green-400" />
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Renovando</span>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {state.context?.polizaOriginal?.numero || "Póliza anterior"}
                  </p>
                </div>
              </div>
            </div>

            <Card className="shadow-lg">
              <CardContent className={`space-y-6 ${isViewerOpen ? 'p-4' : 'p-8'}`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 bg-green-100 dark:bg-green-800 rounded-lg ${isViewerOpen ? 'p-1' : 'p-2'}`}>
                        <FileText className={`text-green-600 dark:text-green-400 ${isViewerOpen ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${isViewerOpen ? 'text-base' : 'text-lg'}`}>
                          Datos de la Nueva Póliza
                        </h3>
                        <p className={`text-gray-600 dark:text-gray-400 ${isViewerOpen ? 'text-xs' : 'text-sm'}`}>
                          Extraídos del PDF • {completionPercentage}% confianza
                        </p>
                      </div>
                    </div>
                    
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

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 bg-purple-100 dark:bg-purple-800 rounded-lg ${isViewerOpen ? 'p-1' : 'p-2'}`}>
                      <Settings className={`text-purple-600 dark:text-purple-400 ${isViewerOpen ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${isViewerOpen ? 'text-base' : 'text-lg'}`}>
                        Datos Maestros para Velneo
                      </h3>
                      <p className={`text-gray-600 dark:text-gray-400 ${isViewerOpen ? 'text-xs' : 'text-sm'}`}>
                        Configuración específica de la renovación
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <MasterDataForm hookInstance={hookInstance} />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 bg-amber-100 dark:bg-amber-800 rounded-lg ${isViewerOpen ? 'p-1' : 'p-2'}`}>
                      <MessageSquare className={`text-amber-600 dark:text-amber-400 ${isViewerOpen ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${isViewerOpen ? 'text-base' : 'text-lg'}`}>
                        Observaciones de Renovación
                      </h3>
                      <p className={`text-gray-600 dark:text-gray-400 ${isViewerOpen ? 'text-xs' : 'text-sm'}`}>
                        Notas específicas para esta renovación
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Escribe aquí observaciones específicas sobre esta renovación (se incluirán en el cronograma de cuotas)..."
                      value={state.masterData?.observaciones || ''}
                      onChange={(e) => handleObservacionesChange(e.target.value)}
                      className={`resize-y ${isViewerOpen ? 'min-h-[80px]' : 'min-h-[100px]'}`}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>Se incluirán automáticamente en las observaciones de renovación</span>
                      <span>{(state.masterData?.observaciones || '').length}/500</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {isViewerOpen && (
            <div className="w-1/2 flex-1 min-h-0">
              <PDFViewer
                file={state.file?.selected || state.scan?.file || null}
                isOpen={isViewerOpen}
                onClose={closeViewer}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Validar Información de la Renovación
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
              Procesando documento para renovación...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}