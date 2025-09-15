// step-3-confirmation/review-state.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User,
  FileText,
  Car,
  Send,
  AlertTriangle,
  Sparkles,
  CheckCircle
} from 'lucide-react';

interface ReviewStateProps {
  hookInstance: any;
}

export function ReviewState({ hookInstance }: ReviewStateProps) {
  const { state, sendToVelneo } = hookInstance;

  const handleSendToVelneo = () => {
    console.log('BUTTON CLICKED - Sending to Velneo');
    console.log('Current step3.status:', state.step3.status); // ✅ CORREGIDO: step3 en lugar de velneo
    
    sendToVelneo(); // ✅ CORREGIDO: Remover parámetro innecesario
  };

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
      <div className="grid lg:grid-cols-2 gap-6">
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
                <span className="font-medium">{state.context.clienteInfo?.nombre || "Juan Pérez"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Documento:</span>
                <span className="font-medium">{state.context.clienteInfo?.documento || "12345678-9"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compañía:</span>
                <span className="font-medium">{state.context.companiaInfo?.nombre || "Mapfre Uruguay"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sección:</span>
                <span className="font-medium">{state.context.seccionInfo?.nombre || "Automotor"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
      </div>

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

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Todo listo para enviar</h3>
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
                disabled={state.step3.status === 'creating' || state.isLoading} // ✅ CORREGIDO: step3.status en lugar de velneo.status
              >
                <Send className="mr-2 h-5 w-5" />
                {state.step3.status === 'creating' ? 'Enviando...' : 'Enviar a Velneo'} {/* ✅ CORREGIDO: step3.status en lugar de velneo.status */}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}