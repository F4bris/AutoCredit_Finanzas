export interface User {
  id: string;
  fullName: string;
  email: string;
  token: string;
}

export interface Client {
  id: string;
  userId: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correo: string;
  empleador?: string;
  ingresoMensual?: number;
  createdAt: string;
}

export interface Vehicle {
  marca: string;
  modelo: string;
  anio: string;
  precio: number;
}

export interface VehicleOffer {
  id: string;
  userId: string;
  modelo: string;
  precio: number;
  createdAt: string;
}

export interface SimulationParams {
  montoCredito: number;
  cuotaInicialPct: number;
  cuotaInicialMonto: number;
  cuotaBalonPct: number;
  cuotaBalonMonto: number;
  capitalFinanciar: number;
  moneda: "PEN" | "USD";
  tipoTasa: "TEA" | "TNA";
  tasaAnual: number;
  frecuenciaPago: "mensual" | "trimestral" | "semestral";
  capitalizacion?: string;
  graciaTipo: "Ninguno" | "Total" | "Parcial";
  graciaMeses: number;
  seguroDesgravamenPct: number;
  seguroMultirriesgo: number;
  comisionInicial: number;
  comisionPeriodica: number;
  comisionFinal: number;
  fechaDesembolso: string;
  tasaDescuento: number;
  plazoMeses: number;
  precioVehiculo: number;
}

export interface AmortizationInstallment {
  numeroCuota: number;
  fechaVencimiento: string;
  saldoInicial: number;
  interes: number;
  amortizacion: number;
  seguroDesgravamen: number;
  seguroMultirriesgo: number;
  comisionPeriodica: number;
  cuotaBase: number;
  cuotaTotal: number;
  saldoFinal: number;
}

export interface SimulationResults {
  cuotaConstanteBase: number;
  cuotaTotalPromedio: number;
  interesTotal: number;
  pagoTotal: number;
  van: number;
  tir: number;
  tcea: number;
  cronograma: AmortizationInstallment[];
  flujoCaja: { periodo: number; monto: number }[];
}

export interface Simulation {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  name: string;
  vehicle: Vehicle;
  params: SimulationParams;
  results: SimulationResults;
  createdAt: string;
}
