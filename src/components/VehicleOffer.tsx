import React, { useState, useEffect } from "react";
import { User, VehicleOffer as VehicleOfferType } from "../types";
import { Tag, Car, DollarSign, Plus, Trash2, Sparkles } from "lucide-react";

interface VehicleOfferProps {
  user: User | null;
}

export default function VehicleOffer({ user }: VehicleOfferProps) {
  const [offers, setOffers] = useState<VehicleOfferType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields — both are freely typed by the user
  const [modelo, setModelo] = useState("");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    if (user) {
      loadOffers();
    }
  }, [user]);

  async function loadOffers() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/offers", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) {
        throw new Error("No se pudieron cargar las ofertas.");
      }
      const data = await res.json();
      setOffers(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(null);

    if (!modelo.trim()) {
      setError("Por favor, escribe el modelo del vehículo.");
      return;
    }
    const precioNum = parseFloat(precio);
    if (!precio || isNaN(precioNum) || precioNum <= 0) {
      setError("Por favor, ingresa un precio válido mayor a 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ modelo: modelo.trim(), precio: precioNum }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al guardar la oferta.");
      }

      setOffers((prev) => [data, ...prev]);
      setSuccess("Oferta vehicular registrada con éxito.");
      setModelo("");
      setPrecio("");
    } catch (err: any) {
      setError(err.message || "Error al guardar la oferta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(offer: VehicleOfferType) {
    if (!user) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar la oferta "${offer.modelo}"?`)) return;

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/v1/offers/${offer.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) {
        throw new Error("No se pudo eliminar la oferta.");
      }
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
      setSuccess("Oferta eliminada correctamente.");
    } catch (err: any) {
      setError(err.message || "Error al eliminar la oferta.");
    }
  }

  return (
    <div className="space-y-6" id="vehicle-offer-panel">
      <div>
        <h2 className="text-base font-sans font-medium text-slate-900 flex items-center gap-2">
          <Sparkles size={18} className="text-slate-600" />
          Oferta Vehicular
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Registra un modelo de vehículo y su precio de forma libre. Se guardará en tu lista de ofertas.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg" id="offer-alert-error">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg" id="offer-alert-success">
          {success}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="vehicle-offer-form-panel">
        <h3 className="text-sm font-sans font-medium text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
          <Tag size={18} className="text-slate-400" />
          Nueva Oferta
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4" id="vehicle-offer-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Modelo del Vehículo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Toyota Yaris 2025"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                id="offer-form-modelo"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                Precio (S/) *
              </label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                placeholder="Ej. 65000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                id="offer-form-precio"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-xs font-medium transition-all shadow-sm"
              id="btn-offer-submit"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Plus size={14} /> Guardar Oferta
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Offers List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="vehicle-offer-list-panel">
        <h3 className="text-sm font-sans font-medium text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
          <Car size={18} className="text-slate-400" />
          Ofertas Registradas
        </h3>

        {loading ? (
          <p className="text-xs text-slate-400 font-mono py-6 text-center">Cargando ofertas...</p>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="border border-slate-100 rounded-xl p-4 hover:shadow-sm transition-all"
                id={`offer-card-${offer.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <Car size={16} />
                    </div>
                    <h4 className="text-xs font-medium text-slate-800">{offer.modelo}</h4>
                  </div>
                  <button
                    onClick={() => handleDelete(offer)}
                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all"
                    id={`btn-delete-offer-${offer.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 border-t border-slate-100/50 pt-3">
                  <DollarSign size={13} className="text-slate-400" />
                  <span className="font-sans font-medium text-slate-800">
                    S/ {offer.precio.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl" id="offer-empty">
            <p className="text-slate-400 text-xs font-mono">Aún no has registrado ninguna oferta vehicular.</p>
          </div>
        )}
      </div>
    </div>
  );
}
