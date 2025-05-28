// failoverTest.js
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testFailover() {
  try {
    await client.connect();
    console.log("Conectado al Replica Set");

    const admin = client.db("admin");

    const status = await admin.command({ replSetGetStatus: 1 });
    console.log("Estado del Replica Set:");
    status.members.forEach(member => {
      console.log(`- ${member.name} | Estado: ${member.stateStr}`);
    });

    const isMaster = await admin.command({ isMaster: 1 });
    console.log(`\n Nodo actual (isMaster): ${isMaster.me}`);
    console.log(`¿Es primario? ${isMaster.ismaster}`);

    // Simulación de operación de escritura
    const db = client.db("bancoNexus");
    const transacciones = db.collection("transacciones");

    const resultado = await transacciones.insertOne({
      cuenta: "12345678",
      tipo: "deposito",
      monto: 1000,
      fecha: new Date()
    });

    console.log("Transacción insertada:", resultado.insertedId);

    console.log("\n Operación completada correctamente. Ahora puedes apagar manualmente el nodo primario;");
    console.log("Y volver a ejecutar este script para verificar el failover.");

  } catch (err) {
    console.error("Error en la prueba de failover:", err.message);
  } finally {
    await client.close();
  }
}

testFailover();