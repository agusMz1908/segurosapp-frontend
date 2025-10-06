import { useState } from 'react';
import { toast } from 'sonner';
import { getAuthToken } from '../utils/auth-utils';

export interface BillingStatsDto {
  totalPolizasThisMonth: number;
  estimatedCost: number;
  applicableTierName: string;
  pricePerPoliza: number;
  daysLeftInMonth: number;
  lastBillingDate: string;
}

export interface MonthlyBillingDto {
  id: number;
  billingYear: number;
  billingMonth: number;
  totalPolizasEscaneadas: number;
  appliedTierName: string;
  pricePerPoliza: number;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  generatedAt: string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  companyName: string;
  companyAddress?: string;
  companyRUC?: string;
  billingItemsCount: number;
}

export interface PricingTierDto {
  id: number;
  tierName: string;
  minPolizas: number;
  maxPolizas?: number;
  pricePerPoliza: number;
  isActive: boolean;
}

export interface BillDetailDto extends MonthlyBillingDto {
  billingItems: BillingItemDto[];
}

export interface BillingItemDto {
  id: number;
  scanDate: string;
  fileName: string;
  velneoPolizaNumber?: string;
  pricePerPoliza: number;
  amount: number;
  createdAt: string;
}

export interface RevenueAnalyticsDto {
  monthlyRevenue: MonthlyRevenueDto[];
  totalMetrics: RevenueMetricsDto;
  tierPerformance: TierPerformanceDto[];
  growthAnalysis: GrowthAnalysisDto;
  generatedAt: string;
}

export interface MonthlyRevenueDto {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
  companiesCount: number;
  polizasCount: number;
  averageRevenuePerCompany: number;
}

export interface RevenueMetricsDto {
  totalRevenue: number;
  averageMonthlyRevenue: number;
  highestMonthRevenue: number;
  lowestMonthRevenue: number;
  totalCompaniesServed: number;
  totalPolizasProcessed: number;
}

export interface TierPerformanceDto {
  tierName: string;
  pricePerPoliza: number;
  totalUsage: number;
  totalRevenue: number;
  minPolizas: number;
  maxPolizas: number;
  revenuePercentage: number;
}

export interface GrowthAnalysisDto {
  monthOverMonthGrowth: number;
  yearOverYearGrowth: number;
  growthTrend: string;
  predictedNextMonth: number;
}

export function useBilling() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para hacer llamadas a la API - URLs corregidas según tu Swagger
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const response = await fetch(`${baseUrl}/api/Billing${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error en la API' }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return response.json();
  };

  // Estadísticas del mes actual
  const getCurrentMonthStats = async (): Promise<BillingStatsDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/current-month-stats');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Facturas de la empresa
  const getCompanyBills = async (): Promise<MonthlyBillingDto[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/company-bills');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Detalle de una factura
  const getBillDetail = async (billId: number): Promise<BillDetailDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/company-bills/${billId}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generar factura mensual
  const generateMonthlyBill = async (
    year: number,
    month: number,
    companyName: string,
    companyAddress?: string,
    companyRUC?: string
  ): Promise<MonthlyBillingDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/generate-monthly-bill', {
        method: 'POST',
        body: JSON.stringify({
          year,
          month,
          companyName,
          companyAddress,
          companyRUC
        }),
      });
      toast.success('Factura generada exitosamente');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error generando factura: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Marcar factura como pagada
  const markBillAsPaid = async (
    billId: number,
    paymentMethod: string,
    paymentReference?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiCall(`/company-bills/${billId}/mark-paid`, {
        method: 'PUT',
        body: JSON.stringify({
          paymentMethod,
          paymentReference
        }),
      });
      toast.success('Factura marcada como pagada');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error marcando factura como pagada: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Descargar PDF de factura
  const downloadBillPdf = async (billId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await fetch(`${baseUrl}/api/Billing/company-bills/${billId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error descargando PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `factura-${billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF descargado exitosamente');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error descargando PDF: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Analíticas de ingresos
  const getRevenueAnalytics = async (months: number = 12): Promise<RevenueAnalyticsDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/revenue-analytics?months=${months}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generar factura del mes anterior automáticamente
  const generatePreviousMonthBill = async (
    companyName: string,
    companyAddress?: string,
    companyRUC?: string
  ): Promise<MonthlyBillingDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/generate-previous-month', {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          companyAddress,
          companyRUC
        }),
      });
      toast.success('Factura del mes anterior generada exitosamente');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error generando factura del mes anterior: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener resumen mensual
  const getMonthlySummary = async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/monthly-summary/${year}/${month}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getCurrentMonthStats,
    getCompanyBills,
    getBillDetail,
    generateMonthlyBill,
    generatePreviousMonthBill,
    markBillAsPaid,
    downloadBillPdf,
    getRevenueAnalytics,
    getMonthlySummary,
  };
}

// Hook para pricing - URLs corregidas según tu Swagger
export function usePricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const response = await fetch(`${baseUrl}/api/Pricing${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error en la API' }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return response.json();
  };

  // Obtener tiers de precios
  const getPricingTiers = async (): Promise<PricingTierDto[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/tiers');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calcular precio para cantidad de pólizas
  const calculatePrice = async (polizasCount: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/calculate/${polizasCount}`);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Crear tier de precios
  const createPricingTier = async (tierData: any): Promise<PricingTierDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/tiers', {
        method: 'POST',
        body: JSON.stringify(tierData),
      });
      toast.success('Tier de precios creado exitosamente');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error creando tier: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar tier de precios
  const updatePricingTier = async (tierId: number, tierData: any): Promise<PricingTierDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/tiers/${tierId}`, {
        method: 'PUT',
        body: JSON.stringify(tierData),
      });
      toast.success('Tier de precios actualizado exitosamente');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error actualizando tier: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Desactivar tier de precios
  const deactivatePricingTier = async (tierId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiCall(`/tiers/${tierId}`, {
        method: 'DELETE',
      });
      toast.success('Tier de precios desactivado exitosamente');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error desactivando tier: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getPricingTiers,
    calculatePrice,
    createPricingTier,
    updatePricingTier,
    deactivatePricingTier,
  };
}