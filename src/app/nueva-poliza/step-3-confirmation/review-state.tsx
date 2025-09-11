import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User,
  Building2,
  FileText,
  Car,
  Send,
  AlertTriangle,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { useNuevaPoliza } from '../../../hooks/use-nueva-poliza';

export function ReviewState() {
  const { state, sendToVelneo } = useNuevaPoliza();

  const handleSendToVelneo = () => {
    sendToVelneo();
  };

  // Mock de datos para mostrar
  const polizaData = state.scan.extractedData || {
    polizaNumber: "POL-2024-001",
    vigenciaDesde: "2024-01-15",
    vigenciaHasta: "2024-12-15",
    prima: "45000",
    vehiculoMarca: "Toyota",
    vehiculoModelo: "Corolla",
    vehiculoAno: "2020",
    vehiculoPatente: "ABC1234",
  };

  const formatCurrency = (amount: string) => {
    const number = parseFloat(amount);
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(number);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Resumen completo */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Información de contexto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{state.context.clienteInfo?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documento:</span>
                <span className="font-medium">{state.context.clienteInfo?.documento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compañía:</span>
                <span className="font-medium">{state.context.companiaInfo?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sección:</span>
                <span className="font-medium">{state.context.seccionInfo?.nombre}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de la póliza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Datos de la Póliza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Número:</span>
                <span className="font-medium">{polizaData.polizaNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prima:</span>
                <span className="font-medium">{formatCurrency(polizaData.prima)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vigencia:</span>
                <span className="font-medium">
                  {formatDate(polizaData.vigenciaDesde)} - {formatDate(polizaData.vigenciaHasta)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del vehículo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Datos del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Marca/Modelo:</span>
                <span className="font-medium">
                  {polizaData.vehiculoMarca} {polizaData.vehiculoModelo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Año:</span>
                <span className="font-medium">{polizaData.vehiculoAno}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patente:</span>
                <span className="font-medium">{polizaData.vehiculoPatente}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de escaneo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Calidad del Escaneo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">Confianza:</span>
              <Badge 
                variant={state.scan.completionPercentage >= 80 ? "default" : "secondary"}
                className={state.scan.completionPercentage >= 80 ? "bg-green-500" : "bg-yellow-500"}
              >
                {state.scan.completionPercentage}%
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Estado:</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-700 font-medium">Listo para enviar</span>
              </div>
            </div>

            {state.scan.requiresAttention.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {state.scan.requiresAttention.length} campo(s) fueron revisados manualmente
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información de archivo procesado */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium">Archivo procesado: {state.file.selected?.name}</p>
                <p className="text-sm text-gray-600">
                  Escaneado con Azure Document Intelligence • 
                  {state.scan.completionPercentage}% de confianza
                </p>
              </div>
            </div>
            
            <Badge variant="outline" className="text-green-600 border-green-300">
              Validado
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Acciones finales */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">¿Todo listo para enviar?</h3>
              <p className="text-gray-600">
                Una vez enviada, la póliza será creada en tu sistema Velneo y no podrá modificarse desde aquí.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.history.back()}
              >
                <AlertTriangle className="mr-2 h-5 w-5" />
                Revisar Datos
              </Button>
              
              <Button 
                onClick={handleSendToVelneo}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="mr-2 h-5 w-5" />
                Enviar a Velneo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}