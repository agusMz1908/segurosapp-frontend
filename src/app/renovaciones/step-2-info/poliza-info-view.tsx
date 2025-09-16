import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Building2, 
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Car,
  Lock,
  CheckCircle,
  AlertTriangle,
  Info,
  Shield
} from 'lucide-react';

interface PolizaInfoViewProps {
  hookInstance: any;
}

export function PolizaInfoView({ hookInstance }: PolizaInfoViewProps) {
  const { state, getDiasParaVencimiento, isPolizaRenovable } = hookInstance;
  const poliza = state.polizaAnterior;

  if (!poliza) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay póliza seleccionada</h3>
        <p className="text-gray-600">Regresa al paso anterior para seleccionar una póliza.</p>
      </div>
    );
  }

  const diasVencimiento = getDiasParaVencimiento();
  const renovable = isPolizaRenovable();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-UY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getVencimientoStatus = () => {
    if (diasVencimiento > 30) {
      return {
        color: 'blue',
        text: `Vence en ${diasVencimiento} días`,
        icon: Clock
      };
    } else if (diasVencimiento > 0) {
      return {
        color: 'yellow',
        text: `Vence en ${diasVencimiento} días`,
        icon: AlertTriangle
      };
    } else {
      return {
        color: 'red',
        text: `Venció hace ${Math.abs(diasVencimiento)} días`,
        icon: AlertTriangle
      };
    }
  };

  const vencimientoStatus = getVencimientoStatus();
  const StatusIcon = vencimientoStatus.icon;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Información de la Póliza a Renovar
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Revisa los datos que se heredarán para la renovación
        </p>
      </div>

      {/* Status de renovabilidad */}
      <Alert className={renovable ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"}>
        {renovable ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className={renovable ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
          {renovable ? (
            <span>
              <strong>Esta póliza puede ser renovada.</strong> {vencimientoStatus.text}
            </span>
          ) : (
            <span>
              <strong>Esta póliza NO puede ser renovada.</strong> {vencimientoStatus.text}. 
              Solo se pueden renovar pólizas entre 60 días antes y 30 días después del vencimiento.
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Información principal de la póliza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Póliza Original
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <InfoItem 
                icon={FileText}
                label="Número de Póliza" 
                value={poliza.numero}
                className="font-mono text-lg"
              />
              
              <InfoItem 
                icon={Shield}
                label="Estado" 
                value={poliza.estado}
                badge={poliza.estado === 'Activa' ? 'default' : 'secondary'}
              />
              
              <InfoItem 
                icon={Calendar}
                label="Vigencia Desde" 
                value={formatDate(poliza.fechaDesde)}
              />
              
              <InfoItem 
                icon={Calendar}
                label="Vigencia Hasta" 
                value={formatDate(poliza.fechaHasta)}
                badge={renovable ? 'default' : 'destructive'}
                badgeText={vencimientoStatus.text}
              />
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <InfoItem 
                icon={DollarSign}
                label="Premio" 
                value={formatCurrency(poliza.premio)}
              />
              
              <InfoItem 
                icon={DollarSign}
                label="Monto Total" 
                value={formatCurrency(poliza.montoTotal)}
              />

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Creada:</strong> {formatDate(poliza.fechaDesde)}</p>
                <p><strong>ID Interno:</strong> {poliza.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contexto heredado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Contexto Heredado (No modificable)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <InfoItem 
              icon={User}
              label="Cliente" 
              value={poliza.cliente.nombre}
              subtitle={poliza.cliente.documento ? `Doc: ${poliza.cliente.documento}` : `ID: ${poliza.cliente.id}`}
            />
            
            <InfoItem 
              icon={Building2}
              label="Compañía" 
              value={poliza.compania.nombre}
              subtitle={`Código: ${poliza.compania.codigo}`}
            />
            
            <InfoItem 
              icon={FileText}
              label="Sección" 
              value={poliza.seccion.nombre}
              subtitle={`Ramo: ${poliza.seccion.ramo}`}
            />
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Este contexto (cliente, compañía y sección) se heredará automáticamente en la renovación y no puede ser modificado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Información del vehículo */}
      {(poliza.vehiculo.marca || poliza.vehiculo.modelo || poliza.vehiculo.patente) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {poliza.vehiculo.marca && (
                <InfoItem label="Marca" value={poliza.vehiculo.marca} />
              )}
              
              {poliza.vehiculo.modelo && (
                <InfoItem label="Modelo" value={poliza.vehiculo.modelo} />
              )}
              
              {poliza.vehiculo.anio > 0 && (
                <InfoItem label="Año" value={poliza.vehiculo.anio.toString()} />
              )}
              
              {poliza.vehiculo.patente && (
                <InfoItem label="Patente" value={poliza.vehiculo.patente} className="font-mono" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validaciones de renovación */}
      <Card>
        <CardHeader>
          <CardTitle>Validaciones de Renovación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ValidationItem 
              passed={!!poliza.numero}
              text="Número de póliza válido"
            />
            
            <ValidationItem 
              passed={poliza.estado === 'Activa'}
              text="Póliza activa en el sistema"
            />
            
            <ValidationItem 
              passed={renovable}
              text="Dentro del rango de renovación (60 días antes / 30 días después)"
            />
            
            <ValidationItem 
              passed={!!poliza.cliente.id}
              text="Cliente asociado válido"
            />
            
            <ValidationItem 
              passed={!!poliza.compania.id}
              text="Compañía asociada válida"
            />
            
            <ValidationItem 
              passed={!!poliza.seccion.id}
              text="Sección/ramo asociado válido"
            />
          </div>
          
          {renovable && (
            <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Todas las validaciones han pasado correctamente. La póliza está lista para ser renovada.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Próximos pasos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Pasos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>1. Al proceder al siguiente paso, podrás escanear el documento de la nueva póliza</p>
            <p>2. El sistema extraerá automáticamente los datos del nuevo documento</p>
            <p>3. Se validarán los datos extraídos con la información de master data</p>
            <p>4. Finalmente podrás confirmar la renovación en Velneo</p>
          </div>
          
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              La póliza anterior será marcada como "Antecedente/Terminado" y la nueva póliza tendrá como padre la póliza actual.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente auxiliar para mostrar información
interface InfoItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  className?: string;
  badge?: 'default' | 'destructive' | 'outline' | 'secondary';
  badgeText?: string;
}

function InfoItem({ icon: Icon, label, value, subtitle, className, badge, badgeText }: InfoItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}:
        </span>
        {badge && (
          <Badge variant={badge} className="text-xs">
            {badgeText}
          </Badge>
        )}
      </div>
      <p className={`text-sm text-gray-900 dark:text-gray-100 ${className || ''}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Componente auxiliar para validaciones
interface ValidationItemProps {
  passed: boolean;
  text: string;
}

function ValidationItem({ passed, text }: ValidationItemProps) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-red-600" />
      )}
      <span className={`text-sm ${passed ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
        {text}
      </span>
    </div>
  );
}