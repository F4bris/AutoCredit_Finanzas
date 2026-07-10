import { useState } from "react";
import { User, Simulation } from "../types";
import { Search, Calendar, DollarSign, Award, ChevronRight, Scale, Trash2, ArrowUpDown } from "lucide-react";

interface SimulationHistoryProps {
  user: User | null;
  simulations: Simulation[];
  onSelectSimulation: (sim: Simulation) => void;
  onDeleteSimulation: (id: string) => void;
}

export default function SimulationHistory({ user, simulations, onSelectSimulation, onDeleteSimulation }: SimulationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [selectedForComparison, setSelectedForComparison] = useState<Simulation[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "tcea" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter & Search simulations
  const filteredSimulations = simulations.filter((sim) => {
    const matchSearch =
      sim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCurrency = currencyFilter === "all" || sim.params.moneda === currencyFilter;

    return matchSearch && matchCurrency;
  });

  // Sort simulations
  const sortedSimulations = [...filteredSimulations].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "tcea") {
      comparison = a.results.tcea - b.results.tcea;
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  function handleToggleComparison(sim: Simulation) {
    if (selectedForComparison.some((s) => s.id === sim.id)) {
      setSelectedForComparison(selectedForComparison.filter((s) => s.id !== sim.id));
    } else {
      if (selectedForComparison.length >= 2) {
        // limit to 2
        setSelectedForComparison([selectedForComparison[1], sim]);
      } else {
        setSelectedForComparison([...selectedForComparison, sim]);
      }
    }
  }

  function handleToggleSort(field: "date" | "tcea" | "name") {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  }

  return (
    <div className="space-y-6" id="history-panel">
      {/* Header and filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-sans font-medium text-slate-900">Historial de Simulaciones</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestiona, compara y exporta todos los créditos vehiculares simulados en la plataforma.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre de simulación, cliente o vehículo..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="history-search-input"
            />
          </div>

          {/* Currency Filter */}
          <div>
            <select
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              id="history-currency-select"
            >
              <option value="all">Todas las Monedas</option>
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Drawer / Summary */}
      {selectedForComparison.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-850 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-sans font-medium text-xs flex items-center gap-2 text-slate-300">
              <Scale size={16} className="text-amber-400" /> Comparador Side-by-Side (Máximo 2)
            </h3>
            <button
              onClick={() => setSelectedForComparison([])}
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 underline"
            >
              Limpiar Comparación
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedForComparison.map((sim, index) => {
              const symbol = sim.params.moneda === "PEN" ? "S/" : "US$";
              return (
                <div key={sim.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-300">Opción {index + 1}: {sim.name}</span>
                    <button
                      onClick={() => handleToggleComparison(sim)}
                      className="text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Remover
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mb-2">Cliente: {sim.clientName}</p>
                  
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-400 mt-2">
                    <div className="py-1 border-b border-slate-900">
                      <span>Monto Financiado:</span>
                      <span className="block text-white font-bold">{symbol} {sim.params.capitalFinanciar.toLocaleString()}</span>
                    </div>
                    <div className="py-1 border-b border-slate-900">
                      <span>TCEA Oficial:</span>
                      <span className="block text-emerald-400 font-bold">{sim.results.tcea.toFixed(2)}%</span>
                    </div>
                    <div className="py-1 border-b border-slate-900">
                      <span>Cuota Promedio:</span>
                      <span className="block text-white font-bold">{symbol} {sim.results.cuotaTotalPromedio.toFixed(2)}</span>
                    </div>
                    <div className="py-1 border-b border-slate-900">
                      <span>Valor Actual (VAN):</span>
                      <span className={`block font-bold ${sim.results.van >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {symbol} {sim.results.van.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Table/List Sorting Controls */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex justify-between items-center text-xs font-mono text-slate-500">
          <span>{sortedSimulations.length} Simulaciones Encontradas</span>
          <div className="flex gap-4">
            <button
              onClick={() => handleToggleSort("date")}
              className={`hover:text-slate-900 font-medium flex items-center gap-1 ${
                sortBy === "date" ? "text-slate-950 font-bold" : ""
              }`}
            >
              Fecha {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleToggleSort("tcea")}
              className={`hover:text-slate-900 font-medium flex items-center gap-1 ${
                sortBy === "tcea" ? "text-slate-950 font-bold" : ""
              }`}
            >
              TCEA {sortBy === "tcea" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleToggleSort("name")}
              className={`hover:text-slate-900 font-medium flex items-center gap-1 ${
                sortBy === "name" ? "text-slate-950 font-bold" : ""
              }`}
            >
              Nombre {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>

        {sortedSimulations.length > 0 ? (
          <div className="divide-y divide-slate-100" id="history-sims-list">
            {sortedSimulations.map((sim) => {
              const isSelectedForComp = selectedForComparison.some((s) => s.id === sim.id);
              const symbol = sim.params.moneda === "PEN" ? "S/" : "US$";
              return (
                <div
                  key={sim.id}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/20 transition-all"
                  id={`sim-history-item-${sim.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-sans font-medium text-slate-900">{sim.name}</h3>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-mono rounded font-medium">
                        {sim.params.moneda}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      Cliente: <span className="text-slate-700">{sim.clientName}</span> • Auto:{" "}
                      <span className="text-slate-700">
                        {sim.vehicle.marca} {sim.vehicle.modelo} ({sim.vehicle.anio})
                      </span>
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                      Registrado el {new Date(sim.createdAt).toLocaleDateString("es-PE")} • Plazo: {sim.params.plazoMeses} cuotas
                    </p>
                  </div>

                  {/* Pricing and parameters summary */}
                  <div className="flex flex-wrap items-center gap-4 sm:text-right">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Cuota Promedio
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {symbol} {sim.results.cuotaTotalPromedio.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        TCEA Oficial
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600">
                        {sim.results.tcea.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Compare toggle button */}
                      <button
                        onClick={() => handleToggleComparison(sim)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          isSelectedForComp
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                        title="Comparar simulación"
                        id={`btn-compare-${sim.id}`}
                      >
                        <Scale size={14} />
                      </button>

                      {/* Ver Detalle */}
                      <button
                        onClick={() => onSelectSimulation(sim)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-lg text-xs font-medium transition-all shadow-sm"
                        id={`btn-view-${sim.id}`}
                      >
                        Ver Detalle <ChevronRight size={12} />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => onDeleteSimulation(sim.id)}
                        className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        id={`btn-delete-${sim.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16" id="history-sims-empty">
            <p className="text-slate-400 text-xs font-mono">No se encontraron simulaciones guardadas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
