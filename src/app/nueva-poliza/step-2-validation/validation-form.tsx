// step-2-validation/validation-form.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Settings,
  MessageSquare,
  User,
  Building2,
  Hash
} from 'lucide-react';
import { ExtractedDataForm } from './extracted-data-form';
import { MasterDataForm } from './master-data-form';

interface ValidationFormProps {
  hookInstance: any;
}

export function ValidationForm({ hookInstance }: ValidationFormProps) {
  const { state, updateState } = hookInstance;

  const handleObservacionesChange = (value: string) => {
    updateState({
      masterData: {
        ...state.masterData,
        observaciones: value
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header del paso */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Validar Información
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Revisa los datos extraídos automáticamente y completa la información con datos maestros
        </p>
      </div>

      {/* Información del contexto - Compacta */}
      <div className="grid md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Cliente</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {state.context.clienteInfo?.nombre || "No seleccionado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Compañía</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {state.context.companiaInfo?.nombre || "No seleccionada"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sección</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {state.context.seccionInfo?.nombre || "No seleccionada"}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario único consolidado */}
      <Card className="shadow-lg">
        <CardContent className="p-8 space-y-8">
          
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Datos del Documento
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Información extraída automáticamente del PDF • {state.scan.completionPercentage || 0}% confianza
              </p>
            </div>
          </div>
          
          {/* AGREGAR: Card wrapper forzando el fondo gris */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-6">
              <ExtractedDataForm hookInstance={hookInstance} />
            </div>
          </div>
        </div>

          <Separator className="my-6" />

          {/* 2. Datos Maestros */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Datos Maestros
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configuración específica para crear la póliza en el sistema Velneo
                </p>
              </div>
            </div>

            {/* Extraer contenido del MasterDataForm sin el Card wrapper */}
            <div className="space-y-4">
              <MasterDataForm hookInstance={hookInstance} />
            </div>
          </div>

          <Separator className="my-6" />

          {/* 3. Observaciones */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Observaciones
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Notas adicionales que se incluirán en la póliza
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Textarea
                placeholder="Escribe aquí cualquier observación o nota adicional sobre esta póliza..."
                value={state.masterData?.observaciones || ''}
                onChange={(e) => handleObservacionesChange(e.target.value)}
                className="min-h-[100px] resize-y"
                maxLength={500}
              />
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Las observaciones se incluirán en el registro de la póliza</span>
                <span>{(state.masterData?.observaciones || '').length}/500</span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}