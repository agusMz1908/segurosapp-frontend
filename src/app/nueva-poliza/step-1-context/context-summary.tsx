import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ContextSummaryProps {
  context: {
    clienteInfo?: { id: number; nombre: string; documento: string };
    companiaInfo?: { id: number; nombre: string };
    seccionInfo?: { id: number; nombre: string };
  };
}

export function ContextSummary({ context }: ContextSummaryProps) {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Contexto Configurado Correctamente
      </h4>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="font-medium text-green-700 dark:text-green-300">Cliente:</span>
          <p className="text-green-600 dark:text-green-200">{context.clienteInfo?.nombre}</p>
          <p className="text-green-500 dark:text-green-300 text-xs">{context.clienteInfo?.documento}</p>
        </div>
        <div>
          <span className="font-medium text-green-700 dark:text-green-300">Compañía:</span>
          <p className="text-green-600 dark:text-green-200">{context.companiaInfo?.nombre}</p>
        </div>
        <div>
          <span className="font-medium text-green-700 dark:text-green-300">Sección:</span>
          <p className="text-green-600 dark:text-green-200">{context.seccionInfo?.nombre}</p>
        </div>
      </div>
    </div>
  );
}