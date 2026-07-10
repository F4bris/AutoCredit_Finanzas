import { User, Simulation } from "../types";
import { ArrowLeft, FileText, Download, TrendingUp, Info, HelpCircle, Calendar, CreditCard, PieChart, Car } from "lucide-react";

interface SimulationDetailProps {
  user: User | null;
  simulation: Simulation;
  onBack: () => void;
  onDelete?: (id: string) => void;
}

export default function SimulationDetail({ user, simulation, onBack, onDelete }: SimulationDetailProps) {
  const { name, vehicle, params, results, createdAt, clientName } = simulation;

  const currencySymbol = params.moneda === "PEN" ? "S/" : "US$";

  // Function to download CSV
  function handleDownloadCSV() {
    const headers = [
      "Cuota N°",
      "Fecha Vencimiento",
      "Saldo Inicial",
      "Interés",
      "Amortización",
      "Seguro Desgravamen",
      "Seguro Multirriesgo",
      "Comisión Periódica",
      "Cuota Base (PMT)",
      "Cuota Total",
      "Saldo Final",
    ];

    const rows = results.cronograma.map((item) => [
      item.numeroCuota,
      item.fechaVencimiento,
      item.saldoInicial.toFixed(2),
      item.interes.toFixed(2),
      item.amortizacion.toFixed(2),
      item.seguroDesgravamen.toFixed(2),
      item.seguroMultirriesgo.toFixed(2),
      item.comisionPeriodica.toFixed(2),
      item.cuotaBase.toFixed(2),
      item.cuotaTotal.toFixed(2),
      item.saldoFinal.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Amortizacion_${name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Beautiful SVG Chart calculation
  const maxInitialBalance = results.cronograma[0]?.saldoInicial || 1;
  const chartHeight = 120;
  const chartPoints = results.cronograma.map((item, idx) => {
    const x = (idx / (results.cronograma.length - 1)) * 100;
    const y = chartHeight - (item.saldoFinal / maxInitialBalance) * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-6" id="simulation-detail-panel">
      {/* Detail Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all border border-slate-200"
            id="btn-detail-back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded-full font-medium">
                Simulación Vehicular
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Registrado el {new Date(createdAt).toLocaleDateString("es-PE")}
              </span>
            </div>
            <h2 className="text-lg font-sans font-medium text-slate-900 mt-1">{name}</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Solicitante: <span className="text-slate-700 font-medium">{clientName}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-medium transition-all w-full sm:w-auto"
            id="btn-detail-csv"
          >
            <Download size={14} /> Exportar Excel/CSV
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(simulation.id)}
              className="inline-flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-medium transition-all w-full sm:w-auto"
              id="btn-detail-delete"
            >
              Eliminar Simulación
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="detail-bento-grid">
        
        {/* Card 1: Cuota Promedio */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Cuota Promedio Mensual
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-mono text-slate-500">{currencySymbol}</span>
            <span className="text-3xl font-sans font-medium text-slate-950">
              {results.cuotaTotalPromedio.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
            <Info size={10} /> Cuota base normal: {currencySymbol} {results.cuotaConstanteBase.toLocaleString("en-US")}
          </p>
        </div>

        {/* Card 2: Costo Financiero SBS (TCEA) */}
        <div className="bg-emerald-950 text-emerald-100 border border-emerald-900 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 p-4 opacity-5">
            <PieChart size={120} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider block">
            Costo Efectivo SBS (TCEA)
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-sans font-medium text-white">{results.tcea.toFixed(2)}%</span>
          </div>
          <p className="text-[10px] text-emerald-300 mt-2 flex items-center gap-1 font-mono">
            <TrendingUp size={10} /> TIR Anualizada de Flujos: {results.tir.toFixed(2)}%
          </p>
        </div>

        {/* Card 3: Valor Actual Neto (VAN) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Valor Actual Neto (VAN)
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-mono text-slate-500">{currencySymbol}</span>
            <span className={`text-3xl font-sans font-medium ${results.van >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {results.van.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
            <HelpCircle size={10} /> Evaluado con tasa COC de {params.tasaDescuento}%
          </p>
        </div>

        {/* Card 4: Total Amortizado vs Intereses */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Monto de Deuda Acumulada
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-mono text-slate-500">{currencySymbol}</span>
            <span className="text-3xl font-sans font-medium text-slate-950">
              {results.pagoTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
            <Calendar size={10} /> Interés + Seguros + Comisiones: {currencySymbol} {results.interesTotal.toLocaleString("en-US")}
          </p>
        </div>

      </div>

      {/* Detail Layout splits into: Left = Vehicle Info & Specs, Right = Debt curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Specs Panel */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Car size={16} className="text-indigo-400" /> Ficha del Vehículo & Crédito
            </h4>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Marca y Modelo:</span>
                <span className="text-white font-medium">{vehicle.marca} {vehicle.modelo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Año de Fab.:</span>
                <span className="text-white font-medium">{vehicle.anio}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Valor Comercial:</span>
                <span className="text-white font-mono font-medium">
                  {currencySymbol} {vehicle.precio.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Cuota Inicial:</span>
                <span className="text-white font-mono font-medium">
                  {params.cuotaInicialPct}% ({currencySymbol} {params.cuotaInicialMonto.toLocaleString("en-US")})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Cuota Balón (Final):</span>
                <span className="text-white font-mono font-medium">
                  {params.cuotaBalonPct}% ({currencySymbol} {params.cuotaBalonMonto.toLocaleString("en-US")})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Tasa Anual Aplicada:</span>
                <span className="text-white font-medium font-mono">{params.tasaAnual}% ({params.tipoTasa})</span>
              </div>
              {params.tipoTasa === "TNA" && (
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Capitalización:</span>
                  <span className="text-white font-medium font-mono uppercase">{params.capitalizacion}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Gracia Aplicada:</span>
                <span className={`font-medium px-1.5 py-0.5 rounded text-[10px] ${params.graciaTipo !== "Ninguno" ? "bg-amber-950/50 text-amber-200 border border-amber-900" : "bg-slate-800 text-slate-400"}`}>
                  {params.graciaTipo !== "Ninguno" ? `${params.graciaTipo} - ${params.graciaMeses} meses` : "Sin Gracia"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
            <h5 className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold mb-1">
              Indicador de Transparencia
            </h5>
            <p className="text-[11px] text-slate-400 leading-normal">
              La TCEA del <span className="text-white font-mono font-medium">{results.tcea.toFixed(2)}%</span> refleja fielmente todos los costos y seguros exigidos conforme a las normas SBS de Perú.
            </p>
          </div>
        </div>

        {/* Visual Chart Panel */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-sans font-medium text-slate-800 mb-3 flex items-center gap-1.5">
              <TrendingUp size={16} className="text-slate-400" />
              Evolución del Saldo de Deuda (Amortización)
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Curva de reducción de la deuda total desde la entrega de llaves hasta la liquidación final (incluyendo el pago de cuota balón).
            </p>
          </div>

          {/* SVG Vector Chart */}
          <div className="relative w-full h-32 bg-slate-50 rounded-xl border border-slate-100 flex items-end px-4 py-2 mt-2">
            <svg viewBox="0 0 100 120" preserveAspectRatio="none" className="w-full h-full">
              {/* Path of outstanding balance */}
              <polyline
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.5"
                points={chartPoints}
              />
            </svg>
            <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-400">
              Saldo Inicial: {currencySymbol} {results.cronograma[0]?.saldoInicial.toLocaleString()}
            </div>
            <div className="absolute bottom-2 right-3 text-[9px] font-mono text-slate-400">
              Saldo Final: {currencySymbol} 0.00
            </div>
          </div>

          <div className="flex gap-4 text-[10px] text-slate-500 font-mono mt-4 justify-center">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-900"></span> Saldo pendiente de liquidación
            </span>
          </div>
        </div>

      </div>

      {/* Main Amortization Schedule Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="detail-table-panel">
        <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-white border-b border-slate-850">
          <div>
            <h3 className="font-sans font-medium text-sm flex items-center gap-2">
              <FileText size={18} className="text-slate-400" />
              Cronograma Oficial de Pagos (Método Francés Vencido)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulación de {results.cronograma.length} cuotas periódicas de 30 días calculadas en base comercial de 360 días.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded-md">
            Moneda: {params.moneda}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="detail-amort-table">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4 text-center">N°</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4 text-right">Saldo Inicial</th>
                <th className="py-3 px-4 text-right">Interés</th>
                <th className="py-3 px-4 text-right">Amortización</th>
                <th className="py-3 px-4 text-right">Seg. Desgrav.</th>
                <th className="py-3 px-4 text-right">Seg. Vehic.</th>
                <th className="py-3 px-4 text-right">Comisión</th>
                <th className="py-3 px-4 text-right bg-slate-100/50 text-slate-800 font-semibold">Cuota Total</th>
                <th className="py-3 px-4 text-right">Saldo Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono text-slate-700">
              {results.cronograma.map((item) => {
                const isGrace = params.graciaTipo !== "Ninguno" && item.numeroCuota <= params.graciaMeses;
                return (
                  <tr
                    key={item.numeroCuota}
                    className={`hover:bg-slate-50/40 transition-all ${
                      isGrace ? "bg-amber-50/10 text-slate-600" : ""
                    }`}
                    id={`row-${item.numeroCuota}`}
                  >
                    <td className="px-4 py-3 text-center font-medium text-slate-400">{item.numeroCuota}</td>
                    <td className="px-4 py-3">{new Date(item.fechaVencimiento).toLocaleDateString("es-PE")}</td>
                    <td className="px-4 py-3 text-right">
                      {currencySymbol} {item.saldoInicial.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {currencySymbol} {item.interes.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {currencySymbol} {item.amortizacion.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {currencySymbol} {item.seguroDesgravamen.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {currencySymbol} {item.seguroMultirriesgo.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {currencySymbol} {item.comisionPeriodica.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right bg-slate-50 font-bold text-slate-900 border-l border-r border-slate-100">
                      {currencySymbol} {item.cuotaTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      {isGrace && (
                        <span className="block text-[8px] text-amber-600 uppercase font-mono mt-0.5">
                          Gracia {params.graciaTipo}
                        </span>
                      )}
                      {item.numeroCuota === results.cronograma.length && params.cuotaBalonMonto > 0 && (
                        <span className="block text-[8px] text-indigo-600 uppercase font-mono mt-0.5">
                          Balón incluido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {currencySymbol} {item.saldoFinal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
