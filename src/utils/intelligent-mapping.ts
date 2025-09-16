// src/utils/intelligent-mapping.ts
// Implementación universal del mapeo inteligente (sin referencias específicas a compañías)

import { toast } from 'react-hot-toast';
import type { MasterDataItem } from '@/types/master-data';

/**
 * Función auxiliar para calcular similitud entre strings
 */
const calculateSimilarity = (text1: string, text2: string): number => {
  const str1 = text1.toLowerCase().trim();
  const str2 = text2.toLowerCase().trim();
  
  // Coincidencia exacta
  if (str1 === str2) return 1.0;
  
  // Uno contiene al otro
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;
  
  // Similitud por palabras comunes
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(word => 
    words2.some(w => w.includes(word) || word.includes(w))
  );
  
  if (commonWords.length > 0) {
    return commonWords.length / Math.max(words1.length, words2.length);
  }
  
  // Similitud por caracteres comunes (básico)
  let matches = 0;
  const minLength = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLength; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  
  return matches / Math.max(str1.length, str2.length);
};

/**
 * Función para encontrar la mejor coincidencia
 */
const findBestMatch = (extractedValue: string, masterDataList: MasterDataItem[], threshold = 0.7): MasterDataItem | null => {
  if (!extractedValue || !masterDataList.length) return null;
  
  // Limpiar el valor extraído
  const cleanValue = extractedValue
    .replace(/^[A-Z\s]+\n/, '') // Remover prefijos como "COMBUSTIBLE\n"
    .replace(/[.:\n]/g, ' ')    // Remover puntos, dos puntos, saltos de línea
    .trim();
  
  console.log(`🔍 Buscando coincidencia para: "${cleanValue}"`);
  
  let bestMatch: MasterDataItem | null = null;
  let bestScore = 0;
  
  for (const item of masterDataList) {
    const score = calculateSimilarity(cleanValue, item.nombre);
    console.log(`   - "${item.nombre}": ${(score * 100).toFixed(1)}%`);
    
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = item;
    }
  }
  
  if (bestMatch) {
    console.log(`✅ Mejor coincidencia: "${bestMatch.nombre}" (${(bestScore * 100).toFixed(1)}%)`);
  } else {
    console.log(`❌ No se encontró coincidencia suficiente (threshold: ${threshold * 100}%)`);
  }
  
  return bestMatch;
};

/**
 * Interface para los datos del formulario
 */
export interface MasterDataFormData {
  combustibleId: string;
  destinoId: string;
  departamentoId: string;
  calidadId: string;
  categoriaId: string;
  tarifaId: string;
}

/**
 * Interface para los datos maestros necesarios
 */
export interface MasterDataSets {
  combustibles: MasterDataItem[];
  destinos: MasterDataItem[];
  departamentos: MasterDataItem[];
  calidades: MasterDataItem[];
  categorias: MasterDataItem[];
  tarifas: MasterDataItem[];
}

/**
 * FUNCIÓN PRINCIPAL DE MAPEO INTELIGENTE UNIVERSAL
 * Funciona con datos ya normalizados por el backend
 */
