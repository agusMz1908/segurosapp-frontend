import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  FileText, 
  Calendar, 
  User, 
  DollarSign,
  RefreshCcw,
  Edit,
  X,
  Search,
  Home,
  RotateCcw
} from "lucide-react";

interface PolizaDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationError: any;
  onSelectAction: (action: string) => void;
  onCancel: () => void;
}

export function PolizaDuplicateDialog({
  open,
  onOpenChange,
  validationError,
  onSelectAction,
  onCancel
}: PolizaDuplicateDialogProps) {
  
  if (!validationError) return null;

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'V': return 'default';
      case 'C': return 'secondary'; 
      case 'A': return 'destructive';
      case 'S': return 'outline';
      case 'E': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'V': return 'text-green-600';
      case 'C': return 'text-gray-600';
      case 'A': return 'text-red-600'; 
      case 'S': return 'text-yellow-600';
      case 'E': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-UY');
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return 'No disponible';
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  // Función para obtener el icono según el tipo de acción
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'restart': return <Home className="h-4 w-4 mr-3 flex-shrink-0" />;
      case 'modify': return <Edit className="h-4 w-4 mr-3 flex-shrink-0" />;
      case 'renew': return <RefreshCcw className="h-4 w-4 mr-3 flex-shrink-0" />;
      case 'verify': return <Search className="h-4 w-4 mr-3 flex-shrink-0" />;
      case 'cancel': return <X className="h-4 w-4 mr-3 flex-shrink-0" />;
      default: return <AlertTriangle className="h-4 w-4 mr-3 flex-shrink-0" />;
    }
  };

  // Determinar si usar acciones personalizadas o las predeterminadas
  const useCustomActions = validationError.actions && Array.isArray(validationError.actions);

  const renderCustomActions = () => {
    if (!useCustomActions) return null;

    return (
      <div>
        <h4 className="font-semibold mb-3">¿Qué desea hacer?</h4>
        <div className="grid gap-2">
          {validationError.actions.map((action: any, index: number) => (
            <Button 
              key={index}
              variant="outline" 
              onClick={() => onSelectAction(action.type)}
              className="justify-start h-auto p-4"
            >
              {getActionIcon(action.type)}
              <div className="text-left">
                <div className="font-medium">{action.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
  };

  const renderDefaultActions = () => {
    if (useCustomActions) return null;

    return (
      <div>
        <h4 className="font-semibold mb-3">¿Qué desea hacer?</h4>
        <div className="grid gap-2">
          
          {/* Mostrar opciones específicas según el estado */}
          {validationError.existingPolizaStatus === 'V' && (
            <Button 
              variant="outline" 
              onClick={() => onSelectAction('modify')}
              className="justify-start h-auto p-4"
            >
              <Edit className="h-4 w-4 mr-3 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Modificar Póliza Vigente</div>
                <div className="text-xs text-gray-500 mt-1">
                  Crear un endoso o modificación sobre la póliza vigente
                </div>
              </div>
            </Button>
          )}

          {(validationError.existingPolizaStatus === 'C' || 
            validationError.existingPolizaStatus === 'A' ||
            !validationError.existingPolizaStatus) && (
            <Button 
              variant="outline" 
              onClick={() => onSelectAction('renew')}
              className="justify-start h-auto p-4"
            >
              <RefreshCcw className="h-4 w-4 mr-3 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Renovar Póliza</div>
                <div className="text-xs text-gray-500 mt-1">
                  Crear una renovación de la póliza existente
                </div>
              </div>
            </Button>
          )}

          <Button 
            variant="outline" 
            onClick={() => onSelectAction('verify')}
            className="justify-start h-auto p-4"
          >
            <Search className="h-4 w-4 mr-3 flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium">Verificar Número de Póliza</div>
              <div className="text-xs text-gray-500 mt-1">
                Revisar si el número escaneado es correcto
              </div>
            </div>
          </Button>
          
        </div>

        {/* Lista de acciones sugeridas del backend */}
        {validationError.suggestedActions && validationError.suggestedActions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Recomendaciones del sistema:
            </h5>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              {validationError.suggestedActions.map((action: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Póliza Duplicada Detectada
          </DialogTitle>
          <DialogDescription>
            Ya existe una póliza con el mismo número en esta compañía.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del conflicto */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Póliza #{validationError.numeroPoliza}</strong> ya existe en{' '}
              <strong>{validationError.companiaName}</strong>
              {validationError.existingPolizaStatus && (
                <span className="ml-2">
                  <Badge variant={getStatusBadgeVariant(validationError.existingPolizaStatus)}>
                    <span className={getStatusColor(validationError.existingPolizaStatus)}>
                      {validationError.existingPolizaStatus === null ? 'Sin estado' : validationError.existingPolizaStatus}
                    </span>
                  </Badge>
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Información básica de la póliza existente */}
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Póliza Existente (ID: {validationError.existingPolizaId})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Número:</span>
                  <p className="font-medium">{validationError.numeroPoliza}</p>
                </div>
                <div>
                  <span className="text-gray-500">Compañía:</span>
                  <p className="font-medium">{validationError.companiaName}</p>
                </div>
              </div>
              
              {/* Información detallada si está disponible */}
              {validationError.existingPolizaInfo && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {validationError.existingPolizaInfo.clienteNombre && (
                      <div>
                        <span className="text-gray-500">Cliente:</span>
                        <p className="font-medium">{validationError.existingPolizaInfo.clienteNombre}</p>
                      </div>
                    )}
                    {validationError.existingPolizaInfo.montoTotal && (
                      <div>
                        <span className="text-gray-500">Monto:</span>
                        <p className="font-medium">{formatAmount(validationError.existingPolizaInfo.montoTotal)}</p>
                      </div>
                    )}
                    {validationError.existingPolizaInfo.fechaDesde && (
                      <div>
                        <span className="text-gray-500">Vigencia desde:</span>
                        <p className="font-medium">{formatDate(validationError.existingPolizaInfo.fechaDesde)}</p>
                      </div>
                    )}
                    {validationError.existingPolizaInfo.fechaHasta && (
                      <div>
                        <span className="text-gray-500">Vigencia hasta:</span>
                        <p className="font-medium">{formatDate(validationError.existingPolizaInfo.fechaHasta)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones - usar personalizadas o predeterminadas */}
          {renderCustomActions()}
          {renderDefaultActions()}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Solo mostrar botón Cancelar si no hay acciones personalizadas o si no incluyen cancel */}
          {(!useCustomActions || !validationError.actions.some((action: any) => action.type === 'cancel')) && (
            <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}