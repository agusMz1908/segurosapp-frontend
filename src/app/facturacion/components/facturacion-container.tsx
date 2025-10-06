"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { useBilling, usePricing, type BillingStatsDto, type MonthlyBillingDto, type PricingTierDto } from '../../../hooks/use-billing';
import { BillDetailModal } from './bill-detail-modal';
import { GenerateBillModal } from './generate-bill-modal';

export function FacturacionContainer() {
    const { 
        getCurrentMonthStats, 
        getCompanyBills, 
        downloadBillPdf,
        markBillAsPaid,       
        loading: billingLoading 
    } = useBilling();
  
  const { 
    getPricingTiers, 
    loading: pricingLoading 
  } = usePricing();

  const [stats, setStats] = useState<BillingStatsDto | null>(null);
  const [bills, setBills] = useState<MonthlyBillingDto[]>([]);
  const [tiers, setTiers] = useState<PricingTierDto[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      console.log('🔄 Cargando datos de facturación...');
      
      // Cargar estadísticas del mes actual
      try {
        const statsData = await getCurrentMonthStats();
        console.log('✅ Estadísticas cargadas:', statsData);
        setStats(statsData);
      } catch (err) {
        console.warn('❌ Error loading stats:', err);
        setStats(null);
      }

      // Cargar facturas de la empresa
      try {
        const billsData = await getCompanyBills();
        console.log('✅ Facturas cargadas:', billsData);
        setBills(billsData);
      } catch (err) {
        console.warn('❌ Error loading bills:', err);
        setBills([]);
      }

      // Cargar tiers de precios
      try {
        const tiersData = await getPricingTiers();
        console.log('✅ Tiers cargados:', tiersData);
        setTiers(tiersData);
      } catch (err) {
        console.warn('❌ Error loading tiers:', err);
        setTiers([]);
      }

    } catch (error: any) {
      console.error('❌ Error general loading billing data:', error);
      setError(error.message || 'Error cargando datos de facturación');
    }
  };

  const handleViewBill = (billId: number) => {
    setSelectedBillId(billId);
    setShowDetailModal(true);
  };

  const handleDownloadPdf = async (billId: number) => {
    try {
      await downloadBillPdf(billId);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

const handleMarkAsPaid = async (billId: number) => {
  try {
    console.log('🔍 Intentando marcar factura como pagada:', billId);
    await markBillAsPaid(billId, "Manual", `Pago-${billId}-${Date.now()}`);
    await loadData();
  } catch (error: any) {  
    if (error.message.includes('período actual')) {
      toast.error('No se puede marcar como pagada una factura del mes actual. Estará disponible el próximo mes.');
    } else if (error.message.includes('no encontrada')) {
      toast.error('La factura no fue encontrada. Puede haber sido eliminada.');
    } else if (error.message.includes('ya está pagada')) {
      toast.warning('Esta factura ya está marcada como pagada.');
    } else {
      toast.error(`Error al marcar como pagada: ${error.message}`);
    }
  }
};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Pagada</Badge>;
      case 'Pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'Generated':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><FileText className="h-3 w-3 mr-1" />Generada</Badge>;
      case 'Overdue':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Vencida</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getBillingPeriod = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleString('es-UY', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isLoading = billingLoading || pricingLoading;

  if (error && !stats && bills.length === 0) {
    return (
      <div className="p-6">
        <Alert className="max-w-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={loadData} className="mt-4" disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Facturación</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setShowGenerateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generar Factura
          </Button>
        </div>
      </div>

      {/* Estadísticas del mes actual - DATOS REALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tarjeta 1: Pólizas Este Mes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pólizas Este Mes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="text-2xl font-bold">{stats.totalPolizasThisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  Tier actual: {stats.applicableTierName}
                </p>
              </>
            ) : (
              <>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 2: Costo Estimado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats.estimatedCost)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.pricePerPoliza)} por póliza
                </p>
              </>
            ) : (
              <>
                <div className="h-8 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 3: Días Restantes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Días Restantes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="text-2xl font-bold">{stats.daysLeftInMonth}</div>
                <p className="text-xs text-muted-foreground">
                  Para cierre del mes
                </p>
              </>
            ) : (
              <>
                <div className="h-8 bg-gray-200 rounded w-12 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 4: Última Factura */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Factura</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="text-2xl font-bold">
                  {stats.lastBillingDate && 
                   stats.lastBillingDate !== '0001-01-01T00:00:00Z' && 
                   stats.lastBillingDate !== '1/1/1' 
                    ? formatDate(stats.lastBillingDate) 
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Generada automáticamente
                </p>
              </>
            ) : (
              <>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="facturas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="precios">Precios</TabsTrigger>
        </TabsList>

        <TabsContent value="facturas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Facturas</CardTitle>
            </CardHeader>
            <CardContent>
              {bills.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay facturas generadas aún
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold">
                              Factura #{bill.id.toString().padStart(6, '0')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {getBillingPeriod(bill.billingYear, bill.billingMonth)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">{bill.totalPolizasEscaneadas} pólizas</p>
                            <p className="text-xs text-muted-foreground">{bill.appliedTierName}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{formatCurrency(bill.totalAmount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(bill.pricePerPoliza)}/póliza
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Generada</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(bill.generatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(bill.status)}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewBill(bill.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPdf(bill.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="precios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tiers de Precios</CardTitle>
            </CardHeader>
            <CardContent>
              {tiers.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay tiers de precios configurados
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{tier.tierName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tier.minPolizas} - {tier.maxPolizas || '∞'} pólizas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{formatCurrency(tier.pricePerPoliza)}</p>
                          <p className="text-xs text-muted-foreground">por póliza</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    <BillDetailModal 
        billId={selectedBillId}
        isOpen={showDetailModal}
        onClose={() => {
            setShowDetailModal(false);
            setSelectedBillId(null);
        }}
        onBillUpdated={loadData}
        onDownloadPdf={handleDownloadPdf} 
        onMarkAsPaid={handleMarkAsPaid}    
    />

      <GenerateBillModal 
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onBillGenerated={loadData}
      />
    </div>
  );
}