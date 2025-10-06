import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  DollarSign,
  Download,
  FileText,
  Eye,
  Activity,
  AlertTriangle
} from "lucide-react";
import { getAuthHeaders, handle401Error } from "@/utils/auth-utils";

interface BillingItem {
  id: number;
  scanDate: string;
  fileName: string;
  amount: number;
  createdAt: string;
}

interface BillDetail {
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
  billingItems: BillingItem[];
}

interface BillDetailModalProps {
  billId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onBillUpdated?: () => Promise<void>;
  onDownloadPdf?: (billId: number) => void;
  onMarkAsPaid?: (billId: number) => void;
  loading?: boolean;
}

export function BillDetailModal({
  billId,
  isOpen,
  onClose,
  onBillUpdated,
  onDownloadPdf,
  onMarkAsPaid,
  loading = false
}: BillDetailModalProps) {
  
  const [billDetail, setBillDetail] = React.useState<BillDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Función para cargar los detalles de la factura
  const loadBillDetail = React.useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7202';
      const response = await fetch(`${API_URL}/api/Billing/company-bills/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        handle401Error();
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBillDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setBillDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar detalles cuando cambie el billId
  React.useEffect(() => {
    if (billId && isOpen) {
      loadBillDetail(billId);
    } else {
      setBillDetail(null);
      setError(null);
    }
  }, [billId, isOpen, loadBillDetail]);

  // Manejar cierre del modal
  const handleClose = () => {
    setBillDetail(null);
    setError(null);
    onClose();
  };

  // Función helper para verificar si es factura del mes actual
  const isCurrentMonthBill = (bill: BillDetail) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() es 0-indexado
    
    return bill.billingYear === currentYear && bill.billingMonth === currentMonth;
  };

  // Función para manejar marcar como pagada
  const handleMarkAsPaid = React.useCallback(async (billId: number) => {
    if (onMarkAsPaid) {
      try {
        await onMarkAsPaid(billId);
        // Recargar datos después de marcar como pagada
        if (onBillUpdated) {
          await onBillUpdated();
        }
        // Recargar los detalles del modal
        await loadBillDetail(billId);
      } catch (error: any) {
        // El manejo de errores se hace en el hook, pero podemos agregar lógica adicional aquí
        console.error('Error en modal al marcar como pagada:', error);
      }
    }
  }, [onMarkAsPaid, onBillUpdated, loadBillDetail]);

  // Función para manejar descarga de PDF
  const handleDownloadPdf = React.useCallback(async (billId: number) => {
    if (onDownloadPdf) {
      await onDownloadPdf(billId);
    }
  }, [onDownloadPdf]);

  // Si no hay billId, no mostrar nada
  if (!billId) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'generated': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'Pagada';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencida';
      case 'generated': return 'Generada';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="!max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {billDetail ? `Factura #${billDetail.id.toString().padStart(6, '0')}` : 'Cargando...'}
              </DialogTitle>
              {billDetail && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(billDetail.status)}>
                    {getStatusText(billDetail.status)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Período: {`${billDetail.billingMonth.toString().padStart(2, '0')}/${billDetail.billingYear}`}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onDownloadPdf && billDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPdf(billDetail.id)}
                  disabled={loading || isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
              {billDetail && billDetail.status !== 'Paid' && onMarkAsPaid && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleMarkAsPaid(billDetail.id)}
                  disabled={loading || isLoading || isCurrentMonthBill(billDetail)}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    isCurrentMonthBill(billDetail) 
                      ? "No se puede marcar como pagada hasta el próximo mes" 
                      : "Marcar factura como pagada"
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isCurrentMonthBill(billDetail) ? "No disponible este mes" : "Marcar como Pagada"}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando detalles de la factura...</p>
            </div>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <AlertTriangle className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => billId && loadBillDetail(billId)}
                disabled={isLoading}
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* Contenido principal - solo mostrar si hay datos */}
        {billDetail && !isLoading && !error && (
          <div className="flex-1 overflow-auto space-y-6">
            {/* Div Superior: Dos columnas con cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card izquierda: Período y Resumen Financiero */}
              <div className="space-y-4">
                
                {/* Período de Facturación */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Período de Facturación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="text-sm font-medium">Período:</span>
                      <span className="font-semibold">
                        {`${billDetail.billingMonth.toString().padStart(2, '0')}/${billDetail.billingYear}`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Generada: {formatDate(billDetail.generatedAt)}</div>
                      <div>Vencimiento: {formatDate(billDetail.dueDate)}</div>
                      {billDetail.paidAt && (
                        <div className="text-green-600 font-medium">
                          Pagada: {formatDate(billDetail.paidAt)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen Financiero */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Resumen Financiero
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(billDetail.subTotal)}</span>
                      </div>
                      {billDetail.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Impuestos:</span>
                          <span>{formatCurrency(billDetail.taxAmount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-semibold text-lg text-blue-600 dark:text-blue-400">
                        <span>Total:</span>
                        <span>{formatCurrency(billDetail.totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Card derecha: Métricas del Período */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Métricas del Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {billDetail.totalPolizasEscaneadas}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Pólizas Procesadas
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {billDetail.appliedTierName}
                        </div>
                        <div className="text-xs text-gray-500">Tier Aplicado</div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-700">
                        <div className="font-semibold text-purple-600 dark:text-purple-400">
                          {formatCurrency(billDetail.pricePerPoliza)}
                        </div>
                        <div className="text-xs text-gray-500">Por Póliza</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Div Inferior: Lista de Escaneos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalle de Pólizas Escaneadas
                  <Badge variant="outline" className="ml-2">
                    {billDetail.billingItems.length} ítems
                  </Badge>
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    Total: {formatCurrency(billDetail.totalAmount)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Fecha de Escaneo
                        </th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Archivo Procesado
                        </th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total Facturado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {billDetail.billingItems.map((item, index) => (
                        <tr 
                          key={item.id} 
                          className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/25'
                          }`}
                        >
                          <td className="p-3 text-sm">
                            {formatDate(item.scanDate)}
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(item.createdAt)}
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            <div className="font-medium">{item.fileName}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Procesado: {formatDate(item.createdAt)}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-right">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(item.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                        <td className="p-3 text-sm font-semibold" colSpan={2}>
                          Totales:
                        </td>
                        <td className="p-3 text-sm text-right font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(billDetail.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}