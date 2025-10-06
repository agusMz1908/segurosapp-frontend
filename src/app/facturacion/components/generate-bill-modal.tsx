"use client"

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Building,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useBilling } from '../../../hooks/use-billing';
import { toast } from 'sonner';

interface GenerateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillGenerated?: () => void;
}

export function GenerateBillModal({
  isOpen,
  onClose,
  onBillGenerated
}: GenerateBillModalProps) {
  const { generateMonthlyBill, loading } = useBilling();
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    companyName: '',
    companyAddress: '',
    companyRUC: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        companyName: '',
        companyAddress: '',
        companyRUC: ''
      });
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    }

    if (!formData.year || formData.year < 2020 || formData.year > currentYear) {
      newErrors.year = 'Año inválido';
    }

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Mes inválido';
    }

    // Validar que no sea un mes futuro
    const selectedDate = new Date(formData.year, formData.month - 1);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    if (selectedDate >= currentDate) {
      newErrors.period = 'No se puede generar factura para el mes actual o futuro';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await generateMonthlyBill(
        formData.year,
        formData.month,
        formData.companyName,
        formData.companyAddress || undefined,
        formData.companyRUC || undefined
      );
      
      onBillGenerated?.();
      handleClose();
    } catch (error: any) {
      console.error('Error generating bill:', error);
      // El error ya se muestra en el hook con toast
    }
  };

  const getPeriodText = () => {
    if (formData.year && formData.month) {
      const monthName = months.find(m => m.value === formData.month)?.label;
      return `${monthName} ${formData.year}`;
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generar Factura Mensual
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del período */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Período de Facturación</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Año *</Label>
                <Select 
                  value={formData.year.toString()} 
                  onValueChange={(value) => setFormData({...formData, year: parseInt(value)})}
                >
                  <SelectTrigger id="year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.year && (
                  <p className="text-sm text-red-600 mt-1">{errors.year}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="month">Mes *</Label>
                <Select 
                  value={formData.month.toString()} 
                  onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}
                >
                  <SelectTrigger id="month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.month && (
                  <p className="text-sm text-red-600 mt-1">{errors.month}</p>
                )}
              </div>
            </div>

            {errors.period && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.period}</AlertDescription>
              </Alert>
            )}

            {getPeriodText() && !errors.period && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Se generará la factura para el período: <strong>{getPeriodText()}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Información de la empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Información de la Empresa</h3>
            </div>
            
            <div>
              <Label htmlFor="companyName">Nombre de la Empresa *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                placeholder="Ingrese el nombre de la empresa"
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="companyAddress">Dirección</Label>
              <Textarea
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
                placeholder="Dirección de la empresa (opcional)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="companyRUC">RUC</Label>
              <Input
                id="companyRUC"
                value={formData.companyRUC}
                onChange={(e) => setFormData({...formData, companyRUC: e.target.value})}
                placeholder="RUC de la empresa (opcional)"
              />
            </div>
          </div>

          {/* Nota informativa */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Se incluirán automáticamente todas las pólizas escaneadas exitosamente 
              durante el período seleccionado que aún no hayan sido facturadas.
            </AlertDescription>
          </Alert>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={loading || Object.keys(errors).length > 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generar Factura
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}