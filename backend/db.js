import { MongoClient } from "mongodb";

// URI de conexión para el Replica Set rsBanco
const connectionString = "mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco";

const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  readPreference: 'primaryPreferred', // Prioriza lectura del primario
  w: 'majority', // Confirmación de escritura en mayoría
  journal: true, // Confirma escritura en journal
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true, // Reintenta escrituras automáticamente
  retryReads: true   // Reintenta lecturas automáticamente
});

let conn;
let db;

async function conectarBD() {
  try {
    console.log('🔌 Conectando al Replica Set rsBanco...');
    conn = await client.connect();
    
    // Verificar estado del Replica Set
    const admin = client.db('admin');
    const isMaster = await admin.command({ isMaster: 1 });
    console.log(`✅ Conectado a: ${isMaster.me}`);
    console.log(`🎯 Nodo primario: ${isMaster.ismaster ? 'Sí' : 'No'}`);
    
    db = conn.db("banco_nexus");
    console.log('🏦 Base de datos banco_nexus lista');
    
  } catch (error) {
    console.error('❌ Error de conexión al Replica Set:', error.message);
    
    // Manejo de errores específicos
    if (error.message.includes('No replica set members')) {
      console.error('🔧 Verifica que el Replica Set esté iniciado correctamente');
    } else if (error.message.includes('connection refused')) {
      console.error('🔧 Verifica que los nodos MongoDB estén ejecutándose en los puertos correctos');
    }
    
    throw error;
  }
}

// Función para verificar el estado del Replica Set
async function verificarEstadoReplica() {
  try {
    if (!conn) {
      throw new Error('No hay conexión establecida');
    }
    
    const admin = client.db('admin');
    const status = await admin.command({ replSetGetStatus: 1 });
    
    console.log('\n📊 Estado del Replica Set:');
    status.members.forEach((member, index) => {
      const estado = member.stateStr === 'PRIMARY' ? '🔴' : 
                    member.stateStr === 'SECONDARY' ? '🟢' : '🟡';
      console.log(`  ${estado} Nodo ${index + 1}: ${member.name} - ${member.stateStr}`);
    });
    
    return status;
  } catch (error) {
    console.error('❌ Error verificando estado del Replica Set:', error.message);
    throw error;
  }
}

// Función para manejar failover automático
async function manejarFailover() {
  try {
    console.log('🔄 Detectando cambio en nodo primario...');
    await verificarEstadoReplica();
    console.log('✅ Failover manejado correctamente');
  } catch (error) {
    console.error('❌ Error en manejo de failover:', error.message);
    throw error;
  }
}

// Inicializar conexión al importar el módulo
try {
  await conectarBD();
} catch (error) {
  console.error('💥 Error fatal de conexión:', error);
  process.exit(1);
}

// Manejar eventos de conexión
client.on('serverDescriptionChanged', (event) => {
  console.log(`🔄 Cambio en servidor: ${event.address} - ${event.newDescription.type}`);
});

client.on('topologyDescriptionChanged', (event) => {
  console.log('🌐 Cambio en topología del Replica Set');
  manejarFailover().catch(console.error);
});

export default db;
export { verificarEstadoReplica, manejarFailover, client };