import { MongoClient } from 'mongodb';
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function crearBD() {
  try {
    await client.connect();
    const db = client.db('banco_nexus');

    const clientes = db.collection('clientes');
    const cuentas = db.collection('cuentas');
    const transacciones = db.collection('transacciones');

    const clientesData = [
      { nombre: 'Ana Ruiz', curp: 'RUAA900101MDFXXX01' },
      { nombre: 'Luis Pérez', curp: 'PELU850203HDFXXX02' },
      { nombre: 'Marta Gómez', curp: 'GOMM920304MDFXXX03' },
      { nombre: 'Carlos Díaz', curp: 'DIAC750605HDFXXX04' },
      { nombre: 'Elena Torres', curp: 'TORE830706MDFXXX05' },
      { nombre: 'José Sánchez', curp: 'SAJJ880808HDFXXX06' },
      { nombre: 'Lucía Morales', curp: 'MORL940909MDFXXX07' },
      { nombre: 'Miguel Herrera', curp: 'HERM700101HDFXXX08' },
      { nombre: 'Patricia Lozano', curp: 'LOZP951112MDFXXX09' },
      { nombre: 'Andrés Castro', curp: 'CASA860213HDFXXX10' }
    ];

    const cuentasData = [
      { cuenta: '100', cliente: 'RUAA900101MDFXXX01', saldo: 5000 },
      { cuenta: '101', cliente: 'PELU850203HDFXXX02', saldo: 7500 },
      { cuenta: '102', cliente: 'GOMM920304MDFXXX03', saldo: 6200 },
      { cuenta: '103', cliente: 'DIAC750605HDFXXX04', saldo: 4100 },
      { cuenta: '104', cliente: 'TORE830706MDFXXX05', saldo: 9800 },
      { cuenta: '105', cliente: 'SAJJ880808HDFXXX06', saldo: 3000 },
      { cuenta: '106', cliente: 'MORL940909MDFXXX07', saldo: 8900 },
      { cuenta: '107', cliente: 'HERM700101HDFXXX08', saldo: 2000 },
      { cuenta: '108', cliente: 'LOZP951112MDFXXX09', saldo: 6700 },
      { cuenta: '109', cliente: 'CASA860213HDFXXX10', saldo: 4500 }
    ];

    const transaccionesData = [
      { cuenta: '100', tipo: 'deposito', monto: 1000, fecha: new Date('2025-05-01T10:00:00Z') },
      { cuenta: '101', tipo: 'retiro', monto: 500, fecha: new Date('2025-05-02T11:00:00Z') },
      { cuenta: '102', tipo: 'deposito', monto: 1500, fecha: new Date('2025-05-03T12:00:00Z') },
      { cuenta: '103', tipo: 'retiro', monto: 700, fecha: new Date('2025-05-04T13:00:00Z') },
      { cuenta: '104', tipo: 'deposito', monto: 1200, fecha: new Date('2025-05-05T14:00:00Z') },
      { cuenta: '105', tipo: 'retiro', monto: 800, fecha: new Date('2025-05-06T15:00:00Z') },
      { cuenta: '106', tipo: 'deposito', monto: 1100, fecha: new Date('2025-05-07T16:00:00Z') },
      { cuenta: '107', tipo: 'retiro', monto: 600, fecha: new Date('2025-05-08T17:00:00Z') },
      { cuenta: '108', tipo: 'deposito', monto: 1300, fecha: new Date('2025-05-09T18:00:00Z') },
      { cuenta: '109', tipo: 'retiro', monto: 900, fecha: new Date('2025-05-10T19:00:00Z') }
    ];

    await clientes.insertMany(clientesData);
    await cuentas.insertMany(cuentasData);
    await transacciones.insertMany(transaccionesData);

    console.log('Base de datos con datos definidos creada con éxito.');
  } finally {
    await client.close();
  }
}

crearBD();
