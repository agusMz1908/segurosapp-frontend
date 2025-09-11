import React from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

export function SendingState() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="relative mb-6">
          <div className="mx-auto w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <Send className="absolute inset-0 h-12 w-12 m-auto text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
          Enviando a Velneo...
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Estamos procesando y enviando la información a tu sistema Velneo. 
          Este proceso puede tomar unos momentos.
        </p>

        <div className="max-w-md mx-auto">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Validando datos...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span>Conectando con Velneo...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
              <span>Creando póliza...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}