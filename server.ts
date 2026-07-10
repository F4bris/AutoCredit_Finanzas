import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { runSimulation, SimulationParams } from "./src/utils/finance.js";

// Helper for Database file
const DB_FILE = path.join(process.cwd(), "database.json");

interface Database {
  users: any[];
  clients: any[];
  simulations: any[];
  vehicleOffers: any[];
  settings: Record<string, any>;
}

// Initialize database file if it doesn't exist
function initDb(): Database {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDb: Database = {
      users: [],
      clients: [],
      simulations: [],
      vehicleOffers: [],
      settings: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(data);
    // Backfill missing collections for DBs created before this feature existed
    if (!Array.isArray(parsed.vehicleOffers)) {
      parsed.vehicleOffers = [];
    }
    return parsed;
  } catch (err) {
    const defaultDb: Database = {
      users: [],
      clients: [],
      simulations: [],
      vehicleOffers: [],
      settings: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }
}

function saveDb(db: Database) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  initDb();

  // Middleware
  app.use(express.json());

  // Auth Middleware
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado. Token faltante." });
    }
    const token = authHeader.split(" ")[1];
    const db = initDb();
    
    // Simple verification
    const userId = token.replace("mock-token-", "");
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: "Sesión inválida o expirada." });
    }
    (req as any).user = user;
    next();
  };

  // --- API ENDPOINTS ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Sign Up
  app.post("/api/v1/authentication/sign-up", (req, res) => {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Todos los campos son obligatorios (email, password, fullName)." });
    }

    const db = initDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "El correo electrónico ya está registrado." });
    }

    const newUser = {
      id: "u_" + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      password, // In a production app, we would hash this. Here we keep it clear or simulated for simplicity.
      fullName,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    res.status(201).json({
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      token: "mock-token-" + newUser.id,
    });
  });

  // 2. Sign In
  app.post("/api/v1/authentication/sign-in", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios." });
    }

    const db = initDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      token: "mock-token-" + user.id,
    });
  });

  // 3. Get Clients
  app.get("/api/v1/clients", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const db = initDb();
    const userClients = db.clients.filter((c) => c.userId === user.id);
    res.json(userClients);
  });

  // 4. Create Client
  app.post("/api/v1/clients", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { nombres, apellidos, dni, telefono, correo, empleador, ingresoMensual } = req.body;

    if (!nombres || !apellidos || !dni || !correo) {
      return res.status(400).json({ error: "Nombres, apellidos, DNI y correo son obligatorios." });
    }

    const db = initDb();
    const newClient = {
      id: "c_" + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      nombres,
      apellidos,
      dni,
      telefono: telefono || "",
      correo,
      empleador: empleador || "",
      ingresoMensual: parseFloat(ingresoMensual) || 0,
      createdAt: new Date().toISOString(),
    };

    db.clients.push(newClient);
    saveDb(db);

    res.status(201).json(newClient);
  });

  // 5. Update Client
  app.put("/api/v1/clients/:id", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const { nombres, apellidos, dni, telefono, correo, empleador, ingresoMensual } = req.body;

    const db = initDb();
    const clientIdx = db.clients.findIndex((c) => c.id === id && c.userId === user.id);
    if (clientIdx === -1) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }

    db.clients[clientIdx] = {
      ...db.clients[clientIdx],
      nombres: nombres || db.clients[clientIdx].nombres,
      apellidos: apellidos || db.clients[clientIdx].apellidos,
      dni: dni || db.clients[clientIdx].dni,
      telefono: telefono !== undefined ? telefono : db.clients[clientIdx].telefono,
      correo: correo || db.clients[clientIdx].correo,
      empleador: empleador !== undefined ? empleador : db.clients[clientIdx].empleador,
      ingresoMensual: ingresoMensual !== undefined ? parseFloat(ingresoMensual) : db.clients[clientIdx].ingresoMensual,
      updatedAt: new Date().toISOString(),
    };

    saveDb(db);
    res.json(db.clients[clientIdx]);
  });

  // 6. Delete Client
  app.delete("/api/v1/clients/:id", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;

    const db = initDb();
    const initialLength = db.clients.length;
    db.clients = db.clients.filter((c) => !(c.id === id && c.userId === user.id));

    if (db.clients.length === initialLength) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }

    // Cascade delete simulations for this client
    db.simulations = db.simulations.filter((s) => s.clientId !== id);

    saveDb(db);
    res.json({ success: true, message: "Cliente eliminado correctamente." });
  });

  // 6b. Get Vehicle Offers ("Oferta Vehicular")
  app.get("/api/v1/offers", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const db = initDb();
    const userOffers = db.vehicleOffers
      .filter((o) => o.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(userOffers);
  });

  // 6c. Create Vehicle Offer
  app.post("/api/v1/offers", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { modelo, precio } = req.body;

    if (!modelo || typeof modelo !== "string" || !modelo.trim()) {
      return res.status(400).json({ error: "El modelo del vehículo es obligatorio." });
    }
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({ error: "El precio debe ser un número mayor a 0." });
    }

    const db = initDb();
    const newOffer = {
      id: "o_" + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      modelo: modelo.trim(),
      precio: precioNum,
      createdAt: new Date().toISOString(),
    };

    db.vehicleOffers.push(newOffer);
    saveDb(db);

    res.status(201).json(newOffer);
  });

  // 6d. Delete Vehicle Offer
  app.delete("/api/v1/offers/:id", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;

    const db = initDb();
    const initialLength = db.vehicleOffers.length;
    db.vehicleOffers = db.vehicleOffers.filter((o) => !(o.id === id && o.userId === user.id));

    if (db.vehicleOffers.length === initialLength) {
      return res.status(404).json({ error: "Oferta no encontrada." });
    }

    saveDb(db);
    res.json({ success: true, message: "Oferta eliminada correctamente." });
  });

  // 7. Get My Simulations
  app.get("/api/v1/loans/my-loans", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const db = initDb();
    const userSimulations = db.simulations.filter((s) => s.userId === user.id);
    res.json(userSimulations);
  });

  // 8. Get Simulation Detail
  app.get("/api/v1/loans/:id", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;

    const db = initDb();
    const sim = db.simulations.find((s) => s.id === id && s.userId === user.id);
    if (!sim) {
      return res.status(404).json({ error: "Simulación no encontrada." });
    }
    res.json(sim);
  });

  // 9. Create/Save Simulation (Simulate)
  app.post("/api/v1/loans/simulate", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { name, clientId, vehicle, params } = req.body;

    if (!name || !clientId || !vehicle || !params) {
      return res.status(400).json({ error: "Campos 'name', 'clientId', 'vehicle' y 'params' son requeridos." });
    }

    // Prepare calculations
    const simParams: SimulationParams = {
      precioVehiculo: parseFloat(vehicle.precio) || 0,
      cuotaInicialMonto: parseFloat(params.cuotaInicialMonto) || 0,
      cuotaInicialPct: parseFloat(params.cuotaInicialPct) || 0,
      cuotaBalonMonto: parseFloat(params.cuotaBalonMonto) || 0,
      cuotaBalonPct: parseFloat(params.cuotaBalonPct) || 0,
      montoCredito: parseFloat(params.montoCredito) || 0,
      capitalFinanciar: parseFloat(params.capitalFinanciar) || 0,
      moneda: params.moneda || "PEN",
      tipoTasa: params.tipoTasa || "TEA",
      tasaAnual: parseFloat(params.tasaAnual) || 0,
      frecuenciaPago: params.frecuenciaPago || "mensual",
      capitalizacion: params.capitalizacion,
      graciaTipo: params.graciaTipo || "Ninguno",
      graciaMeses: parseInt(params.graciaMeses) || 0,
      seguroDesgravamenPct: parseFloat(params.seguroDesgravamenPct) || 0,
      seguroMultirriesgo: parseFloat(params.seguroMultirriesgo) || 0,
      comisionInicial: parseFloat(params.comisionInicial) || 0,
      comisionPeriodica: parseFloat(params.comisionPeriodica) || 0,
      comisionFinal: parseFloat(params.comisionFinal) || 0,
      fechaDesembolso: params.fechaDesembolso || new Date().toISOString().split("T")[0],
      tasaDescuento: parseFloat(params.tasaDescuento) || 8,
      plazoMeses: parseInt(params.plazoMeses) || 24,
    };

    try {
      const results = runSimulation(simParams);

      const db = initDb();
      const client = db.clients.find((c) => c.id === clientId && c.userId === user.id);

      const newSimulation = {
        id: "s_" + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        clientId,
        clientName: client ? `${client.nombres} ${client.apellidos}` : "Cliente Desconocido",
        name,
        vehicle,
        params: simParams,
        results,
        createdAt: new Date().toISOString(),
      };

      db.simulations.push(newSimulation);
      saveDb(db);

      res.status(201).json(newSimulation);
    } catch (err: any) {
      console.error("Simulation error:", err);
      res.status(500).json({ error: "Error en los cálculos de la simulación: " + err.message });
    }
  });

  // 10. Edit / Update Simulation
  app.put("/api/v1/loans/:id", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, clientId, vehicle, params } = req.body;

    const db = initDb();
    const simIdx = db.simulations.findIndex((s) => s.id === id && s.userId === user.id);
    if (simIdx === -1) {
      return res.status(404).json({ error: "Simulación no encontrada." });
    }

    const currentSim = db.simulations[simIdx];
    const targetName = name || currentSim.name;
    const targetClientId = clientId || currentSim.clientId;
    const targetVehicle = vehicle || currentSim.vehicle;
    const targetParams = params || currentSim.params;

    const simParams: SimulationParams = {
      precioVehiculo: parseFloat(targetVehicle.precio) || 0,
      cuotaInicialMonto: parseFloat(targetParams.cuotaInicialMonto) || 0,
      cuotaInicialPct: parseFloat(targetParams.cuotaInicialPct) || 0,
      cuotaBalonMonto: parseFloat(targetParams.cuotaBalonMonto) || 0,
      cuotaBalonPct: parseFloat(targetParams.cuotaBalonPct) || 0,
      montoCredito: parseFloat(targetParams.montoCredito) || 0,
      capitalFinanciar: parseFloat(targetParams.capitalFinanciar) || 0,
      moneda: targetParams.moneda || "PEN",
      tipoTasa: targetParams.tipoTasa || "TEA",
      tasaAnual: parseFloat(targetParams.tasaAnual) || 0,
      frecuenciaPago: targetParams.frecuenciaPago || "mensual",
      capitalizacion: targetParams.capitalizacion,
      graciaTipo: targetParams.graciaTipo || "Ninguno",
      graciaMeses: parseInt(targetParams.graciaMeses) || 0,
      seguroDesgravamenPct: parseFloat(targetParams.seguroDesgravamenPct) || 0,
      seguroMultirriesgo: parseFloat(targetParams.seguroMultirriesgo) || 0,
      comisionInicial: parseFloat(targetParams.comisionInicial) || 0,
      comisionPeriodica: parseFloat(targetParams.comisionPeriodica) || 0,
      comisionFinal: parseFloat(targetParams.comisionFinal) || 0,
      fechaDesembolso: targetParams.fechaDesembolso || new Date().toISOString().split("T")[0],
      tasaDescuento: parseFloat(targetParams.tasaDescuento) || 8,
      plazoMeses: parseInt(targetParams.plazoMeses) || 24,
    };

    try {
      const results = runSimulation(simParams);
      const client = db.clients.find((c) => c.id === targetClientId && c.userId === user.id);

      db.simulations[simIdx] = {
        ...currentSim,
        name: targetName,
        clientId: targetClientId,
        clientName: client ? `${client.nombres} ${client.apellidos}` : "Cliente Desconocido",
        vehicle: targetVehicle,
        params: simParams,
        results,
        updatedAt: new Date().toISOString(),
      };

      saveDb(db);
      res.json(db.simulations[simIdx]);
    } catch (err: any) {
      res.status(500).json({ error: "Error al actualizar la simulación: " + err.message });
    }
  });

  // 11. Delete Simulation
  app.delete("/api/v1/loans/:id", authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { id } = req.params;

    const db = initDb();
    const initialLength = db.simulations.length;
    db.simulations = db.simulations.filter((s) => !(s.id === id && s.userId === user.id));

    if (db.simulations.length === initialLength) {
      return res.status(404).json({ error: "Simulación no encontrada." });
    }

    saveDb(db);
    res.json({ success: true, message: "Simulación eliminada correctamente." });
  });

  // 12. Simulate Public (unauthenticated helper for instant math)
  app.post("/api/v1/loans/simulate-public", (req, res) => {
    const { vehicle, params } = req.body;
    if (!vehicle || !params) {
      return res.status(400).json({ error: "Campos 'vehicle' y 'params' son requeridos." });
    }

    const simParams: SimulationParams = {
      precioVehiculo: parseFloat(vehicle.precio) || 0,
      cuotaInicialMonto: parseFloat(params.cuotaInicialMonto) || 0,
      cuotaInicialPct: parseFloat(params.cuotaInicialPct) || 0,
      cuotaBalonMonto: parseFloat(params.cuotaBalonMonto) || 0,
      cuotaBalonPct: parseFloat(params.cuotaBalonPct) || 0,
      montoCredito: parseFloat(params.montoCredito) || 0,
      capitalFinanciar: parseFloat(params.capitalFinanciar) || 0,
      moneda: params.moneda || "PEN",
      tipoTasa: params.tipoTasa || "TEA",
      tasaAnual: parseFloat(params.tasaAnual) || 0,
      frecuenciaPago: params.frecuenciaPago || "mensual",
      capitalizacion: params.capitalizacion,
      graciaTipo: params.graciaTipo || "Ninguno",
      graciaMeses: parseInt(params.graciaMeses) || 0,
      seguroDesgravamenPct: parseFloat(params.seguroDesgravamenPct) || 0,
      seguroMultirriesgo: parseFloat(params.seguroMultirriesgo) || 0,
      comisionInicial: parseFloat(params.comisionInicial) || 0,
      comisionPeriodica: parseFloat(params.comisionPeriodica) || 0,
      comisionFinal: parseFloat(params.comisionFinal) || 0,
      fechaDesembolso: params.fechaDesembolso || new Date().toISOString().split("T")[0],
      tasaDescuento: parseFloat(params.tasaDescuento) || 8,
      plazoMeses: parseInt(params.plazoMeses) || 24,
    };

    try {
      const results = runSimulation(simParams);
      res.json({ params: simParams, results });
    } catch (err: any) {
      res.status(500).json({ error: "Error en los cálculos de la simulación: " + err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
