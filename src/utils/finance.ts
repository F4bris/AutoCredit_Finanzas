/**
 * Financial calculation utilities for vehicular credit (Compra Inteligente).
 */

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

export interface SimulationParams {
  montoCredito: number; // Principal to finance before balloon
  cuotaInicialPct: number;
  cuotaInicialMonto: number;
  cuotaBalonPct: number;
  cuotaBalonMonto: number;
  capitalFinanciar: number; // total amount to finance (Price - Initial - Balloon)
  moneda: "PEN" | "USD";
  tipoTasa: "TEA" | "TNA";
  tasaAnual: number; // e.g. 18 for 18%
  frecuenciaPago: "mensual" | "trimestral" | "semestral";
  capitalizacion?: string; // "diaria" | "mensual" | "trimestral" | "semestral"
  graciaTipo: "Ninguno" | "Total" | "Parcial";
  graciaMeses: number;
  seguroDesgravamenPct: number; // e.g. 0.032 for 0.032%
  seguroMultirriesgo: number; // e.g. 60
  comisionInicial: number; // e.g. 800
  comisionPeriodica: number; // e.g. 15
  comisionFinal: number;
  fechaDesembolso: string; // ISO string or YYYY-MM-DD
  tasaDescuento: number; // r_anual e.g. 8 for 8%
  plazoMeses: number; // total installments (e.g. 48)
  precioVehiculo: number;
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

/**
 * Converts a date by adding months.
 */
export function addMonths(dateStr: string, monthsStr: number): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) {
    return dateStr;
  }
  d.setMonth(d.getMonth() + monthsStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Solves for IRR (Internal Rate of Return) of given cash flows.
 */
export function calculateIRR(flows: number[]): number {
  let r = 0.01; // initial guess (1% per period)
  const maxIterations = 200;
  const precision = 1e-8;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;
    for (let t = 0; t < flows.length; t++) {
      npv += flows[t] / Math.pow(1 + r, t);
      if (t > 0) {
        dNpv -= t * flows[t] / Math.pow(1 + r, t + 1);
      }
    }

    if (Math.abs(dNpv) < 1e-12) {
      break;
    }

    const nextR = r - npv / dNpv;
    if (Math.abs(nextR - r) < precision) {
      return nextR;
    }
    // Safeguard from exploding guess
    if (isNaN(nextR) || !isFinite(nextR) || nextR > 2.0 || nextR < -0.99) {
      // try bisecting fallback
      break;
    }
    r = nextR;
  }

  // Fallback bisection method if Newton fails
  let low = -0.99;
  let high = 2.0;
  for (let i = 0; i < 100; i++) {
    r = (low + high) / 2;
    let npv = 0;
    for (let t = 0; t < flows.length; t++) {
      npv += flows[t] / Math.pow(1 + r, t);
    }
    if (Math.abs(npv) < 1e-7) {
      return r;
    }
    if (npv > 0) {
      low = r;
    } else {
      high = r;
    }
  }

  return r;
}

/**
 * Simulates a vehicular credit amortization under Compra Inteligente modal.
 */
