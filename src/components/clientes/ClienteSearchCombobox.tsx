"use client"

import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, User, Search, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMasterData } from '@/hooks/use-master-data';
import { getClienteContactText, formatDocument } from '@/lib/mappers';
import type { Cliente } from '@/types/master-data';

interface ClienteSearchComboboxProps {
  value?: number;
  onValueChange: (clienteId: number | undefined, cliente?: Cliente) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ClienteSearchCombobox({
  value,
  onValueChange,
  placeholder = "Buscar cliente...",
  className,
  disabled = false
}: ClienteSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();
  
  const { searchClientes, loading, error, clearError } = useMasterData();

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        clearError();
        const results = await searchClientes(searchQuery, 10);
        setSearchResults(results);
      } catch (error) {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchClientes, clearError]);

  useEffect(() => {
    if (value && !selectedCliente) {
      const clienteFromResults = searchResults.find(c => c.id === value);
      if (clienteFromResults) {
        setSelectedCliente(clienteFromResults);
      }
    }
  }, [value, selectedCliente, searchResults]);

  const handleSelect = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    onValueChange(cliente.id, cliente);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCliente(undefined);
    onValueChange(undefined);
    setSearchResults([]);
    setSearchQuery('');
  };

  const displayText = useMemo(() => {
    if (selectedCliente) {
      return selectedCliente.nombre; 
    }
    return placeholder;
  }, [selectedCliente, placeholder]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "flex-1 justify-between text-left font-normal min-w-0",
                selectedCliente ?
                "rounded-r-none border-r-0" : "rounded-md",
                !selectedCliente && "text-muted-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate block min-w-0" title={displayText}>
                  {displayText}
                </span>
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <div className="flex items-center border-b">
                <Search className="h-4 w-4 ml-3 mr-2 flex-shrink-0 opacity-50" />
                <CommandInput
                  placeholder="Buscar por nombre, documento o email"
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="flex-1"
                />
                {loading && (
                  <Loader2 className="h-4 w-4 mr-3 flex-shrink-0 animate-spin opacity-50" />
                )}
              </div>

              <CommandList>
                {selectedCliente && (
                  <CommandGroup heading="Seleccionado">
                    <CommandItem
                      value={selectedCliente.id.toString()}
                      onSelect={() => handleSelect(selectedCliente)}
                      className="cursor-pointer"
                    >
                      <Check className="mr-2 h-4 w-4 opacity-100" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">{selectedCliente.nombre}</span>
                          <span className="text-sm text-muted-foreground flex-shrink-0">
                            {formatDocument(selectedCliente.documento, selectedCliente.documentType)}
                          </span>
                          {!selectedCliente.activo && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex-shrink-0">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getClienteContactText(selectedCliente)}
                        </div>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                )}

                {searchQuery.length >= 2 && (
                  <CommandGroup 
                    heading={`Resultados ${searchResults.length > 0 ? `(${searchResults.length})` : ''}`}
                  >
                    {loading && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin opacity-50" />
                        <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                      </div>
                    )}

                    {!loading && searchResults.length === 0 && searchQuery.length >= 2 && (
                      <CommandEmpty>
                        {error ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-red-600">Error: {error}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                clearError();
                                searchClientes(searchQuery, 10);
                              }}
                            >
                              Reintentar
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                              No se encontraron clientes para "{searchQuery}"
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Intenta con nombre, documento o email
                            </p>
                          </div>
                        )}
                      </CommandEmpty>
                    )}

                    {!loading && searchResults.map((cliente) => (
                      <CommandItem
                        key={cliente.id}
                        value={`${cliente.nombre} ${cliente.documento} ${cliente.email || ''}`}
                        onSelect={() => handleSelect(cliente)}
                        className="cursor-pointer"
                      >
                        <Check 
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCliente?.id === cliente.id ? "opacity-100" : "opacity-0"
                          )} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{cliente.nombre}</span>
                            <span className="text-sm text-muted-foreground flex-shrink-0">
                              {formatDocument(cliente.documento, cliente.documentType)}
                            </span>
                            {!cliente.activo && (
                              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {getClienteContactText(cliente)}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {!searchQuery && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Escribe al menos 2 caracteres para buscar clientes</p>
                    <p className="text-xs mt-1">
                      Puedes buscar por nombre, documento o email
                    </p>
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedCliente && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-l-none border-l-0 hover:bg-destructive/10 flex-shrink-0"
            onClick={handleClear}
            disabled={disabled}
            title="Limpiar selección"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </div>

      {error && !open && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md z-50">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}