// database.js
import { MongoClient } from 'mongodb';

const uri = 'mongodb://0.0.0.0:27017,0.0.0.0:27018,0.0.0.0:27019/?replicaSet=rsBanco';
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

try {
  const connection = await client.connect();
  db = connection.db('banco_nexus');
  console.log('✅ Conectado al Replica Set de MongoDB con MongoClient');
} catch (err) {
  console.error('❌ Error al conectar con MongoDB Replica Set', err.message);
  process.exit(1);
}

export default db;
