// step-3-confirmation/confirmation-form.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  FileText, 
  User, 
  Building, 
  Car,
  AlertTriangle,
  Send,
  Calendar,
  DollarSign
} from 'lucide-react';
import { CreatePolizaHandler } from '@/components/poliza/create-poliza-handler';

interface ConfirmationFormProps {
  hookInstance: any; // Tu hook useNuevaPoliza
}

export function ConfirmationForm({ hookInstance }: ConfirmationFormProps) {
  const { state, updateStep3Status } = hookInstance;

  // Si ya se completó exitosamente, mostrar estado de éxito
  if (state.step3.status === 'completed') {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="h-6 w-6" />
            Póliza Creada Exitosamente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Póliza #{state.step3.polizaNumber}</strong> creada en Velneo exitosamente.
                <br />
                ID de Velneo: {state.step3.velneoPolizaId}
              </AlertDescription>
            </Alert>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>✅ Documento procesado correctamente</p>
              <p>✅ Datos validados y mapeados</p>
              <p>✅ Póliza enviada a Velneo</p>
              <p>✅ Facturación registrada</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePolizaSuccess = (result: any) => {
    // Actualizar el estado del hook con la información de éxito
    updateStep3Status('completed', result.message, {
      velneoPolizaId: result.velneoPolizaId,
      polizaNumber: result.polizaNumber,
      createdAt: result.createdAt
    });
  };

  const handlePolizaError = (error: string) => {
    // Actualizar el estado del hook con el error
    updateStep3Status('error', error);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-UY');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'No disponible';
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de datos para confirmación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumen de la Póliza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Información del Cliente */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Nombre:</span>
                  <p className="font-medium">{state.context.clienteInfo?.nombre || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Documento:</span>
                  <p className="font-medium">{state.context.clienteInfo?.documento || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {/* Información de la Compañía */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Compañía y Sección
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Compañía:</span>
                  <p className="font-medium">{state.context.companiaInfo?.nombre || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Sección:</span>
                  <p className="font-medium">{state.context.seccionInfo?.nombre || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {/* Información del Vehículo */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehículo
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Marca/Modelo:</span>
                  <p className="font-medium">
                    {state.scan.extractedData?.vehiculoMarca} {state.scan.extractedData?.vehiculoModelo}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Año:</span>
                  <p className="font-medium">{state.scan.extractedData?.vehiculoAno || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Patente:</span>
                  <p className="font-medium">{state.scan.extractedData?.vehiculoPatente || 'No especificado'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Información de la Póliza */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div>
                <span className="text-gray-500 text-sm">Número de Póliza:</span>
                <p className="font-bold text-lg">{state.scan.extractedData?.polizaNumber || 'No extraído'}</p>
              </div>

              <div>
                <span className="text-gray-500 text-sm">Vigencia Desde:</span>
                <p className="font-medium">{formatDate(state.scan.extractedData?.vigenciaDesde)}</p>
              </div>

              <div>
                <span className="text-gray-500 text-sm">Vigencia Hasta:</span>
                <p className="font-medium">{formatDate(state.scan.extractedData?.vigenciaHasta)}</p>
              </div>

              <div>
                <span className="text-gray-500 text-sm">Prima:</span>
                <p className="font-medium">{formatCurrency(parseFloat(state.scan.extractedData?.prima || '0'))}</p>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado del documento escaneado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Estado del Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Documento procesado
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <FileText className="h-3 w-3 mr-1" />
              {state.file.selected?.name || 'Archivo procesado'}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
              Scan ID: {state.file.scanId}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Botón de creación con validación de duplicados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Crear Póliza en Velneo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se verificará que no exista una póliza duplicada antes de crear la nueva póliza en Velneo.
              </AlertDescription>
            </Alert>

            {/* Usar el CreatePolizaHandler con validación de duplicados */}
            <CreatePolizaHandler
            hookInstance={hookInstance} 
              scanId={state.file.scanId}
              onSuccess={handlePolizaSuccess}
              onError={handlePolizaError}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mostrar error si existe */}
      {state.step3.status === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error creando póliza:</strong> {state.step3.errorMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}