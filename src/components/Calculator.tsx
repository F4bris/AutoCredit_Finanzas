import React, { useState, useEffect, FormEvent } from "react";
import { User, Client, Simulation, VehicleOffer } from "../types";
import { Car, DollarSign, Calendar, Percent, ShieldCheck, HelpCircle, Save, Trash2, ArrowRight } from "lucide-react";

interface CalculatorProps {
  user: User | null;
  onSimulationCreated: (sim: Simulation) => void;
  preselectedClient: Client | null;
}

export default function Calculator({ user, onSimulationCreated, preselectedClient }: CalculatorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [offers, setOffers] = useState<VehicleOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Vehicle Info
  const [marca, setMarca] = useState("Toyota");
  const [modelo, setModelo] = useState("Corolla");
  const [anio, setAnio] = useState("2026");
  const [precio, setPrecio] = useState(85000);

  // 2. Loan Parameters
  const [name, setName] = useState("Simulación Toyota Corolla");
  const [moneda, setMoneda] = useState<"PEN" | "USD">("PEN");
  const [cuotaInicialPct, setCuotaInicialPct] = useState(20); // 20%
  const [cuotaInicialMonto, setCuotaInicialMonto] = useState(17000);
  const [cuotaBalonPct, setCuotaBalonPct] = useState(30); // 30% balloon
  const [cuotaBalonMonto, setCuotaBalonMonto] = useState(25500);
  const [capitalFinanciar, setCapitalFinanciar] = useState(42500); // 85000 - 17000 - 25500
  const [plazoMeses, setPlazoMeses] = useState(48);
  const [frecuenciaPago, setFrecuenciaPago] = useState<"mensual" | "trimestral" | "semestral">("mensual");
  const [tipoTasa, setTipoTasa] = useState<"TEA" | "TNA">("TEA");
  const [tasaAnual, setTasaAnual] = useState(18); // 18%
  const [capitalizacion, setCapitalizacion] = useState("diaria");

  // 3. Grace Periods
  const [graciaTipo, setGraciaTipo] = useState<"Ninguno" | "Total" | "Parcial">("Ninguno");
  const [graciaMeses, setGraciaMeses] = useState(0);

  // 4. Additional Costs
  const [seguroDesgravamenPct, setSeguroDesgravamenPct] = useState(0.032);
  const [seguroMultirriesgo, setSeguroMultirriesgo] = useState(80);
  const [comisionInicial, setComisionInicial] = useState(500);
  const [comisionPeriodica, setComisionPeriodica] = useState(15);
  const [comisionFinal, setComisionFinal] = useState(0);
  const [fechaDesembolso, setFechaDesembolso] = useState(new Date().toISOString().split("T")[0]);
  const [tasaDescuento, setTasaDescuento] = useState(12); // e.g. 12% COC

  // Load clients
  useEffect(() => {
    if (user) {
      fetchClients();
      fetchOffers();
    }
  }, [user]);

  // Handle preselected client from other panels
  useEffect(() => {
    if (preselectedClient) {
      setSelectedClientId(preselectedClient.id);
    }
  }, [preselectedClient]);

  // Sync cuota inicial and cuota balon when price or percentages change
  useEffect(() => {
    const ciMonto = parseFloat(((precio * cuotaInicialPct) / 100).toFixed(2));
    setCuotaInicialMonto(ciMonto);

    const cbMonto = parseFloat(((precio * cuotaBalonPct) / 100).toFixed(2));
    setCuotaBalonMonto(cbMonto);

    const cap = parseFloat((precio - ciMonto - cbMonto).toFixed(2));
    setCapitalFinanciar(cap);
  }, [precio, cuotaInicialPct, cuotaBalonPct]);

  async function fetchClients() {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/clients", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        if (data.length > 0 && !selectedClientId) {
          setSelectedClientId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading clients", err);
    }
  }

  async function fetchOffers() {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/offers", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (err) {
      console.error("Error loading vehicle offers", err);
    }
  }

  function handleSelectOffer(offerId: string) {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;
    setModelo(offer.modelo);
    setPrecio(offer.precio);
    setName(`Simulación ${offer.modelo}`);
  }

  function handlePctChange(type: "inicial" | "balon", pctVal: number) {
    if (pctVal < 0 || pctVal > 100) return;
    if (type === "inicial") {
      setCuotaInicialPct(pctVal);
    } else {
      setCuotaBalonPct(pctVal);
    }
  }

  function handleMontoChange(type: "inicial" | "balon", montoVal: number) {
    if (montoVal < 0 || montoVal > precio) return;
    const pct = parseFloat(((montoVal / precio) * 100).toFixed(2));
    if (type === "inicial") {
      setCuotaInicialMonto(montoVal);
      setCuotaInicialPct(pct);
    } else {
      setCuotaBalonMonto(montoVal);
      setCuotaBalonPct(pct);
    }
  }

  function handleClear() {
    setMarca("Toyota");
    setModelo("Corolla");
    setAnio("2026");
    setPrecio(85000);
    setMoneda("PEN");
    setCuotaInicialPct(20);
    setCuotaBalonPct(30);
    setPlazoMeses(48);
    setFrecuenciaPago("mensual");
    setTipoTasa("TEA");
    setTasaAnual(18);
    setGraciaTipo("Ninguno");
    setGraciaMeses(0);
    setSeguroDesgravamenPct(0.032);
    setSeguroMultirriesgo(80);
    setComisionInicial(500);
    setComisionPeriodica(15);
    setTasaDescuento(12);
    setError(null);
  }

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!selectedClientId) {
      setError("Por favor, selecciona un cliente para guardar la simulación.");
      return;
    }

    // Basic checks
    if (graciaTipo !== "Ninguno" && graciaMeses <= 0) {
      setError("Si seleccionas periodo de gracia, debes definir al menos 1 mes.");
      return;
    }
    if (graciaMeses >= plazoMeses) {
      setError("Los meses de gracia no pueden ser mayores o iguales al plazo total del crédito.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name,
      clientId: selectedClientId,
      vehicle: {
        marca,
        modelo,
        anio,
        precio,
      },
      params: {
        montoCredito: precio - cuotaInicialMonto,
        cuotaInicialPct,
        cuotaInicialMonto,
        cuotaBalonPct,
        cuotaBalonMonto,
        capitalFinanciar,
        moneda,
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
        comisionFinal,
        fechaDesembolso,
        tasaDescuento,
        plazoMeses,
      },
    };

    try {
      const res = await fetch("/api/v1/loans/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al procesar el crédito.");
      }

      onSimulationCreated(data);
    } catch (err: any) {
      setError(err.message || "Error al calcular el cronograma.");
    } finally {
      setLoading(false);
    }
  }

  const currencySymbol = moneda === "PEN" ? "S/" : "US$";

  return (
    <form onSubmit={handleSimulate} className="space-y-6" id="calculator-form">
      {/* Client Selector Row */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Asociar Cliente *
          </label>
          {clients.length > 0 ? (
            <select
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              id="calc-client-select"
            >
              <option value="">-- Selecciona un Cliente --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombres} {c.apellidos} - DNI {c.dni}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-red-500 font-mono py-1">
              No tienes clientes registrados. Debes registrar al menos uno en el panel de Clientes.
            </div>
          )}
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
          {offers.length > 0 && (
            <div className="w-full sm:w-56">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Modelo (Oferta Vehicular)
              </label>
              <select
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-sans text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                value={offers.some((o) => o.modelo === modelo) ? offers.find((o) => o.modelo === modelo)!.id : ""}
                onChange={(e) => handleSelectOffer(e.target.value)}
                id="calc-sim-model-select"
              >
                <option value="" disabled>
                  -- Selecciona un modelo --
                </option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.modelo}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Nombre Simulación
            </label>
            <input
              type="text"
              required
              placeholder="Simulación Toyota Plan 48"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id="calc-sim-name"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-sans" id="calc-error-alert">
          {error}
        </div>
      )}

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: Vehículo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="calc-vehicle-sec">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
            <Car size={18} className="text-slate-500" />
            <h3 className="font-sans font-medium text-sm text-slate-800">1. Información del Vehículo</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  id="calc-vehicle-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Modelo
                </label>
                {offers.length > 0 ? (
                  <select
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    value={offers.some((o) => o.modelo === modelo) ? offers.find((o) => o.modelo === modelo)!.id : ""}
                    onChange={(e) => handleSelectOffer(e.target.value)}
                    id="calc-vehicle-model"
                  >
                    <option value="" disabled>
                      -- Selecciona un modelo --
                    </option>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.modelo} ({currencySymbol} {o.precio.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      id="calc-vehicle-model"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Registra modelos en "Oferta Vehicular" para elegirlos aquí desde una lista.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Año fabricación
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  id="calc-vehicle-year"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Valor Comercial
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-mono text-xs">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    required
                    min={1000}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                    value={precio}
                    onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                    id="calc-vehicle-price"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Parámetros del Crédito */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="calc-parameters-sec">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
            <Percent size={18} className="text-slate-500" />
            <h3 className="font-sans font-medium text-sm text-slate-800">2. Parámetros del Crédito</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Moneda
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as any)}
                  id="calc-loan-currency"
                >
                  <option value="PEN">Soles (PEN)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Frecuencia de Pago
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  value={frecuenciaPago}
                  onChange={(e) => setFrecuenciaPago(e.target.value as any)}
                  id="calc-loan-frequency"
                >
                  <option value="mensual">Mensual (30 días)</option>
                  <option value="trimestral">Trimestral (90 días)</option>
                  <option value="semestral">Semestral (180 días)</option>
                </select>
              </div>
            </div>

            {/* Sync Row: Cuota Inicial */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                  Cuota Inicial (%)
                </label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                  value={cuotaInicialPct}
                  onChange={(e) => handlePctChange("inicial", parseFloat(e.target.value) || 0)}
                  id="calc-ci-pct"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                  Cuota Inicial ({currencySymbol})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                  value={cuotaInicialMonto}
                  onChange={(e) => handleMontoChange("inicial", parseFloat(e.target.value) || 0)}
                  id="calc-ci-monto"
                />
              </div>
            </div>

            {/* Sync Row: Cuota Balón */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                  Cuota Balón (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                  value={cuotaBalonPct}
                  onChange={(e) => handlePctChange("balon", parseFloat(e.target.value) || 0)}
                  id="calc-cb-pct"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
                  Cuota Balón ({currencySymbol})
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                  value={cuotaBalonMonto}
                  onChange={(e) => handleMontoChange("balon", parseFloat(e.target.value) || 0)}
                  id="calc-cb-monto"
                />
              </div>
            </div>

            {/* Amortizable balance summary display */}
            <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-100 pt-3">
              <span className="text-slate-400 font-sans">Capital Neto a Financiar:</span>
              <span className="font-mono font-medium text-slate-800">
                {currencySymbol} {capitalFinanciar.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Plazo (Cuotas)
                </label>
                <input
                  type="number"
                  required
                  min={12}
                  max={120}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                  value={plazoMeses}
                  onChange={(e) => setPlazoMeses(parseInt(e.target.value) || 24)}
                  id="calc-loan-term"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Tipo de Tasa
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  value={tipoTasa}
                  onChange={(e) => setTipoTasa(e.target.value as any)}
                  id="calc-loan-ratetype"
                >
                  <option value="TEA">TEA (Efectiva Anual)</option>
                  <option value="TNA">TNA (Nominal Anual)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Valor Tasa de Interés (%)
                </label>
                <input
                  type="number"
                  required
                  step={0.01}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                  value={tasaAnual}
                  onChange={(e) => setTasaAnual(parseFloat(e.target.value) || 0)}
                  id="calc-loan-rateval"
                />
              </div>
              {tipoTasa === "TNA" && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Frecuencia Capitalización
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                    value={capitalizacion}
                    onChange={(e) => setCapitalizacion(e.target.value)}
                    id="calc-capitalizacion-select"
                  >
                    <option value="diaria">Diaria</option>
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option style={{ display: 'none' }} value="semestral">Semestral</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Grace Periods */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="calculator-grace-panel">
          <h2 className="text-sm font-sans font-medium text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
            <Calendar size={18} className="text-slate-400" />
            Periodos de Gracia
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Tipo de Gracia
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                value={graciaTipo}
                onChange={(e) => {
                  setGraciaTipo(e.target.value as any);
                  if (e.target.value === "Ninguno") setGraciaMeses(0);
                }}
                id="calc-grace-type"
              >
                <option value="Ninguno">Sin Gracia (Método Francés Normal)</option>
                <option value="Total">Gracia Total (Capitalización de Interés)</option>
                <option value="Parcial">Gracia Parcial (Interés únicamente)</option>
              </select>
            </div>
            {graciaTipo !== "Ninguno" && (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Duración de la Gracia (Meses)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={24}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                  value={graciaMeses}
                  onChange={(e) => setGraciaMeses(parseInt(e.target.value) || 0)}
                  id="calc-grace-months"
                />
              </div>
            )}
          </div>
        </div>

        {/* 4. Costs and Extra params */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="calculator-costs-panel">
          <h2 className="text-sm font-sans font-medium text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
            <ShieldCheck size={18} className="text-slate-400" />
            Gastos Adicionales e Indicadores
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Seguro Desgravamen (% mensual)
              </label>
              <input
                type="number"
                step={0.0001}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                value={seguroDesgravamenPct}
                onChange={(e) => setSeguroDesgravamenPct(parseFloat(e.target.value) || 0)}
                id="calc-cost-desgrav"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Seguro Vehicular ({currencySymbol} fijo mensual)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                value={seguroMultirriesgo}
                onChange={(e) => setSeguroMultirriesgo(parseFloat(e.target.value) || 0)}
                id="calc-cost-vehicle-insurance"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Comisión Inicial ({currencySymbol} desembolso)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                value={comisionInicial}
                onChange={(e) => setComisionInicial(parseFloat(e.target.value) || 0)}
                id="calc-cost-com-initial"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Comisión Periódica ({currencySymbol} mensual)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                value={comisionPeriodica}
                onChange={(e) => setComisionPeriodica(parseFloat(e.target.value) || 0)}
                id="calc-cost-com-periodic"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Tasa de Descuento (Anual %)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                value={tasaDescuento}
                onChange={(e) => setTasaDescuento(parseFloat(e.target.value) || 8)}
                id="calc-discount-rate"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Fecha de Desembolso
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                value={fechaDesembolso}
                onChange={(e) => setFechaDesembolso(e.target.value)}
                id="calc-disburse-date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Button Row */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleClear}
          className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-medium transition-all"
          id="btn-calc-clear"
        >
          Limpiar Campos
        </button>
        <button
          type="submit"
          disabled={loading || !selectedClientId}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl text-xs font-medium transition-all shadow-sm"
          id="btn-calc-submit"
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Calcular Cronograma <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
