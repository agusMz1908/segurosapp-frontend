// app/renovaciones/step-1-search/cliente-polizas-search-form.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  User, 
  Car, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { ClienteSearchCombobox } from '@/components/clientes/ClienteSearchCombobox';
import type { Cliente } from '@/types/master-data';

interface ClientePolizasSearchFormProps {
  hookInstance: any;
}

export function ClientePolizasSearchForm({ hookInstance }: ClientePolizasSearchFormProps) {
  const { state, loadPolizasByCliente, selectPolizaToRenew, isPolizaRenovable, getDiasParaVencimiento } = hookInstance;
  
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleClienteChange = async (clienteId: number | undefined, cliente?: Cliente) => {
    setSelectedCliente(cliente);
    
    if (clienteId && cliente) {
      try {
        setIsLoading(true);
        await loadPolizasByCliente(clienteId);
      } catch (error) {
        console.error('Error cargando pólizas:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePolizaSelect = (poliza: any) => {
    selectPolizaToRenew(poliza);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getVencimientoStatus = (poliza: any) => {
    const dias = getDiasParaVencimiento(poliza);
    const renovable = isPolizaRenovable(poliza);
    
    if (dias > 60) {
      return { color: 'gray', text: `Vence en ${dias} días`, renovable: false };
    } else if (dias > 30) {
      return { color: 'blue', text: `Vence en ${dias} días`, renovable: true };
    } else if (dias > 0) {
      return { color: 'yellow', text: `Vence en ${dias} días`, renovable: true };
    } else if (dias > -30) {
      return { color: 'red', text: `Vencida hace ${Math.abs(dias)} días`, renovable: true };
    } else {
      return { color: 'gray', text: `Vencida hace ${Math.abs(dias)} días`, renovable: false };
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Buscar Póliza a Renovar
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Selecciona un cliente para ver sus pólizas renovables de automotor
        </p>
      </div>

      {/* Búsqueda de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Seleccionar Cliente
          </CardTitle>
          <CardDescription>
            Busca el cliente por nombre, documento o email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ClienteSearchCombobox
              value={state.cliente.selectedId}
              onValueChange={handleClienteChange}
              placeholder="Buscar cliente por nombre, documento o email..."
              className="w-full"
            />

            {selectedCliente && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Cliente Seleccionado</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700 dark:text-blue-300">Nombre:</span>
                    <p className="text-blue-600 dark:text-blue-200">{selectedCliente.nombre}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700 dark:text-blue-300">Documento:</span>
                    <p className="text-blue-600 dark:text-blue-200">{selectedCliente.documento}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listado de Pólizas */}
      {state.cliente.selectedId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Pólizas de Automotor Renovables
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Solo se muestran pólizas de automotor que pueden ser renovadas (dentro del rango de 60 días antes a 30 días después del vencimiento)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando pólizas...</span>
              </div>
            ) : state.cliente.polizas.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No se encontraron pólizas de automotor renovables para este cliente.
                  Solo se pueden renovar pólizas en el rango de 60 días antes a 30 días después del vencimiento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {state.cliente.polizas.map((poliza: any) => {
                  const vencimientoStatus = getVencimientoStatus(poliza);
                  const renovable = vencimientoStatus.renovable;
                  
                  return (
                    <div
                      key={poliza.id}
                      className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                        renovable 
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/10 hover:border-green-300' 
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-semibold text-lg">
                              Póliza {poliza.conpol}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {poliza.compania_nombre || `Compañía ${poliza.comcod}`}
                            </p>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={vencimientoStatus.color === 'green' ? 'default' : 
                                   vencimientoStatus.color === 'yellow' ? 'destructive' : 
                                   vencimientoStatus.color === 'red' ? 'destructive' : 'secondary'}
                        >
                          {vencimientoStatus.text}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">Vigencia:</span>
                          <p className="font-medium">
                            {formatDate(poliza.confchdes)} - {formatDate(poliza.confchhas)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Premio:</span>
                          <p className="font-medium">{formatCurrency(poliza.conpremio || 0)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Estado:</span>
                          <p className="font-medium">{poliza.activo ? 'Activa' : 'Inactiva'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Vehículo:</span>
                          <p className="font-medium">
                            {poliza.vehiculo_marca && poliza.vehiculo_modelo 
                              ? `${poliza.vehiculo_marca} ${poliza.vehiculo_modelo}` 
                              : 'No especificado'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {renovable ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${renovable ? 'text-green-700' : 'text-red-700'}`}>
                            {renovable ? 'Puede ser renovada' : 'No renovable en este momento'}
                          </span>
                        </div>

                        <Button
                          onClick={() => handlePolizaSelect(poliza)}
                          disabled={!renovable}
                          variant={renovable ? "default" : "secondary"}
                          size="sm"
                        >
                          {renovable ? 'Seleccionar para Renovar' : 'No Disponible'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información sobre criterios de renovación */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Criterios de renovación:</strong> Solo se pueden renovar pólizas de automotor que estén 
          dentro del rango de 60 días antes del vencimiento hasta 30 días después del vencimiento.
        </AlertDescription>
      </Alert>
    </div>
  );
}