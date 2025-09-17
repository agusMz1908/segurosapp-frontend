import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCcw, Search, AlertTriangle } from 'lucide-react';

interface PolizaActionButtonsProps {
  validationError: any;
  onAction: (action: string) => void;
  isCompact?: boolean;
}

export function PolizaActionButtons({ 
  validationError, 
  onAction, 
  isCompact = false 
}: PolizaActionButtonsProps) {
  
  if (!validationError) return null;

  const buttonClass = isCompact 
    ? "h-auto p-2" 
    : "h-auto p-4 justify-start";

  const contentClass = isCompact
    ? "text-xs"
    : "text-left";

  return (
    <div className={`grid gap-2 ${isCompact ? '' : 'max-w-md'}`}>
      
      {validationError.existingPolizaStatus === 'V' && (
        <Button 
          variant="outline" 
          size={isCompact ? "sm" : "default"}
          onClick={() => onAction('modify')}
          className={buttonClass}
        >
          <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
          {!isCompact && (
            <div className={contentClass}>
              <div className="font-medium">Modificar Póliza</div>
              <div className="text-xs text-gray-500">Crear endoso sobre póliza vigente</div>
            </div>
          )}
          {isCompact && <span>Modificar</span>}
        </Button>
      )}

      {(validationError.existingPolizaStatus !== 'V') && (
        <Button 
          variant="outline" 
          size={isCompact ? "sm" : "default"}
          onClick={() => onAction('renew')}
          className={buttonClass}
        >
          <RefreshCcw className="h-4 w-4 mr-2 flex-shrink-0" />
          {!isCompact && (
            <div className={contentClass}>
              <div className="font-medium">Renovar Póliza</div>
              <div className="text-xs text-gray-500">Crear renovación de póliza</div>
            </div>
          )}
          {isCompact && <span>Renovar</span>}
        </Button>
      )}

      <Button 
        variant="outline" 
        size={isCompact ? "sm" : "default"}
        onClick={() => onAction('verify')}
        className={buttonClass}
      >
        <Search className="h-4 w-4 mr-2 flex-shrink-0" />
        {!isCompact && (
          <div className={contentClass}>
            <div className="font-medium">Verificar Número</div>
            <div className="text-xs text-gray-500">Revisar si el número es correcto</div>
          </div>
        )}
        {isCompact && <span>Verificar</span>}
      </Button>
      
    </div>
  );
}