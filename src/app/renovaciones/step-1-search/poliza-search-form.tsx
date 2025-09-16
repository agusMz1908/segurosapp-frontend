import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  User, 
  Building2, 
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  X
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface PolizaSearchResult {
  id: number;
  conpol: string; // número de póliza
  comcod: number;
  seccod: number;
  clinro: number;
  condom: string;
  confchdes: string; // fecha desde
  confchhas: string; // fecha hasta
  conpremio: number; // premio
  conmoneda: number | null;
  conestado: string | null;
  activo: boolean;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  fecha_emision: string | null;
  ingresado: string;
  last_update: string;
  cliente_nombre: string | null;
  cliente_documento: string | null;
  compania_nombre: string | null;
  seccion_nombre: string | null;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_anio: number | null;
  vehiculo_matricula: string | null;
  vehiculo_chasis: string | null;
  vehiculo_motor: string | null;
  observaciones: string | null;
  tipo_cobertura: string | null;
  suma_asegurada: number | null;
  deducible: number | null;
}

interface PolizaSearchFormProps {
  hookInstance: any;
}

export function PolizaSearchForm({ hookInstance }: PolizaSearchFormProps) {
  const { selectPolizaAnterior } = hookInstance;
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PolizaSearchResult[]>([]);
  const [selectedPoliza, setSelectedPoliza] = useState<PolizaSearchResult | null>(null);
  const [numeroPoliza, setNumeroPoliza] = useState('');

  const handleSearch = useCallback(async () => {
    if (!numeroPoliza.trim()) {
      toast.error('Ingresa el número de póliza');
      return;
    }

    // Validar que sea un número
    if (!/^\d+$/.test(numeroPoliza.trim())) {
      toast.error('El número de póliza debe contener solo dígitos');
      return;
    }

    try {
      setIsSearching(true);
      setSearchResults([]);
      setSelectedPoliza(null);
      
      console.log('🔍 Iniciando búsqueda para póliza:', numeroPoliza.trim());
      
      const response = await apiClient.get<any>(`/api/MasterData/polizas/search?numeroPoliza=${numeroPoliza.trim()}&limit=10`);
      
      console.log('📡 Respuesta completa de la API:', response);
      
      // CORRECIÓN: El apiClient ya extrae los datos del wrapper
      // Por lo tanto, response es directamente el array de datos
      if (Array.isArray(response) && response.length > 0) {
        console.log('🎯 Estableciendo resultados:', response);
        setSearchResults(response);
        toast.success(`Se encontraron ${response.length} pólizas`);
      } else {
        console.log('❌ No hay datos en el array');
        setSearchResults([]);
        toast('No se encontraron pólizas con ese número', {
          icon: '🔍',
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error en búsqueda:', error);
      toast.error(error.message || 'Error realizando búsqueda');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [numeroPoliza]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectPoliza = (poliza: PolizaSearchResult) => {
    setSelectedPoliza(poliza);
  };

  const handleConfirmSelection = async () => {
    if (!selectedPoliza) return;
    
    try {
      // Pasar el número de póliza, no el ID interno
      await selectPolizaAnterior(selectedPoliza.conpol);
    } catch (error: any) {
      console.error('Error seleccionando póliza:', error);
      toast.error('Error seleccionando póliza');
    }
  };

  const clearSearch = () => {
    setNumeroPoliza('');
    setSearchResults([]);
    setSelectedPoliza(null);
  };

  const isPolizaRenovable = (poliza: PolizaSearchResult) => {
    if (!poliza.confchhas) return false;
    
    const fechaVencimiento = new Date(poliza.confchhas);
    const hoy = new Date();
    const diasHastaVencimiento = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasHastaVencimiento >= -30 && diasHastaVencimiento <= 60;
  };

  const getDiasVencimiento = (poliza: PolizaSearchResult) => {
    if (!poliza.confchhas) return 0;
    
    const fechaVencimiento = new Date(poliza.confchhas);
    const hoy = new Date();
    return Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-UY');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Buscar Póliza a Renovar
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Ingresa el número de la póliza que deseas renovar
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Criterios de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda simplificada */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numeroPoliza">Número de Póliza</Label>
              <Input
                id="numeroPoliza"
                placeholder="Ej: 1989630"
                value={numeroPoliza}
                onChange={(e) => setNumeroPoliza(e.target.value)}
                onKeyPress={handleKeyPress}
                className="font-mono text-lg"
                disabled={isSearching}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ingresa el número exacto de la póliza que deseas renovar
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between items-center">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !numeroPoliza.trim()}
                className="min-w-[120px]"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Póliza
                  </>
                )}
              </Button>

              <Button variant="ghost" onClick={clearSearch} disabled={isSearching}>
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resultados de Búsqueda
              </span>
              <Badge variant="outline">
                {searchResults.length} resultado(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {searchResults.map((poliza) => {
              const renovable = isPolizaRenovable(poliza);
              const diasVencimiento = getDiasVencimiento(poliza);
              const isSelected = selectedPoliza?.id === poliza.id;

              return (
                <div
                  key={poliza.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50'
                    }
                  `}
                  onClick={() => handleSelectPoliza(poliza)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">
                          Póliza: {poliza.conpol}
                        </h3>
                        {renovable ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Renovable
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            No renovable
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Seleccionada
                          </Badge>
                        )}
                        {poliza.activo && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20">
                            Activa
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              <strong>Cliente:</strong> {poliza.cliente_nombre || `ID: ${poliza.clinro}`}
                            </span>
                          </div>
                          {poliza.cliente_documento && (
                            <div className="text-xs pl-6">
                              Documento: {poliza.cliente_documento}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>
                              <strong>Compañía:</strong> {poliza.compania_nombre || `ID: ${poliza.comcod}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>
                              <strong>Sección:</strong> {poliza.seccion_nombre || `ID: ${poliza.seccod}`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          {poliza.confchdes && poliza.confchhas && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                <strong>Vigencia:</strong> {formatDate(poliza.confchdes)} - {formatDate(poliza.confchhas)}
                              </span>
                            </div>
                          )}
                          {poliza.confchhas && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                <strong>Vencimiento:</strong> 
                                {diasVencimiento >= 0 
                                  ? ` en ${diasVencimiento} días`
                                  : ` hace ${Math.abs(diasVencimiento)} días`
                                }
                              </span>
                            </div>
                          )}
                          <div>
                            <span><strong>Premio:</strong> {formatCurrency(poliza.conpremio)}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            <strong>Última actualización:</strong> {formatDate(poliza.last_update)}
                          </div>
                        </div>
                      </div>

                      {/* Información del vehículo si está disponible */}
                      {(poliza.vehiculo_marca || poliza.vehiculo_modelo || poliza.vehiculo_matricula) && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <strong>Vehículo:</strong> 
                          {poliza.vehiculo_marca && ` ${poliza.vehiculo_marca}`}
                          {poliza.vehiculo_modelo && ` ${poliza.vehiculo_modelo}`}
                          {poliza.vehiculo_anio && ` ${poliza.vehiculo_anio}`}
                          {poliza.vehiculo_matricula && ` - ${poliza.vehiculo_matricula}`}
                        </div>
                      )}

                      {/* Observaciones si existen */}
                      {poliza.observaciones && (
                        <div className="mt-2">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 font-medium">
                              Ver observaciones
                            </summary>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs max-h-32 overflow-y-auto">
                              {poliza.observaciones}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>

                  {!renovable && poliza.confchhas && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Esta póliza no puede ser renovada. 
                        {diasVencimiento > 60 
                          ? ` Vence en ${diasVencimiento} días (máximo 60 días antes).`
                          : ` Venció hace ${Math.abs(diasVencimiento)} días (máximo 30 días después).`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Confirmación de selección */}
      {selectedPoliza && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Póliza seleccionada: {selectedPoliza.conpol}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cliente: {selectedPoliza.cliente_nombre} - {selectedPoliza.compania_nombre}
                </p>
              </div>
              
              <Button onClick={handleConfirmSelection} size="lg">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Selección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}