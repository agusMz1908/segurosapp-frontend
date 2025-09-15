// components/ui/master-data-selector.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2 } from 'lucide-react';

interface MasterDataOption {
  id: string | number;
  nombre: string;
  codigo?: string;
  displayName?: string;
}

interface MasterDataSelectorProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: MasterDataOption[];
  placeholder?: string;
  required?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function MasterDataSelector({ 
  label, 
  value, 
  onValueChange, 
  options, 
  placeholder = "Seleccionar...",
  required = false,
  loading = false,
  error,
  className = "",
  disabled = false
}: MasterDataSelectorProps) {
  // Simplificar el manejo de valores
  const selectValue = value || "";
  
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
  };

  const isValid = required ? !!value && value !== "" : true;
  const hasError = !!error;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex items-center gap-2 text-sm font-medium">
        {label}
        {required && <span className="text-red-500">*</span>}
        {value && value !== "" && <CheckCircle className="h-4 w-4 text-green-500" />}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </Label>
      
      <Select 
        value={selectValue} 
        onValueChange={handleValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger 
          className={`w-full ${
            hasError 
              ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
              : !isValid && required
                ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20'
                : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        
        <SelectContent>
          {/* Opción vacía estándar */}
          <SelectItem value="">Sin seleccionar</SelectItem>
          
          {options.map((option, index) => (
            <SelectItem key={`${option.id}-${index}`} value={String(option.id)}>
              <div className="flex items-center gap-2">
                <span>{option.displayName || option.nombre}</span>
                {option.codigo && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({option.codigo})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Mensaje de error */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      
      {/* Ayuda para campos requeridos */}
      {required && !value && !error && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Este campo es requerido
        </p>
      )}
      
      {/* Estado de carga */}
      {loading && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Cargando opciones...
        </p>
      )}
    </div>
  );
}