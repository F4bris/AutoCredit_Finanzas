import React, { useState, useEffect } from "react";
import { User, Client } from "../types";
import { Plus, Edit2, Trash2, Mail, Phone, Shield, Building, DollarSign, X, Check, Search, UserCheck } from "lucide-react";

interface ClientManagerProps {
  user: User | null;
  onSelectClient?: (client: Client) => void;
}

export default function ClientManager({ user, onSelectClient }: ClientManagerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [empleador, setEmpleador] = useState("");
  const [ingresoMensual, setIngresoMensual] = useState("");

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  async function loadClients() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/clients", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) {
        throw new Error("No se pudieron cargar los clientes.");
      }
      const data = await res.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingClient(null);
    setNombres("");
    setApellidos("");
    setDni("");
    setTelefono("");
    setCorreo("");
    setEmpleador("");
    setIngresoMensual("");
    setIsFormOpen(true);
    setError(null);
  }

  function openEditForm(client: Client) {
    setEditingClient(client);
    setNombres(client.nombres);
    setApellidos(client.apellidos);
    setDni(client.dni);
    setTelefono(client.telefono);
    setCorreo(client.correo);
    setEmpleador(client.empleador || "");
    setIngresoMensual(client.ingresoMensual ? String(client.ingresoMensual) : "");
    setIsFormOpen(true);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(null);

    // Simple validations
    if (!nombres || !apellidos || !dni || !correo) {
      setError("Por favor completa todos los campos obligatorios (Nombres, Apellidos, DNI, Correo).");
      return;
    }
    if (dni.length !== 8 || !/^\d+$/.test(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos numéricos.");
      return;
    }
    if (telefono && (telefono.length < 9 || !/^\d+$/.test(telefono))) {
      setError("El Teléfono debe tener al menos 9 dígitos numéricos.");
      return;
    }

    const payload = {
      nombres,
      apellidos,
      dni,
      telefono,
      correo,
      empleador,
      ingresoMensual: parseFloat(ingresoMensual) || 0,
    };

    try {
      const url = editingClient ? `/api/v1/clients/${editingClient.id}` : "/api/v1/clients";
      const method = editingClient ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Ocurrió un error al guardar el cliente.");
      }

      setSuccess(editingClient ? "Cliente actualizado con éxito." : "Cliente registrado con éxito.");
      setIsFormOpen(false);
      loadClients();
    } catch (err: any) {
      setError(err.message || "Error al guardar cliente.");
    }
  }

  async function handleDelete(client: Client) {
    if (!user) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${client.nombres} ${client.apellidos}? Esta acción también eliminará todas sus simulaciones guardadas.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/clients/${client.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) {
        throw new Error("No se pudo eliminar el cliente.");
      }
      setSuccess("Cliente eliminado correctamente.");
      loadClients();
    } catch (err: any) {
      setError(err.message || "Error al eliminar cliente.");
    }
  }

  const filteredClients = clients.filter((client) => {
    const search = searchQuery.toLowerCase();
    return (
      client.nombres.toLowerCase().includes(search) ||
      client.apellidos.toLowerCase().includes(search) ||
      client.dni.includes(search) ||
      client.correo.toLowerCase().includes(search)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="client-manager-panel">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-xl font-sans font-medium text-slate-900 flex items-center gap-2">
            <UserCheck size={22} className="text-slate-600" />
            Directorio de Clientes
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Gestiona los expedientes de tus solicitantes antes de generar simulaciones.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm"
          id="btn-new-client"
        >
          <Plus size={16} /> Registrar Cliente
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg" id="client-alert-error">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg" id="client-alert-success">
          {success}
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Buscar cliente por nombre, DNI o correo..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="client-search-input"
        />
      </div>

      {/* Clients List/Grid */}
      {loading ? (
        <div className="text-center py-12" id="client-loading">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="text-slate-400 text-xs font-mono mt-3">Cargando clientes...</p>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="client-list">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="border border-slate-100 hover:border-slate-200 hover:shadow-sm bg-slate-50/20 rounded-xl p-4 transition-all relative flex flex-col justify-between"
              id={`client-card-${client.id}`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-sans font-medium text-slate-800 text-sm">
                      {client.nombres} {client.apellidos}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                      <Shield size={12} /> DNI {client.dni}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {onSelectClient && (
                      <button
                        onClick={() => onSelectClient(client)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-medium transition-all"
                        id={`btn-select-client-${client.id}`}
                      >
                        Simular
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(client)}
                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition-all"
                      id={`btn-edit-client-${client.id}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all"
                      id={`btn-delete-client-${client.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100/50 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Mail size={13} className="text-slate-400" />
                    <span>{client.correo}</span>
                  </div>
                  {client.telefono && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone size={13} className="text-slate-400" />
                      <span>{client.telefono}</span>
                    </div>
                  )}
                  {client.empleador && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Building size={13} className="text-slate-400" />
                      <span>Empresa: {client.empleador}</span>
                    </div>
                  )}
                  {client.ingresoMensual ? (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <DollarSign size={13} className="text-slate-400" />
                      <span className="font-sans font-medium text-slate-800">
                        S/ {client.ingresoMensual.toLocaleString("en-US", { minimumFractionDigits: 2 })} / mes
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl" id="client-empty">
          <p className="text-slate-400 text-xs font-mono">No hay clientes registrados.</p>
          <button
            onClick={openCreateForm}
            className="mt-3 text-slate-900 hover:underline text-xs font-medium"
          >
            Registra tu primer cliente ahora
          </button>
        </div>
      )}

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="client-form-modal">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="flex justify-between items-center bg-slate-900 px-6 py-4 text-white">
              <h3 className="font-sans font-medium text-sm">
                {editingClient ? "Editar Cliente" : "Registrar Nuevo Cliente"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white transition-all"
                id="btn-close-client-form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4" id="client-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    id="client-form-nombres"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    id="client-form-apellidos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="8 dígitos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                    id="client-form-dni"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="9 dígitos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                    id="client-form-telefono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@dominio.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  id="client-form-correo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Empleador / Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Empresa S.A.C."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    value={empleador}
                    onChange={(e) => setEmpleador(e.target.value)}
                    id="client-form-empleador"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Ingreso Mensual (S/)
                  </label>
                  <input
                    type="number"
                    placeholder="S/ 5000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                    value={ingresoMensual}
                    onChange={(e) => setIngresoMensual(e.target.value)}
                    id="client-form-ingresomensual"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-all"
                  id="btn-cancel-client-form"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
                  id="btn-save-client-form"
                >
                  {editingClient ? "Guardar Cambios" : "Crear Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
