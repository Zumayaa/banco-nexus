import db, { verificarEstadoReplica, client } from "./db.js";
import express from 'express';
import { ObjectId } from 'mongodb';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Middleware para verificar estado del Replica Set
async function verificarConexion(req, res, next) {
  try {
    // Verificar que la conexión esté activa
    await client.db('admin').command({ ping: 1 });
    next();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    // Enviar alerta específica basada en el tipo de error
    let mensaje = 'Error de conexión con la base de datos';
    let codigo = 500;
    
    if (error.message.includes('not master')) {
      mensaje = 'El nodo primario ha cambiado. Reintentando operación...';
      codigo = 503;
    } else if (error.message.includes('connection')) {
      mensaje = 'Conexión perdida con el Replica Set';
      codigo = 503;
    }
    
    res.status(codigo).json({
      error: true,
      mensaje,
      detalle: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Endpoint para verificar estado del sistema
app.get("/health", async (req, res) => {
  try {
    const estado = await verificarEstadoReplica();
    const ping = await client.db('admin').command({ ping: 1 });
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      replica_set: {
        name: 'rsBanco',
        miembros_activos: estado.members.filter(m => m.health === 1).length,
        total_miembros: estado.members.length,
        primario: estado.members.find(m => m.stateStr === 'PRIMARY')?.name || 'No encontrado'
      },
      ping: ping.ok === 1 ? 'OK' : 'ERROR'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CLIENTES
app.get("/clients", verificarConexion, async (req, res) => {
  try {
    let collection = await db.collection("clientes");
    let results = await collection.find({})
      .limit(50)
      .toArray();
    res.status(200).json(results);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener clientes',
      detalle: error.message
    });
  }
});

app.get("/clients/:id", verificarConexion, async (req, res) => {
  try {
    let collection = await db.collection("clientes");
    let query = { _id: new ObjectId(req.params.id) };
    let result = await collection.findOne(query);
    
    if (!result) {
      return res.status(404).json({
        error: true,
        mensaje: 'Cliente no encontrado'
      });
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener cliente',
      detalle: error.message
    });
  }
});

// CUENTAS
app.get("/accounts", verificarConexion, async (req, res) => {
  try {
    let collection = await db.collection("cuentas");
    let results = await collection.find({})
      .limit(50)
      .toArray();
    res.status(200).json(results);
  } catch (error) {
    console.error('Error obteniendo cuentas:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener cuentas',
      detalle: error.message
    });
  }
});

app.get("/accounts/:curp", verificarConexion, async (req, res) => {
  try {
    let collection = await db.collection("cuentas");
    let query = { cliente: req.params.curp };
    let result = await collection.find(query).toArray();
    
    console.log('Cuentas encontradas:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error obteniendo cuentas por CURP:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener cuentas por CURP',
      detalle: error.message
    });
  }
});

// Actualizar saldo de cuenta (nuevo endpoint)
app.put("/accounts/:cuenta", verificarConexion, async (req, res) => {
  try {
    const { saldo } = req.body;
    
    if (typeof saldo !== 'number' || saldo < 0) {
      return res.status(400).json({
        error: true,
        mensaje: 'Saldo debe ser un número válido mayor o igual a 0'
      });
    }
    
    let collection = await db.collection("cuentas");
    let query = { cuenta: req.params.cuenta };
    let update = { $set: { saldo: saldo } };
    
    let result = await collection.updateOne(query, update, {
      writeConcern: { w: 'majority', j: true, wtimeout: 5000 }
    });
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: true,
        mensaje: 'Cuenta no encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      mensaje: 'Saldo actualizado correctamente',
      modificados: result.modifiedCount
    });
  } catch (error) {
    console.error('Error actualizando saldo:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al actualizar saldo',
      detalle: error.message
    });
  }
});

// TRANSACCIONES
app.get("/transactions", verificarConexion, async (req, res) => {
  try {
    let collection = await db.collection("transacciones");
    let results = await collection.find({})
      .sort({ fecha: -1 }) // Ordenar por fecha descendente
      .limit(50)
      .toArray();
    res.status(200).json(results);
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener transacciones',
      detalle: error.message
    });
  }
});

app.get("/transactions/:account", verificarConexion, async (req, res) => {
  try {
    let collection = db.collection("transacciones");
    let query = { cuenta: req.params.account };
    const result = await collection.find(query)
      .sort({ fecha: -1 })
      .toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error obteniendo transacciones por cuenta:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al obtener transacciones por cuenta',
      detalle: error.message
    });
  }
});

// Crear nueva transacción (nuevo endpoint)
app.post("/transactions", verificarConexion, async (req, res) => {
  try {
    const { cuenta, tipo, monto, fecha } = req.body;
    
    // Validaciones
    if (!cuenta || !tipo || !monto) {
      return res.status(400).json({
        error: true,
        mensaje: 'Cuenta, tipo y monto son requeridos'
      });
    }
    
    if (!['deposito', 'retiro'].includes(tipo)) {
      return res.status(400).json({
        error: true,
        mensaje: 'Tipo debe ser "deposito" o "retiro"'
      });
    }
    
    if (typeof monto !== 'number' || monto <= 0) {
      return res.status(400).json({
        error: true,
        mensaje: 'Monto debe ser un número mayor a 0'
      });
    }
    
    const transaccion = {
      cuenta,
      tipo,
      monto,
      fecha: fecha ? new Date(fecha) : new Date()
    };
    
    let collection = await db.collection("transacciones");
    let result = await collection.insertOne(transaccion, {
      writeConcern: { w: 'majority', j: true, wtimeout: 5000 }
    });
    
    res.status(201).json({
      success: true,
      mensaje: 'Transacción creada correctamente',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error creando transacción:', error);
    res.status(500).json({
      error: true,
      mensaje: 'Error al crear transacción',
      detalle: error.message
    });
  }
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    error: true,
    mensaje: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: true,
    mensaje: 'Endpoint no encontrado',
    ruta: req.originalUrl
  });
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  try {
    await client.close();
    console.log('✅ Conexión a MongoDB cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error);
    process.exit(1);
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en puerto ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});