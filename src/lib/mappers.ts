// lib/mappers.ts - AGREGAR estas funciones al final del archivo

import type {
  Cliente,
  ClienteItem,
  Compania,
  CompaniaItem,
  Seccion,
  SeccionItem
} from '@/types/master-data';

// ... (código anterior de mappers) ...

/**
 * Formatea un documento según su tipo
 */
export function formatDocument(documento: string, type: string): string {
  if (!documento) return '';

  const cleanDoc = documento.replace(/\D/g, '');

  switch (type) {
    case 'RUT':
      // Formato: XX.XXX.XXX.X
      if (cleanDoc.length >= 8) {
        const formatted = cleanDoc.replace(/(\d{1,2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3.$4');
        return formatted;
      }
      break;
      
    case 'CI':
      // Formato: X.XXX.XXX
      if (cleanDoc.length >= 7) {
        const formatted = cleanDoc.replace(/(\d{1})(\d{3})(\d{3})/, '$1.$2.$3');
        return formatted;
      }
      break;
  }

  return documento; // Devolver original si no se puede formatear
}

/**
 * Obtiene el texto de contacto de un cliente para mostrar
 */
export function getClienteContactText(cliente: Cliente): string {
  const parts: string[] = [];

  if (cliente.telefono) {
    parts.push(`Tel: ${cliente.telefono}`);
  }

  if (cliente.email) {
    parts.push(`Email: ${cliente.email}`);
  }

  if (cliente.direccion) {
    parts.push(`Dir: ${cliente.direccion}`);
  }

  return parts.join(' • ') || 'Sin información de contacto';
}

export function mapClienteItemToCliente(clienteItem: ClienteItem): Cliente {
  // Obtener el nombre más apropiado
  const nombre = clienteItem.displayName || clienteItem.clinom || 'Sin nombre';
  
  // Obtener el documento más apropiado
  let documento = clienteItem.documentNumber || clienteItem.cliruc || clienteItem.cliced || '';
  
  // Limpiar formato del documento
  if (documento) {
    documento = documento.trim();
  }
  
  // Determinar tipo de documento
  let documentType = clienteItem.documentType || '';
  if (!documentType) {
    if (clienteItem.cliruc) {
      documentType = 'RUT';
    } else if (clienteItem.cliced) {
      documentType = 'CI';
    } else {
      documentType = 'Otro';
    }
  }

  // Obtener email
  const email = clienteItem.cliemail?.trim() || undefined;
  
  // Obtener teléfono (priorizar teléfono principal, luego corredor)
  let telefono = clienteItem.telefono?.trim();
  if (!telefono || telefono === '') {
    telefono = clienteItem.clitelcorr?.trim();
  }
  if (!telefono || telefono === '') {
    telefono = clienteItem.clitelcel?.trim();
  }

  // Obtener dirección
  const direccion = clienteItem.fullAddress?.trim() || clienteItem.clidir?.trim() || undefined;

  return {
    id: clienteItem.id,
    nombre,
    documento,
    documentType,
    email,
    telefono,
    direccion,
    activo: clienteItem.activo,
    displayName: clienteItem.displayName,
    contactInfo: clienteItem.contactInfo
  };
}

/**
 * Mapea un CompaniaItem del backend a una Compania para el frontend
 */
export function mapCompaniaItemToCompania(companiaItem: CompaniaItem): Compania {
  return {
    id: companiaItem.id,
    nombre: companiaItem.comnom,
    codigo: companiaItem.comalias,
    activa: companiaItem.isActive,
    displayName: companiaItem.displayName || companiaItem.comnom
  };
}

export function mapSeccionItemToSeccion(seccionItem: SeccionItem): Seccion {
  return {
    id: seccionItem.id,
    nombre: seccionItem.seccion,
    companiaId: seccionItem.id,
    activa: seccionItem.isActive,
    displayName: seccionItem.displayName || seccionItem.seccion
  };
}

/**
 * Valida si un cliente tiene la información mínima requerida
 */
export function validateCliente(cliente: Cliente): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!cliente.nombre || cliente.nombre.trim() === '') {
    errors.push('El nombre es requerido');
  }

  if (!cliente.documento || cliente.documento.trim() === '') {
    errors.push('El documento es requerido');
  }

  // Validar formato RUT uruguayo básico
  if (cliente.documentType === 'RUT' && cliente.documento) {
    const rutPattern = /^\d{1,2}\.\d{3}\.\d{3}\.\d{1}$|^\d{12}$/;
    if (!rutPattern.test(cliente.documento.replace(/\s/g, ''))) {
      errors.push('Formato de RUT inválido');
    }
  }

  // Validar email si está presente
  if (cliente.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cliente.email)) {
      errors.push('Formato de email inválido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}