// crearBaseDeDatos.js
const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
async function crearBD() {
try {
await client.connect();
const db = client.db('banco_nexus');
const clientes = db.collection('clientes');
const cuentas = db.collection('cuentas');
const transacciones = db.collection('transacciones');
await clientes.insertMany([
{ nombre: 'Ana Ruiz', curp: 'RUAA900101MDFXXX01' },
{ nombre: 'Luis Pérez', curp: 'PELU850203HDFXXX02' }
]);
await cuentas.insertMany([
{ cuenta: '001', cliente: 'RUAA900101MDFXXX01', saldo: 5000 },
{ cuenta: '002', cliente: 'PELU850203HDFXXX02', saldo: 8000 }
]);
console.log('Base de datos inicial creada con éxito.');
} finally {
await client.close();
}
}
crearBD();