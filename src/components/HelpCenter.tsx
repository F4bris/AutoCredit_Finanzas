import { useState } from "react";
import { HelpCircle, Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      category: "metodo",
      question: "¿Qué es el Método Francés de Amortización?",
      answer: "El método francés se caracteriza por cuotas periódicas constantes (PMT). Al principio del préstamo, la mayor parte de la cuota corresponde a intereses debido a que el saldo pendiente es alto. Conforme pasan los periodos, el saldo disminuye y la amortización del capital aumenta, mientras que los intereses decrecen."
    },
    {
      category: "compra",
      question: "¿Qué es la Compra Inteligente Vehicular?",
      answer: "Es una modalidad que te permite pagar cuotas mensuales más bajas al dejar un porcentaje del precio del auto (llamado Cuota Balón o Valor Residual, típicamente del 20% al 50%) para el final del contrato. Al término del plazo, puedes pagar la cuota balón para quedarte con el auto, refinanciarla o entregar el vehículo como parte de pago para un auto nuevo."
    },
    {
      category: "gracia",
      question: "¿Cómo funciona el Periodo de Gracia Total?",
      answer: "Durante un periodo de gracia total, el cliente no realiza ningún pago (ni amortización ni interés). Sin embargo, los intereses generados durante estos meses se acumulan y se suman al saldo deudor (capitalización de intereses). Al finalizar la gracia, se recalcula la cuota basándose en este nuevo saldo mayor y los meses restantes."
    },
    {
      category: "gracia",
      question: "¿Cómo funciona el Periodo de Gracia Parcial?",
      answer: "En el periodo de gracia parcial, el deudor paga únicamente los intereses generados cada mes, sin amortizar capital. Al no amortizar, el saldo pendiente de deuda no disminuye ni aumenta, manteniéndose constante. Al culminar la gracia parcial, se inicia la amortización normal sobre el saldo original."
    },
    {
      category: "tasas",
      question: "¿Cuál es la diferencia entre TEA y TNA?",
      answer: "La TEA (Tasa Efectiva Anual) considera la capitalización compuesta del dinero e indica el rendimiento o costo efectivo real en un año. La TNA (Tasa Nominal Anual) es una tasa de referencia que no incluye capitalización por sí misma, por lo que requiere especificar una frecuencia de capitalización (por ejemplo, diaria o mensual) para poder ser convertida a una tasa efectiva periódica aplicable."
    },
    {
      category: "indicadores",
      question: "¿Qué significan el VAN y la TIR para el deudor?",
      answer: "El VAN (Valor Actual Neto) mide el valor en el presente de los flujos de caja futuros del préstamo (desembolso inicial como ingreso, y las cuotas de pago como egresos) descontados a una tasa de oportunidad. La TIR (Tasa Interna de Retorno) es la tasa que iguala el VAN a cero, indicando el costo financiero periódico real implícito del crédito. Si el VAN es negativo al evaluarse con la tasa de descuento, significa que el costo del préstamo es mayor que su tasa de oportunidad."
    },
    {
      category: "sbs",
      question: "¿Qué es la TCEA y qué costos incluye?",
      answer: "La TCEA (Tasa de Costo Efectivo Anual) representa el costo total del crédito para el cliente. A diferencia de la TEA, la TCEA incluye absolutamente todos los cargos obligatorios: la tasa de interés base, los seguros obligatorios (seguro de desgravamen y seguro vehicular multirriesgo), comisiones periódicas y gastos de desembolso inicial. Es el indicador oficial exigido por la SBS peruana para comparar ofertas financieras de manera transparente."
    },
    {
      category: "metodo",
      question: "¿Qué es el Año Comercial de 30/360 días?",
      answer: "Es la convención estándar utilizada por el sistema financiero peruano y la SBS. Se asume que todos los meses tienen exactamente 30 días y que el año completo tiene 360 días. Esto simplifica las conversiones de tasas y la generación de cronogramas con cuotas mensuales regulares de 30 días exactos de interés."
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "todos" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "todos", label: "Todos los Temas" },
    { id: "metodo", label: "Método Francés" },
    { id: "compra", label: "Compra Inteligente" },
    { id: "gracia", label: "Periodos de Gracia" },
    { id: "tasas", label: "Tasas (TEA / TNA)" },
    { id: "indicadores", label: "Indicadores (VAN, TIR)" },
    { id: "sbs", label: "Transparencia SBS (TCEA)" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="help-center-panel">
      {/* Header Banner */}
      <div className="bg-slate-900 px-6 py-10 text-white relative">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <HelpCircle size={120} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-slate-300 mb-3">
            <BookOpen size={14} /> Centro de Aprendizaje
          </div>
          <h1 className="text-3xl font-sans font-medium tracking-tight text-white mb-2">
            Base de Conocimiento Financiero
          </h1>
          <p className="text-slate-300 text-sm">
            Conceptos clave, regulaciones de la SBS y matemática aplicada detrás del simulador de Crédito Vehicular con Compra Inteligente.
          </p>
        </div>
      </div>

      {/* Main Area */}
      <div className="p-6">
        {/* Search & Filter bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Buscar concepto o pregunta..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="help-search-input"
            />
          </div>
        </div>

        {/* Categories Tab Row */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setExpandedIndex(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
              id={`help-cat-${cat.id}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQs List */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-3" id="help-faq-list">
            {filteredFaqs.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div
                  key={index}
                  className={`border rounded-xl transition-all ${
                    isExpanded ? "border-slate-300 bg-slate-50/30" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-sans font-medium text-slate-800 text-sm focus:outline-none"
                    id={`help-faq-q-${index}`}
                  >
                    <span>{faq.question}</span>
                    <span className="text-slate-400 ml-2">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-slate-600 text-xs leading-relaxed border-t border-slate-100" id={`help-faq-a-${index}`}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl" id="help-empty">
            <p className="text-slate-400 text-xs font-mono">No se encontraron artículos que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
