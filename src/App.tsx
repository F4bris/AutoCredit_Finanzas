import { useState, useEffect } from "react";
import { User, Client, Simulation } from "./types";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ClientManager from "./components/ClientManager";
import Calculator from "./components/Calculator";
import SimulationHistory from "./components/SimulationHistory";
import SimulationDetail from "./components/SimulationDetail";
import HelpCenter from "./components/HelpCenter";
import VehicleOffer from "./components/VehicleOffer";

import {
  LayoutDashboard,
  Users,
  Calculator as CalcIcon,
  History,
  HelpCircle,
  LogOut,
  Car,
  ChevronRight,
  Menu,
  X,
  FileSpreadsheet,
  Sparkles
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("inicio"); // inicio, clientes, calculadora, simulaciones, ayuda
  const [clients, setClients] = useState<Client[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load user session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("autocredit_user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
      } catch (e) {
        localStorage.removeItem("autocredit_user");
      }
    }
  }, []);

  // Fetch initial clients and simulations when user is set
  useEffect(() => {
    if (user) {
      fetchClients();
      fetchSimulations();
    }
  }, [user]);

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
      }
    } catch (err) {
      console.error("Error fetching clients", err);
    }
  }

  async function fetchSimulations() {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/loans/my-loans", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSimulations(data);
      }
    } catch (err) {
      console.error("Error fetching simulations", err);
    }
  }

  function handleLoginSuccess(authenticatedUser: User) {
    setUser(authenticatedUser);
    localStorage.setItem("autocredit_user", JSON.stringify(authenticatedUser));
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("autocredit_user");
    // Reset state
    setClients([]);
    setSimulations([]);
    setSelectedSimulation(null);
    setPreselectedClient(null);
    setActiveTab("inicio");
  }

  function handleClientSimulate(client: Client) {
    setPreselectedClient(client);
    setActiveTab("calculadora");
    setSelectedSimulation(null);
  }

  function handleSimulationCreated(sim: Simulation) {
    // Add to list
    setSimulations((prev) => [...prev, sim]);
    setSelectedSimulation(sim);
  }

  async function handleDeleteSimulation(id: string) {
    if (!user) return;
    if (!confirm("¿Estás seguro de que deseas eliminar esta simulación?")) return;

    try {
      const res = await fetch(`/api/v1/loans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        setSimulations((prev) => prev.filter((s) => s.id !== id));
        if (selectedSimulation?.id === id) {
          setSelectedSimulation(null);
          setActiveTab("simulaciones");
        }
      }
    } catch (err) {
      console.error("Error deleting simulation", err);
    }
  }

  // If not logged in, render the Login screen
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" id="app-root">
      {/* Sidebar for Desktop / Header for Mobile */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 border-r border-slate-850 z-30 relative md:sticky md:top-0 md:h-screen">
        <div>
          {/* Logo Brand area */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center text-slate-950 font-bold text-sm">
                A
              </div>
              <span className="font-sans font-medium text-sm tracking-tight text-white">AutoCredit Perú</span>
            </div>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            className={`${
              mobileMenuOpen ? "block" : "hidden"
            } md:block p-4 space-y-1`}
            id="sidebar-navigation"
          >
            <button
              onClick={() => {
                setActiveTab("inicio");
                setSelectedSimulation(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "inicio" && !selectedSimulation
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
              id="nav-btn-inicio"
            >
              <LayoutDashboard size={16} /> Inicio
            </button>

            <button
              onClick={() => {
                setActiveTab("clientes");
                setSelectedSimulation(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "clientes" && !selectedSimulation
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
              id="nav-btn-clientes"
            >
              <Users size={16} /> Directorio de Clientes
            </button>

            <button
              onClick={() => {
                setActiveTab("calculadora");
                setSelectedSimulation(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "calculadora" && !selectedSimulation
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
              id="nav-btn-calculadora"
            >
              <CalcIcon size={16} /> Simulador Crédito
            </button>

            <button
              onClick={() => {
                setActiveTab("simulaciones");
                setSelectedSimulation(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "simulaciones" && !selectedSimulation
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
              id="nav-btn-simulaciones"
            >
              <History size={16} /> Historial & Comparar
            </button>

            <button
              onClick={() => {
                setActiveTab("oferta");
                setSelectedSimulation(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "oferta" && !selectedSimulation
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
              id="nav-btn-oferta"
            >
              <Sparkles size={16} /> Oferta Vehicular
            </button>

            <button
              onClick={() => {
                setActiveTab("ayuda");
                setSelectedSimulation(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === "ayuda" && !selectedSimulation
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
              id="nav-btn-ayuda"
            >
              <HelpCircle size={16} /> Centro de Ayuda
            </button>
          </nav>
        </div>

        {/* User Session Footer */}
        <div
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } md:block p-4 border-t border-slate-800`}
          id="sidebar-session-footer"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
              {user.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-medium text-white truncate">{user.fullName}</h4>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white py-2 px-3 rounded-lg text-xs font-medium transition-all"
            id="btn-logout"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content-scrollable">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-250 bg-white sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>AutoCredit</span>
            <ChevronRight size={12} />
            <span className="text-slate-800 font-medium capitalize">
              {selectedSimulation
                ? "Detalle de Simulación"
                : activeTab === "oferta"
                ? "Oferta Vehicular"
                : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
              Sistema Activo
            </span>
          </div>
        </header>

        {/* Inner Content View */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {selectedSimulation ? (
            <SimulationDetail
              user={user}
              simulation={selectedSimulation}
              onBack={() => {
                setSelectedSimulation(null);
                // Return to appropriate tab
                if (activeTab === "inicio") setActiveTab("simulaciones");
              }}
              onDelete={handleDeleteSimulation}
            />
          ) : (
            <>
              {activeTab === "inicio" && (
                <Dashboard
                  user={user}
                  simulations={simulations}
                  clientsCount={clients.length}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onSelectSimulation={(sim) => setSelectedSimulation(sim)}
                />
              )}

              {activeTab === "clientes" && (
                <ClientManager
                  user={user}
                  onSelectClient={handleClientSimulate}
                />
              )}

              {activeTab === "calculadora" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-sans font-medium text-slate-900">Simulador de Crédito Vehicular</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configura el plan de financiamiento francés. Incluye cálculo de cuotas balón (Compra Inteligente), periodos de gracia y seguros obligatorios.
                    </p>
                  </div>
                  <Calculator
                    user={user}
                    onSimulationCreated={handleSimulationCreated}
                    preselectedClient={preselectedClient}
                  />
                </div>
              )}

              {activeTab === "simulaciones" && (
                <SimulationHistory
                  user={user}
                  simulations={simulations}
                  onSelectSimulation={(sim) => setSelectedSimulation(sim)}
                  onDeleteSimulation={handleDeleteSimulation}
                />
              )}

              {activeTab === "oferta" && <VehicleOffer user={user} />}

              {activeTab === "ayuda" && <HelpCenter />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