export function runSimulation(params: SimulationParams): SimulationResults {
  const {
    precioVehiculo,
    cuotaInicialMonto,
    cuotaBalonMonto,
    tipoTasa,
    tasaAnual,
    frecuenciaPago,
    capitalizacion,
    graciaTipo,
    graciaMeses,
    seguroDesgravamenPct,
    seguroMultirriesgo,
    comisionInicial,
    comisionPeriodica,
    fechaDesembolso,
    tasaDescuento,
    plazoMeses,
  } = params;

  // 1. Determine periods per year (m) and period days
  let m = 12; // periods per year
  let periodDays = 30;
  if (frecuenciaPago === "trimestral") {
    m = 4;
    periodDays = 90;
  } else if (frecuenciaPago === "semestral") {
    m = 2;
    periodDays = 180;
  }

  // 2. Interest rate conversion (Tasa Efectiva Periódica - i)
  const ratePct = tasaAnual / 100;
  let iPeriodic = 0;

  if (tipoTasa === "TEA") {
    // i = (1 + TEA)^(dias_periodo / 360) - 1
    iPeriodic = Math.pow(1 + ratePct, periodDays / 360) - 1;
  } else {
    // TNA
    let capFreq = 360; // default daily
    if (capitalizacion === "mensual") capFreq = 12;
    else if (capitalizacion === "trimestral") capFreq = 4;
    else if (capitalizacion === "semestral") capFreq = 2;

    // i = (1 + TNA / capFreq)^(periodDays / (360/capFreq)) - 1
    iPeriodic = Math.pow(1 + ratePct / capFreq, periodDays / (360 / capFreq)) - 1;
  }

  // Periodic discount rate
  const discPct = tasaDescuento / 100;
  const rPeriodic = Math.pow(1 + discPct, periodDays / 360) - 1;

  // 3. Initialize balances
  // The financed principal is split into amortizable and balloon parts
  let saldoAmortizable = precioVehiculo - cuotaInicialMonto - cuotaBalonMonto;
  const constantBalloon = cuotaBalonMonto;

  const cronograma: AmortizationInstallment[] = [];
  const N = plazoMeses;

  // Let's iterate month by month to construct the schedule
  let currentAmortBalance = saldoAmortizable;

  for (let t = 1; t <= N; t++) {
    const isGracePeriod = t <= graciaMeses && graciaTipo !== "Ninguno";
    const graceMode = isGracePeriod ? graciaTipo : "Ninguno";

    // Date
    const fechaVenc = addMonths(fechaDesembolso, t);

    // Initial balances of the period
    const startAmortBalance = currentAmortBalance;

    // 1. Interest calculation
    // Interest is calculated on the outstanding amortizable balance AND the balloon part (which is financed)
    const interestAmort = startAmortBalance * iPeriodic;
    const interestBalloon = constantBalloon * iPeriodic;
    const totalInterest = interestAmort + interestBalloon;

    // 2. Base payment (PMT) & Amortization
    let basePMT = 0;
    let amortization = 0;

    if (graceMode === "Total") {
      // Total grace: no payment, interests capitalize
      basePMT = 0;
      amortization = 0;
      currentAmortBalance = startAmortBalance + interestAmort; // capitalizes amortizable interest
      // Note: the balloon interest also capitalizes onto the amortizable balance or onto the balloon balance.
      // Usually, all capitalized interest goes into the outstanding balance.
      currentAmortBalance += interestBalloon;
    } else if (graceMode === "Parcial") {
      // Partial grace: pay interest only, no amortization
      basePMT = totalInterest;
      amortization = 0;
      currentAmortBalance = startAmortBalance; // constant
    } else {
      // Normal amortization
      // Remaining periods to amortize
      const remainingPeriods = N - Math.max(t - 1, graciaMeses);
      
      // French PMT for remaining balance
      const pmtAmortBase = (startAmortBalance * iPeriodic) / (1 - Math.pow(1 + iPeriodic, -remainingPeriods));
      
      // Balloon interest is paid periodicially
      basePMT = pmtAmortBase + interestBalloon;
      amortization = pmtAmortBase - interestAmort;
      currentAmortBalance = startAmortBalance - amortization;
    }

    // 3. Extra expenses
    // Insurance is usually calculated as a percentage of the total active debt at start of period
    const totalActiveDebt = startAmortBalance + constantBalloon;
    const segDesgrav = totalActiveDebt * (seguroDesgravamenPct / 100);
    const segMulti = seguroMultirriesgo;
    const comPer = comisionPeriodica;

    // Total cuota
    let cuotaTotal = basePMT + segDesgrav + segMulti + comPer;

    // At the very last period, add the balloon payment if applicable
    if (t === N && constantBalloon > 0) {
      cuotaTotal += constantBalloon;
    }

    cronograma.push({
      numeroCuota: t,
      fechaVencimiento: fechaVenc,
      saldoInicial: startAmortBalance + constantBalloon,
      interes: totalInterest,
      amortizacion: amortization,
      seguroDesgravamen: segDesgrav,
      seguroMultirriesgo: segMulti,
      comisionPeriodica: comPer,
      cuotaBase: basePMT,
      cuotaTotal: parseFloat(cuotaTotal.toFixed(2)),
      saldoFinal: parseFloat((currentAmortBalance + (t === N ? 0 : constantBalloon)).toFixed(2)),
    });
  }

  // 4. Client Cash Flows
  // t=0: + (disbursed capital) = V_v - CI - comisionInicial
  const disbursedCapital = precioVehiculo - cuotaInicialMonto;
  const flows: number[] = [disbursedCapital - comisionInicial];

  for (let t = 1; t <= N; t++) {
    // Flow is negative (client payment)
    flows.push(-cronograma[t - 1].cuotaTotal);
  }

  // 5. Financial Indicators
  const tirPeriodic = calculateIRR(flows);
  const tceaAnnual = Math.pow(1 + tirPeriodic, m) - 1;

  // Interest total: Sum of all interests in schedule
  const interestTotal = cronograma.reduce((acc, curr) => acc + curr.interes, 0);

  // Total paid: sum of all installments + initial commission
  const pagoTotal = cronograma.reduce((acc, curr) => acc + curr.cuotaTotal, 0) + comisionInicial;

  // NPV (VAN): sum( F_t / (1 + rPeriodic)^t )
  let van = 0;
  for (let t = 0; t < flows.length; t++) {
    van += flows[t] / Math.pow(1 + rPeriodic, t);
  }

  // Average total installment
  const cuotaTotalPromedio = cronograma.reduce((acc, curr) => acc + curr.cuotaTotal, 0) / N;

  // Cuota constante base (when no grace applies, just for display)
  const baseAmortForPmt = precioVehiculo - cuotaInicialMonto - cuotaBalonMonto;
  const standardPMT = (baseAmortForPmt * iPeriodic) / (1 - Math.pow(1 + iPeriodic, -N)) + constantBalloon * iPeriodic;

  return {
    cuotaConstanteBase: parseFloat(standardPMT.toFixed(2)),
    cuotaTotalPromedio: parseFloat(cuotaTotalPromedio.toFixed(2)),
    interesTotal: parseFloat(interestTotal.toFixed(2)),
    pagoTotal: parseFloat(pagoTotal.toFixed(2)),
    van: parseFloat(van.toFixed(2)),
    tir: parseFloat((tirPeriodic * 100).toFixed(4)),
    tcea: parseFloat((tceaAnnual * 100).toFixed(4)),
    cronograma,
    flujoCaja: flows.map((f, idx) => ({ periodo: idx, monto: parseFloat(f.toFixed(2)) })),
  };
}
