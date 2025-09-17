// src/components/poliza/create-poliza-handler.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PolizaDuplicateDialog } from '@/components/ui/poliza-duplicate-dialog';
import { Loader2 } from 'lucide-react';

interface CreatePolizaHandlerProps {
  hookInstance?: any; // La instancia del hook useNuevaPoliza
  scanId?: number;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CreatePolizaHandler({ 
  hookInstance,
  scanId, 
  onSuccess, 
  onError,
  className,
  disabled
}: CreatePolizaHandlerProps) {
  
  // Estado local para el dialog de duplicados
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateError, setDuplicateError] = useState<any>(null);
  
  // Usar la instancia del hook que se pasa como prop, o crear una nueva si no se proporciona
  const { state, updateState } = hookInstance || { state: null, updateState: null };
  
  // Validar que tenemos acceso al hook
  if (!state || !updateState) {
    console.error('CreatePolizaHandler: No se proporcionó hookInstance válido');
    return (
      <Button disabled className={className || "w-full"}>
        Error de configuración
      </Button>
    );
  }

  // Implementar la función createPoliza manualmente ya que no está en el hook actual
  const createPoliza = async (overrides?: any) => {
    if (!state.context.clienteId || !state.context.companiaId || !state.context.seccionId) {
      onError?.('Contexto incompleto. Selecciona cliente, compañía y sección.');
      return { success: false };
    }

    const currentScanId = state.file.scanId || scanId;
    if (!currentScanId) {
      onError?.('No hay documento escaneado para procesar');
      return { success: false };
    }

    // Actualizar estado a "creating"
    updateState({
      isLoading: true,
      step3: {
        ...state.step3,
        status: 'creating'
      }
    });

    try {
      const createRequest = {
        scanId: currentScanId,
        clienteId: state.context.clienteId,
        companiaId: state.context.companiaId,
        seccionId: state.context.seccionId,
        
        fuelCodeOverride: state.masterData.combustibleId || "",
        tariffIdOverride: parseInt(state.masterData.tarifaId) || 0,
        departmentIdOverride: parseInt(state.masterData.departamentoId) || 0,
        destinationIdOverride: parseInt(state.masterData.destinoId) || 0,
        categoryIdOverride: parseInt(state.masterData.categoriaId) || 0,
        qualityIdOverride: parseInt(state.masterData.calidadId) || 0,
        brokerIdOverride: parseInt(state.masterData.corredorId) || 0,
        
        policyNumber: state.scan.extractedData?.polizaNumber || "",
        startDate: state.scan.extractedData?.vigenciaDesde || "",
        endDate: state.scan.extractedData?.vigenciaHasta || "",
        premium: parseFloat(state.scan.extractedData?.prima || "0"),
        
        vehicleBrand: state.scan.extractedData?.vehiculoMarca || "",
        vehicleModel: state.scan.extractedData?.vehiculoModelo || "",
        vehicleYear: parseInt(state.scan.extractedData?.vehiculoAno || "0"),
        motorNumber: state.scan.extractedData?.vehiculoMotor || "",
        chassisNumber: state.scan.extractedData?.vehiculoChasis || "",
        
        paymentMethod: state.masterData.medioPagoId || "",
        installmentCount: state.masterData.cantidadCuotas || 1,
        
        notes: state.masterData.observaciones || "",
        correctedFields: [],
        
        ...overrides
      };

      // Importar las utilidades de auth
      const { getAuthToken, getAuthHeaders, handle401Error } = await import('@/utils/auth-utils');
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      
      const response = await fetch(`${API_URL}/api/Document/${currentScanId}/create-in-velneo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(createRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Manejar error 401
        if (response.status === 401) {
          handle401Error();
          return { success: false };
        }
        
        // Verificar si es error de duplicado
        if (response.status === 409 || (errorData.isDuplicate || errorData.validationError?.isDuplicate)) {
          const duplicateInfo = errorData.validationError || errorData;
          
          setDuplicateError({
            isDuplicate: true,
            numeroPoliza: duplicateInfo.numeroPoliza || state.scan.extractedData?.polizaNumber || "N/A",
            existingPolizaId: duplicateInfo.existingPolizaId || 0,
            existingPolizaData: duplicateInfo.existingPolizaData,
            message: duplicateInfo.message || "Ya existe una póliza con este número",
            actions: [
              {
                type: 'restart',
                label: 'Volver al Inicio',
                description: 'Reiniciar el proceso de nueva póliza desde el paso 1'
              },
              {
                type: 'verify',
                label: 'Verificar Documento',
                description: 'Revisar que el número de póliza en el documento sea correcto'
              },
              {
                type: 'cancel',
                label: 'Ir al Dashboard',
                description: 'Cancelar operación y volver al dashboard principal'
              }
            ]
          });
          
          setShowDuplicateDialog(true);
          
          updateState({
            isLoading: false,
            step3: {
              ...state.step3,
              status: 'error',
              errorMessage: duplicateInfo.message || "Póliza duplicada detectada"
            }
          });

          return { success: false, isDuplicate: true };
        }
        
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        updateState({
          step3: {
            status: 'completed',
            velneoPolizaId: result.velneoPolizaId,
            polizaNumber: result.polizaNumber,
            createdAt: result.createdAt,
            velneoUrl: result.velneoUrl,
            warnings: result.warnings || [],
            validation: result.validation || { isValid: true, errors: [], warnings: [] }
          },
          isLoading: false,
        });

        onSuccess?.(result);
        return { success: true, result };
      } else {
        throw new Error(result.message || 'Error creando póliza en Velneo');
      }

    } catch (error: any) {
      console.error('Error creating poliza:', error);
      
      updateState({
        step3: {
          ...state.step3,
          status: 'error',
          errorMessage: error.message || 'Error creando póliza'
        },
        isLoading: false,
      });

      onError?.(error.message || 'Error desconocido');
      return { success: false };
    }
  };

  const handleCreatePoliza = async (overrides?: any) => {
    const result = await createPoliza(overrides);
    // El manejo de éxito/error ya se hace dentro de createPoliza
  };

  const handleDuplicateAction = async (action: string) => {
    setShowDuplicateDialog(false);
    
    switch (action) {
      case 'restart':
        // Reiniciar el proceso completo y volver al paso 1
        window.location.href = `/nueva-poliza`;
        break;
        
      case 'verify':
        onError?.(`Revise que el número ${duplicateError.numeroPoliza} sea correcto en el documento escaneado. Si el número es incorrecto, vuelva al paso anterior para cargar el documento correcto.`);
        break;
        
      case 'cancel':
      default:
        // Redirigir al dashboard principal
        window.location.href = '/dashboard';
        break;
    }
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateDialog(false);
    setDuplicateError(null);
    // Redirigir al dashboard principal
    window.location.href = '/dashboard';
  };

  const isCreating = state.step3.status === 'creating' || state.isLoading;
  const hasValidScanId = state.file.scanId || scanId;

  return (
    <>
      <Button 
        onClick={() => handleCreatePoliza()}
        disabled={disabled || isCreating || !hasValidScanId}
        className={className || "w-full"}
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando Póliza...
          </>
        ) : (
          'Crear Póliza en Velneo'
        )}
      </Button>

      {/* Dialog para manejar duplicados */}
      <PolizaDuplicateDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        validationError={duplicateError}
        onSelectAction={handleDuplicateAction}
        onCancel={handleDuplicateCancel}
      />
    </>
  );
}