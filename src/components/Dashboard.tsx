import { User, Simulation } from "../types";
import { Plus, Users, Calculator, FileText, CheckSquare, Sparkles, TrendingUp, Calendar, ArrowRight, DollarSign } from "lucide-react";

interface DashboardProps {
  user: User | null;
  simulations: Simulation[];
  clientsCount: number;
  onNavigate: (tab: string) => void;
  onSelectSimulation: (sim: Simulation) => void;
}

export default function Dashboard({ user, simulations, clientsCount, onNavigate, onSelectSimulation }: DashboardProps) {
  
  // Calculate aggregate stats
  const totalSimulations = simulations.length;
  const recentSimulations = simulations.slice(-4).reverse(); // last 4 simulations

  // Calculate some average rates or totals if simulations exist
  const avgTcea = totalSimulations > 0 
    ? simulations.reduce((acc, curr) => acc + curr.results.tcea, 0) / totalSimulations 
    : 0;

  const totalValueFinanced = totalSimulations > 0
    ? simulations.reduce((acc, curr) => acc + curr.params.capitalFinanciar, 0)
    : 0;

  // Static checklist matching the PDF mockup
  const checklist = [
    { text: "Registrar datos del Cliente", completed: clientsCount > 0 },
    { text: "Definir valor comercial del vehículo", completed: totalSimulations > 0 },
    { text: "Ajustar cuota inicial y cuota balón", completed: totalSimulations > 0 },
    { text: "Establecer tasa de interés (TEA/TNA)", completed: totalSimulations > 0 },
    { text: "Configurar periodos de gracia (total o parcial)", completed: totalSimulations > 0 },
    { text: "Generar cronograma de pagos oficial", completed: totalSimulations > 0 }
  ];

  const completedSteps = checklist.filter(item => item.completed).length;

  return (
    <div className="space-y-6" id="dashboard-panel">
      {/* Welcome Hero Card */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-slate-800 shadow-md">
        <div className="absolute right-0 top-0 translate-y-1/4 translate-x-1/4 p-12 opacity-5 pointer-events-none">
          <Sparkles size={240} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-slate-300 mb-4">
            <Sparkles size={14} className="text-amber-400 animate-pulse" /> Inteligencia Financiera Vehicular
          </span>
          <h1 className="text-3xl md:text-4xl font-sans font-medium tracking-tight text-white mb-3">
            ¡Hola, {user?.fullName || "Operador"}!
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Bienvenido al portal de simulación de <strong>Compra Inteligente de AutoCredit Perú</strong>. Genera cronogramas bajo el método francés de amortización con extrema precisión matemática y conformidad total con las regulaciones de transparencia de la SBS.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("calculadora")}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
              id="btn-hero-new-sim"
            >
              Nueva Simulación <Plus size={16} />
            </button>
            <button
              onClick={() => onNavigate("clientes")}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition-all"
              id="btn-hero-clients"
            >
              Ver Directorio de Clientes
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Simulaciones Creadas
            </span>
            <FileText size={18} className="text-slate-400" />
          </div>
          <div className="text-3xl font-sans font-medium text-slate-950 mt-3">{totalSimulations}</div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Simulaciones guardadas por tu usuario</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Clientes Registrados
            </span>
            <Users size={18} className="text-slate-400" />
          </div>
          <div className="text-3xl font-sans font-medium text-slate-950 mt-3">{clientsCount}</div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Clientes activos en tu directorio</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              TCEA Promedio
            </span>
            <TrendingUp size={18} className="text-slate-400" />
          </div>
          <div className="text-3xl font-sans font-medium text-slate-950 mt-3">{avgTcea.toFixed(2)}%</div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Costo financiero efectivo promedio</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Financiado Total
            </span>
            <DollarSign size={18} className="text-slate-400" />
          </div>
          <div className="text-3xl font-sans font-medium text-slate-950 mt-3">
            S/ {totalValueFinanced.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">Volumen neto simulado (Soles equiv.)</p>
        </div>
      </div>

      {/* Row: Recent Simulations & Checklist split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Recent Simulations List */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-4">
            <h3 className="font-sans font-medium text-sm text-slate-900 flex items-center gap-2">
              <Calculator size={18} className="text-slate-500" />
              Simulaciones Recientes
            </h3>
            <button
              onClick={() => onNavigate("simulaciones")}
              className="text-xs text-slate-500 hover:text-slate-950 hover:underline flex items-center gap-1 font-medium"
              id="btn-dash-all-sims"
            >
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          {recentSimulations.length > 0 ? (
            <div className="space-y-3" id="dash-recent-list">
              {recentSimulations.map((sim) => {
                const isSoles = sim.params.moneda === "PEN";
                const symbol = isSoles ? "S/" : "US$";
                return (
                  <div
                    key={sim.id}
                    onClick={() => onSelectSimulation(sim)}
                    className="flex justify-between items-center p-3.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/30 rounded-xl cursor-pointer transition-all"
                    id={`dash-recent-item-${sim.id}`}
                  >
                    <div>
                      <h4 className="text-xs font-sans font-medium text-slate-800">{sim.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Cliente: {sim.clientName} • Auto: {sim.vehicle.marca} {sim.vehicle.modelo} ({sim.vehicle.anio})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {symbol} {sim.results.cuotaTotalPromedio.toLocaleString("en-US", { minimumFractionDigits: 2 })}/mes
                      </span>
                      <span className="block text-[9px] text-emerald-600 font-mono font-medium">
                        TCEA {sim.results.tcea.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl" id="dash-recent-empty">
              <p className="text-slate-400 text-xs font-mono">No tienes simulaciones guardadas.</p>
              <button
                onClick={() => onNavigate("calculadora")}
                className="mt-3 text-slate-900 hover:underline text-xs font-medium"
              >
                Crea tu primera simulación de compra inteligente ahora
              </button>
            </div>
          )}
        </div>

        {/* Right: Step Checklist (as seen in Mockup on page 22 of PDF) */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-4">
            <CheckSquare size={18} className="text-slate-500" />
            <h3 className="font-sans font-medium text-sm text-slate-900">Guía del Operador</h3>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Pasos recomendados para realizar una evaluación crediticia vehicular exitosa:
          </p>

          <div className="space-y-3" id="dash-checklist">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[9px] font-bold ${
                    item.completed
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  {item.completed ? "✓" : idx + 1}
                </div>
                <span className={`text-xs ${item.completed ? "text-slate-500 line-through" : "text-slate-700"}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-5 pt-4 border-t border-slate-50">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1.5">
              <span>Progreso de Simulación:</span>
              <span>{completedSteps}/6 Pasos</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-500"
                style={{ width: `${(completedSteps / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