export const intelligentMapping = (
  extractedData: Record<string, any>,
  currentFormData: MasterDataFormData,
  masterDataSets: MasterDataSets
): MasterDataFormData => {
  
  const { combustibles, destinos, departamentos, calidades, categorias, tarifas } = masterDataSets;
  const newFormData = { ...currentFormData };
  let hasChanges = false;

  console.log('🤖 Iniciando mapeo inteligente universal...');
  console.log('📊 Datos disponibles:', {
    combustibles: combustibles.length,
    destinos: destinos.length,
    departamentos: departamentos.length,
    calidades: calidades.length,
    categorias: categorias.length,
    tarifas: tarifas.length
  });

  // Función auxiliar para buscar en múltiples campos posibles
  const findValueInFields = (possibleFields: string[]) => {
    for (const field of possibleFields) {
      if (extractedData[field]) {
        return extractedData[field];
      }
    }
    return null;
  };

  // MAPEAR COMBUSTIBLE
  if (combustibles.length > 0 && !newFormData.combustibleId) {
    const combustibleText = findValueInFields([
      "vehiculo.combustible",      // Campo normalizado
      "combustible",               // Campo directo
      "vehiculoTipoCombustible"    // Frontend field
    ]);
    
    if (combustibleText) {
      // Mapeos específicos conocidos para combustibles uruguayos
      const combustibleMappings: { [key: string]: string } = {
        'NAFTA': 'GAS',           // NAFTA → GASOLINA
        'GASOLINA': 'GAS',        // GASOLINA → GASOLINA
        'DIESEL': 'DIS',          // DIESEL → DISEL
        'DISEL': 'DIS',           // DISEL → DISEL
        'GAS-OIL': 'DIS',         // GAS-OIL → DISEL
        'GASOIL': 'DIS',          // GASOIL → DISEL
        'ELECTRICO': 'ELE',       // ELECTRICO → ELECTRICOS
        'ELÉCTRICO': 'ELE',       // ELÉCTRICO → ELECTRICOS
        'HIBRIDO': 'HYB',         // HIBRIDO → HYBRIDO
        'HÍBRIDO': 'HYB',         // HÍBRIDO → HYBRIDO
        'HYBRID': 'HYB',          // HYBRID → HYBRIDO
        'GLP': 'GLP',             // GLP → GLP
        'GNC': 'GNC'              // GNC → GNC
      };

      const cleanCombustible = combustibleText.replace(/COMBUSTIBLE\n?/i, '').trim();
      
      // Buscar mapeo directo primero
      let combustibleMatch: MasterDataItem | null = null;
      const directMapping = combustibleMappings[cleanCombustible.toUpperCase()];
      if (directMapping) {
        combustibleMatch = combustibles.find(c => 
          c.id.toString() === directMapping || 
          c.codigo === directMapping ||
          c.nombre.toUpperCase().includes(directMapping)
        ) || null;
      }
      
      // Si no hay mapeo directo, usar similitud
      if (!combustibleMatch) {
        combustibleMatch = findBestMatch(combustibleText, combustibles, 0.6);
      }
      
      if (combustibleMatch) {
        newFormData.combustibleId = combustibleMatch.id.toString();
        hasChanges = true;
        console.log(`🚗 Combustible mapeado: "${cleanCombustible}" → "${combustibleMatch.nombre}"`);
      }
    }
  }

  // MAPEAR DESTINO
  if (destinos.length > 0 && !newFormData.destinoId) {
    const destinoText = findValueInFields([
      "vehiculo.destino_del_vehiculo",  // BSE
      "vehiculo.tipo_de_uso",           // MAPFRE/SURA
      "tipoUso",                        // Frontend
      "destino"                         // Generic
    ]);
    
    if (destinoText) {
      const cleanDestino = destinoText.replace(/^Tipo de uso\s+/i, '').trim();
      
      // Mapeos universales para destinos uruguayos
      const destinoMappings: { [key: string]: string[] } = {
        'COMERCIAL': ['TRABAJO', 'COMERCIAL', 'LABORAL', 'PROFESSIONAL'],
        'PARTICULAR': ['PARTICULAR', 'PERSONAL', 'PRIVADO', 'PRIVATE'],
        'TAXI': ['TAXI', 'REMISE'],
        'CARGA': ['CARGA', 'TRANSPORTE', 'TRANSPORT'],
        'PUBLICO': ['PÚBLICO', 'PUBLIC', 'OMNIBUS'],
        'EMERGENCIA': ['EMERGENCIA', 'AMBULANCIA', 'BOMBEROS'],
        'OFICIAL': ['OFICIAL', 'GOBIERNO', 'ESTATAL']
      };

      let destinoMatch: MasterDataItem | null = null;
      
      // Buscar mapeo directo primero
      for (const [key, valores] of Object.entries(destinoMappings)) {
        if (cleanDestino.toUpperCase().includes(key)) {
          for (const valor of valores) {
            destinoMatch = destinos.find(d => 
              d.nombre.toUpperCase().includes(valor.toUpperCase())
            ) || null;
            if (destinoMatch) break;
          }
          if (destinoMatch) break;
        }
      }
      
      // Si no hay mapeo directo, usar similitud con umbral más bajo
      if (!destinoMatch) {
        destinoMatch = findBestMatch(cleanDestino, destinos, 0.5);
      }
      
      if (destinoMatch) {
        newFormData.destinoId = destinoMatch.id.toString();
        hasChanges = true;
        console.log(`🎯 Destino mapeado: "${cleanDestino}" → "${destinoMatch.nombre}"`);
      }
    }
  }

  // MAPEAR DEPARTAMENTO
  if (departamentos.length > 0 && !newFormData.departamentoId) {
    const departamentoText = findValueInFields([
      "asegurado.departamento",
      "departamento", 
      "depto",
      "aseguradoDepartamento"
    ]);
    
    if (departamentoText) {
      const deptMatch = findBestMatch(departamentoText, departamentos, 0.8);
      
      if (deptMatch) {
        newFormData.departamentoId = deptMatch.id.toString();
        hasChanges = true;
        console.log(`🏢 Departamento mapeado: "${deptMatch.nombre}"`);
      }
    }
  }

  // MAPEAR CALIDAD (desde vehiculo.calidad_contratante)
  if (calidades.length > 0 && !newFormData.calidadId) {
    const calidadText = findValueInFields([
      "vehiculo.calidad_contratante",
      "calidad_contratante",
      "calidad"
    ]);
    
    if (calidadText) {
      const calidadMatch = findBestMatch(calidadText, calidades, 0.8);
      
      if (calidadMatch) {
        newFormData.calidadId = calidadMatch.id.toString();
        hasChanges = true;
        console.log(`👤 Calidad mapeada: "${calidadMatch.nombre}"`);
      }
    }
  }

  // MAPEAR CATEGORÍA VEHICULAR
  if (categorias.length > 0 && !newFormData.categoriaId) {
    const categoriaText = findValueInFields([
      "vehiculo.tipo_vehiculo",         // BSE
      "vehiculo.tipo",                  // MAPFRE
      "vehiculoTipo",                   // Frontend
      "categoria"                       // Generic
    ]);
    
    if (categoriaText) {
      const cleanCategoria = categoriaText.replace(/^Tipo\s+/i, '').trim();
      
      // Mapeos universales para categorías vehiculares uruguayas
      const categoriaMappings: { [key: string]: string[] } = {
        'AUTOMOVIL': ['Automóvil', 'AUTO', 'SEDAN'],
        'AUTO': ['Automóvil', 'AUTO', 'SEDAN'],
        'CAMIONETA': ['Camioneta Rural', 'Pick-Up', 'CAMIONETA'],
        'PICKUP': ['Pick-Up Doble Cabina', 'PICKUP', 'Camioneta'],
        'PICK-UP': ['Pick-Up', 'Camioneta', 'PICKUP'],
        'JEEP': ['Jeeps', 'SUV', 'JEEP'],
        'SUV': ['Jeeps', 'SUV', 'JEEP'],
        'CAMION': ['Camion', 'Furgón', 'TRUCK'],
        'FURGON': ['Camioneta furgon', 'Furgón', 'VAN'],
        'OMNIBUS': ['Omnibus', 'BUS', 'AUTOBUS'],
        'MOTO': ['MOTOS', 'MOTOCICLETA', 'MOTO'],
        'MOTOCICLETA': ['MOTOS', 'MOTOCICLETA'],
        'CICLOMOTOR': ['MOTOS', 'CICLOMOTOR'],
        'TRAILER': ['TRAILER', 'REMOLQUE'],
        'AGRICOLA': ['AGRICOLA', 'TRACTOR']
      };

      let categoriaMatch: MasterDataItem | null = null;
      
      // Buscar en mapeos específicos
      for (const [key, valores] of Object.entries(categoriaMappings)) {
        if (cleanCategoria.toUpperCase().includes(key)) {
          for (const valor of valores) {
            categoriaMatch = categorias.find(c => 
              c.nombre.toLowerCase().includes(valor.toLowerCase())
            ) || null;
            if (categoriaMatch) break;
          }
          if (categoriaMatch) break;
        }
      }
      
      // Si no hay mapeo específico, usar similitud
      if (!categoriaMatch) {
        categoriaMatch = findBestMatch(cleanCategoria, categorias, 0.6);
      }
      
      if (categoriaMatch) {
        newFormData.categoriaId = categoriaMatch.id.toString();
        hasChanges = true;
        console.log(`🚙 Categoría mapeada: "${cleanCategoria}" → "${categoriaMatch.nombre}"`);
      }
    }
  }

if (tarifas.length > 0 && !newFormData.tarifaId) {
  let tarifaMatch: MasterDataItem | null = null;
  
  const modalidad = findValueInFields([
    "poliza.modalidad_normalizada",   // Usar campo normalizado del backend
    "poliza.modalidad",               // Fallback al original
    "modalidad",
    "cobertura"
  ]);
  
  if (modalidad) {
    console.log(`🔍 Buscando tarifa para modalidad: "${modalidad}"`);
    
    // Mapeos específicos de modalidades a tarifas
    const modalidadToTarifa: { [key: string]: string[] } = {
      'TODO RIESGO TOTAL': ['TODO RIESGO', 'TOTAL', 'COMPLETA', 'INTEGRAL', 'PREMIUM'],
      'TODO RIESGO': ['TODO RIESGO', 'TOTAL', 'COMPLETA', 'INTEGRAL'],
      'TOTAL': ['TODO RIESGO', 'TOTAL', 'COMPLETA'],
      'TERCEROS': ['TERCEROS', 'RC', 'RESPONSABILIDAD CIVIL'],
      'BASICA': ['BASICA', 'MINIMA', 'STANDARD'],
      'PREMIUM': ['PREMIUM', 'SUPERIOR', 'PLUS']
    };
    
    for (const [key, tarifaNames] of Object.entries(modalidadToTarifa)) {
      if (modalidad.toUpperCase().includes(key)) {
        console.log(`🎯 Modalidad detectada: "${key}" para "${modalidad}"`);
        
        for (const tarifaName of tarifaNames) {
          tarifaMatch = tarifas.find(t => 
            t.nombre.toUpperCase().includes(tarifaName)
          ) || null;
          if (tarifaMatch) {
            console.log(`✅ Tarifa encontrada: "${tarifaName}" → "${tarifaMatch.nombre}"`);
            break;
          }
        }
        if (tarifaMatch) break;
      }
    }
    
    // Si no encontró por mapeo específico, usar similitud
    if (!tarifaMatch) {
      tarifaMatch = findBestMatch(modalidad, tarifas, 0.6);
      if (tarifaMatch) {
        console.log(`✅ Tarifa encontrada por similitud: "${modalidad}" → "${tarifaMatch.nombre}"`);
      }
    }
  }
  
  // Estrategia 2: Si hay categoría seleccionada, buscar tarifa relacionada
  if (!tarifaMatch && newFormData.categoriaId) {
    const categoriaSeleccionada = categorias.find(c => c.id.toString() === newFormData.categoriaId);
    if (categoriaSeleccionada) {
      tarifaMatch = findBestMatch(categoriaSeleccionada.nombre, tarifas, 0.7);
    }
  }
  
  // Estrategia 3: Fallback a tarifa por defecto
  if (!tarifaMatch && tarifas.length > 0) {
    tarifaMatch = tarifas.find(t => 
      t.nombre.toLowerCase().includes('general') || 
      t.nombre.toLowerCase().includes('estandar') ||
      t.nombre.toLowerCase().includes('basica') ||
      t.nombre.toLowerCase().includes('normal')
    ) || tarifas[0];
  }
  
  if (tarifaMatch) {
    newFormData.tarifaId = tarifaMatch.id.toString();
    hasChanges = true;
    console.log(`💰 Tarifa mapeada: "${tarifaMatch.nombre}"`);
  }
}

  // Aplicar cambios si los hay
  if (hasChanges) {
    console.log('✅ Mapeo inteligente universal completado con cambios aplicados');
    
    // Mostrar resumen de mapeos
    const mappedFields = [];
    if (newFormData.combustibleId !== currentFormData.combustibleId) mappedFields.push('Combustible');
    if (newFormData.destinoId !== currentFormData.destinoId) mappedFields.push('Destino');
    if (newFormData.departamentoId !== currentFormData.departamentoId) mappedFields.push('Departamento');
    if (newFormData.calidadId !== currentFormData.calidadId) mappedFields.push('Calidad');
    if (newFormData.categoriaId !== currentFormData.categoriaId) mappedFields.push('Categoría');
    if (newFormData.tarifaId !== currentFormData.tarifaId) mappedFields.push('Tarifa');
    
    if (mappedFields.length > 0) {
      toast.success(`Datos maestros mapeados automáticamente: ${mappedFields.join(', ')}`);
    }
  } else {
    console.log('ℹ️ Mapeo inteligente universal completado sin cambios');
  }

  return newFormData;
};