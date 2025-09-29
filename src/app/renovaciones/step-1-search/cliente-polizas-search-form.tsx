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
  FileText,
  Loader2
} from 'lucide-react';
import { ClienteSearchCombobox } from '@/components/clientes/ClienteSearchCombobox';
import type { Cliente } from '@/types/master-data';

interface ClientePolizasSearchFormProps {
  hookInstance: any;
}

export function ClientePolizasSearchForm({ hookInstance }: ClientePolizasSearchFormProps) {
  const { state, loadPolizasByCliente, selectPolizaToRenew, isPolizaRenovable, getDiasParaVencimiento } = hookInstance;
  
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();

  const handleClienteChange = async (clienteId: number | undefined, cliente?: Cliente) => {
    setSelectedCliente(cliente);
    
    if (clienteId && cliente) {
      if (hookInstance.setClienteData) {
        hookInstance.setClienteData(cliente);
      }
      
      try {
        await hookInstance.loadPolizasByCliente(clienteId);
      } catch (error) {
        console.error('Error cargando pólizas:', error);
      }
    }
  };

const handlePolizaSelect = (poliza: any) => {
  console.log('=== HANDLE POLIZA SELECT ===');
  console.log('Póliza recibida:', JSON.stringify(poliza, null, 2));
  console.log('State completo cliente.polizas:', hookInstance.state.cliente.polizas);
  selectPolizaToRenew(poliza);

  const companiaId = poliza.comcod;
  const companiaNombre = poliza.comnom;

  hookInstance.updateState((prevState: any) => ({
    ...prevState,
    context: {
      ...prevState.context,
      companiaId: companiaId,
      companiaInfo: {
        id: companiaId,
        nombre: companiaNombre,
        codigo: companiaId.toString()
      },
      polizaOriginal: {
        id: poliza.id,
        numero: poliza.conpol,
        vencimiento: poliza.confchhas
      }
    }
  }));
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

  const isPolizaSelected = (polizaId: number) => {
    return state.cliente.selectedPoliza?.id === polizaId;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Buscar Póliza a Renovar
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Selecciona un cliente para ver sus pólizas renovables de automotor
        </p>
      </div>

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
          </div>
        </CardContent>
      </Card>

      {state.cliente.selectedId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Pólizas de Automotor Renovables
              {state.isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            </CardTitle>
            <CardDescription>
              Solo se muestran pólizas de automotor que pueden ser renovadas (dentro del rango de 60 días antes a 30 días después del vencimiento)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">Cargando pólizas renovables...</span>
                </div>
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
              <div className="space-y-3">
                {state.cliente.polizas.map((poliza: any) => {
                  const vencimientoStatus = getVencimientoStatus(poliza);
                  const renovable = vencimientoStatus.renovable;
                  const isSelected = isPolizaSelected(poliza.id);
                  
                  return (
                    <div
                      key={poliza.id}
                      className={`
                        border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500'
                          : renovable 
                            ? 'border-green-200 bg-green-50 dark:bg-green-900/10 hover:border-green-300' 
                            : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }
                      `}
                      onClick={() => renovable && handlePolizaSelect(poliza)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-3 h-3 rounded-full transition-colors
                            ${isSelected 
                              ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
                              : 'bg-gray-300 dark:bg-gray-600'
                            }
                          `} />
                          
                          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                              Póliza {poliza.conpol}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {poliza.comnom || `Compañía ${poliza.comcod}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={vencimientoStatus.color === 'green' ? 'default' : 
                                     vencimientoStatus.color === 'yellow' ? 'secondary' : 
                                     vencimientoStatus.color === 'red' ? 'destructive' : 'outline'}
                            className={vencimientoStatus.color === 'blue' ? 'bg-blue-600 text-white dark:bg-blue-500' : ''}
                          >
                            {vencimientoStatus.text}
                          </Badge>
                          
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4 text-sm">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">Vigencia hasta: </span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(poliza.confchhas)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          {renovable ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span className={`text-sm ${renovable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {renovable ? 'Puede ser renovada' : 'No renovable en este momento'}
                          </span>
                        </div>

                        {renovable && !isSelected && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePolizaSelect(poliza);
                            }}
                            variant="outline"
                            size="sm"
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                          >
                            Seleccionar para Renovar
                          </Button>
                        )}
                        
                        {isSelected && (
                          <Badge variant="default" className="bg-blue-500">
                            Póliza Seleccionada
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}