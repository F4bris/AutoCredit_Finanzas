import React, { useState } from "react";
import { User } from "../types";
import { Key, Mail, Shield, CheckCircle2, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || (isRegister && !fullName)) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/v1/authentication/sign-up" : "/api/v1/authentication/sign-in";
      const payload = isRegister ? { email, password, fullName } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error en la autenticación.");
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  function handleUseDemo() {
    setEmail("demo@autocredit.pe");
    setPassword("password123");
    setIsRegister(false);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8" id="login-container">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Product Info (Mockup style) */}
        <div className="md:col-span-6 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-slate-950 opacity-90 z-0"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              {/* Logo */}
              <div className="flex items-center gap-2 mb-8">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-950 font-bold font-sans">
                  A
                </div>
                <span className="font-sans font-medium text-lg tracking-tight text-white">AutoCredit Perú</span>
              </div>

              {/* Title & Slogan */}
              <h1 className="text-3xl md:text-4xl font-sans font-medium tracking-tight leading-tight mb-4 text-white">
                Gestión Inteligente de Créditos Vehiculares
              </h1>
              <p className="text-slate-400 text-xs leading-relaxed mb-8">
                Plataforma corporativa especializada en el método de amortización francés para financiamiento vehicular. Diseñada para calcular cronogramas transparentes de compra inteligente bajo normativa de la SBS.
              </p>

              {/* Core Features bullets */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-slate-200">Método Francés Certificado</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Generación de cronogramas y amortización según estándares peruanos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-slate-200">Análisis Financiero de Rentabilidad</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Indicadores automáticos de VAN y TIR (desde el punto de vista del deudor).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-slate-200">Compra Inteligente (Cuota Balón)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Ajusta cuotas residuales y gestiona periodos de gracia total o parcial.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom footnote */}
            <div className="mt-8 border-t border-slate-800 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>© 2026 AUTOCREDIT PERÚ</span>
              <span className="flex items-center gap-1">
                <Shield size={10} /> REGULADO SBS
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <h2 className="text-2xl font-sans font-medium tracking-tight text-slate-900 mb-2">
              {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              {isRegister
                ? "Completa tus datos para registrarte y empezar a simular créditos"
                : "Ingresa tus credenciales para acceder al panel de gestión"}
            </p>

            {/* Alerts */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg" id="login-error-alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
              {isRegister && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Nombres y Apellidos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez García"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    id="input-fullname"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    placeholder="tu@ejemplo.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="input-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Key size={14} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    id="btn-toggle-password"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-2 px-4 rounded-lg text-xs font-medium transition-all shadow-sm"
                id="btn-submit-auth"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isRegister ? (
                  <>
                    <UserPlus size={14} /> Crear cuenta
                  </>
                ) : (
                  <>
                    <LogIn size={14} /> Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span className="bg-white px-2">¿Quieres probar rápido?</span>
              </div>
            </div>

            <button
              onClick={handleUseDemo}
              className="w-full py-2 px-4 border border-dashed border-slate-300 hover:border-slate-500 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 transition-all bg-slate-50/50 hover:bg-slate-50"
              id="btn-use-demo-auth"
            >
              Usar credenciales de demostración
            </button>

            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-950 font-medium underline"
                id="btn-toggle-auth-mode"
              >
                {isRegister ? "¿Ya tienes una cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
