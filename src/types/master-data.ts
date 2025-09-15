// types/master-data.ts
"use client"

// =================== INTERFACES BACKEND ===================
// Estas interfaces reflejan los DTOs del backend .NET

export interface ClienteItem {
  id: number;
  corrcod: number;
  subcorr: number;
  clinom: string;                    // Nombre cliente
  telefono: string;
  clifchnac?: string | null;         // Fecha nacimiento
  clifching?: string | null;         // Fecha ingreso
  clifchegr?: string | null;         // Fecha egreso
  clicargo: string;
  clicon: string;                    // Contacto
  cliruc: string;                    // RUC
  clirsoc: string;                   // Razón social
  cliced: string;                    // Cédula
  clilib: string;                    // Libreta
  clicatlib: string;
  clitpo: string;                    // Tipo
  clidir: string;                    // Dirección
  cliemail: string;                  // Email
  clivtoced?: string | null;         // Vencimiento cédula
  clivtolib?: string | null;
  cliposcod: number;
  clitelcorr: string;
  clidptnom: string;
  clisex: string;
  clitelant: string;
  cliobse: string;
  clifax: string;
  clitelcel: string;
  cliclasif: string;
  clinumrel: string;
  clicasapt: string;
  clidircob: string;
  clibse: number;
  clifoto: string;
  pruebamillares: number;
  ingresado: string;
  clialias: string;
  clipor: string;
  clisancor: string;
  clirsa: string;
  codposcob: number;
  clidptcob: string;
  activo: boolean;
  cli_s_cris: string;
  clifchnac1?: string | null;
  clilocnom: string;
  cliloccob: string;
  categorias_de_cliente: number;
  sc_departamentos: string;
  sc_localidades: string;
  fch_ingreso?: string | null;
  grupos_economicos: number;
  etiquetas: boolean;
  doc_digi: boolean;
  password: string;
  habilita_app: boolean;
  referido: string;
  altura: number;
  peso: number;
  cliberkley: string;
  clifar: string;
  clisurco: string;
  clihdi: string;
  climapfre: string;
  climetlife: string;
  clisancris: string;
  clisbi: string;
  edo_civil: string;
  not_bien_mail: boolean;
  not_bien_wap: boolean;
  ing_poliza_mail: boolean;
  ing_poliza_wap: boolean;
  ing_siniestro_mail: boolean;
  ing_siniestro_wap: boolean;
  noti_obs_sini_mail: boolean;
  noti_obs_sini_wap: boolean;
  last_update?: string | null;
  app_id: number;

  // Propiedades calculadas del backend
  displayName: string;
  documentNumber: string;
  documentType: string;
  fullAddress: string;
  contactInfo: string;
}

export interface CompaniaItem {
  id: number;
  comnom: string;                    // Nombre compañía
  comrazsoc: string;                 // Razón social
  comruc: string;                    // RUC
  comdom: string;                    // Domicilio
  comtel: string;                    // Teléfono
  comfax: string;                    // Fax
  comsumodia: string;
  comcntcli: number;
  comcntcon: number;
  comprepes: number;
  compredol: number;
  comcomipe: number;
  comcomido: number;
  comtotcomi: number;
  comtotpre: number;
  comalias: string;                  // Alias (ej: "SURA")
  comlog: string;
  broker: boolean;
  cod_srvcompanias: string;
  no_utiles: string;
  paq_dias: number;
  
  // Propiedades calculadas del backend
  displayName: string;               // "SURA SEGUROS"
  isActive: boolean;
  shortCode: string;                 // "SURA"
}

export interface SeccionItem {
  id: number;
  seccion: string;                   // "INCENDIO"
  icono: string;
  
  // Propiedades calculadas del backend
  displayName: string;               // "INCENDIO"
  code: string;                      // "INCENDIO"
  isActive: boolean;
}

// =================== INTERFACES FRONTEND SIMPLIFICADAS ===================
// Estas son las interfaces que usamos en el frontend para simplificar

export interface Cliente {
  id: number;
  nombre: string;
  documento: string;
  documentType: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  displayName?: string;
  contactInfo?: string;
}

export interface Compania {
  id: number;
  nombre: string;
  codigo?: string;
  activa: boolean;
  displayName?: string;
}

export interface Seccion {
  id: number;
  nombre: string;
  codigo?: string;
  companiaId?: number;
  activa: boolean;
  displayName?: string;
}

export interface MasterDataItem {
  id: string | number;
  nombre: string;
  codigo?: string;
  valor?: string;
  activo: boolean;
}

// =================== API RESPONSE TYPES ===================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startItem?: number;
  endItem?: number;
}

