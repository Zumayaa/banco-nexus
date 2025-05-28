import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco';

const client = new MongoClient(uri, {
  readPreference: 'primaryPreferred', 
  w: 'majority', 
  journal: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

async function verificarReplicaSet() {
  try {
    console.log('\n=== VERIFICACIÓN DEL REPLICA SET ===');
    
    const admin = client.db('admin');
    const status = await admin.command({ replSetGetStatus: 1 });
    
    console.log('Estado del Replica Set rsBanco:');
    status.members.forEach((member, index) => {
      console.log(`  Nodo ${index + 1}: ${member.name} - Estado: ${member.stateStr}`);
      if (member.stateStr === 'PRIMARY') {
        console.log(`    ✓ Nodo primario identificado: ${member.name}`);
      }
    });

    const isMaster = await admin.command({ isMaster: 1 });
    console.log(`\nNodo actual conectado: ${isMaster.me}`);
    console.log(`¿Es nodo primario?: ${isMaster.ismaster ? 'Sí' : 'No'}`);
    
    return true;
  } catch (error) {
    console.error('Error verificando Replica Set:', error.message);
    return false;
  }
}

async function crearBDConReplicacion() {
  try {
    console.log('\n=== INICIANDO CONEXIÓN AL REPLICA SET ===');
    await client.connect();
    console.log('✓ Conectado exitosamente al Replica Set rsBanco');

    // Verificar estado del Replica Set
    const replicaOK = await verificarReplicaSet();
    if (!replicaOK) {
      throw new Error('Replica Set no está funcionando correctamente');
    }

    const db = client.db('banco_nexus');

    // Crear colecciones con configuración de replicación
    const clientes = db.collection('clientes');
    const cuentas = db.collection('cuentas');
    const transacciones = db.collection('transacciones');

    console.log('\n=== INSERTANDO DATOS ===');

    // Datos de clientes
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

    // Datos de cuentas
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

    // Datos de transacciones
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

    // Insertar datos con confirmación de mayoría
    console.log('Insertando clientes...');
    const resultClientes = await clientes.insertMany(clientesData, { 
      writeConcern: { w: 'majority', j: true, wtimeout: 10000 } 
    });
    console.log(`✓ ${resultClientes.insertedCount} clientes insertados`);

    console.log('Insertando cuentas...');
    const resultCuentas = await cuentas.insertMany(cuentasData, { 
      writeConcern: { w: 'majority', j: true, wtimeout: 10000 } 
    });
    console.log(`✓ ${resultCuentas.insertedCount} cuentas insertadas`);

    console.log('Insertando transacciones...');
    const resultTransacciones = await transacciones.insertMany(transaccionesData, { 
      writeConcern: { w: 'majority', j: true, wtimeout: 10000 } 
    });
    console.log(`✓ ${resultTransacciones.insertedCount} transacciones insertadas`);

    // Verificar integridad de datos después de replicación
    await verificarIntegridadDatos(db);

    console.log('\n✅ Base de datos creada exitosamente en el Replica Set rsBanco');

  } catch (error) {
    console.error('\n❌ Error creando la base de datos:', error.message);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

async function verificarIntegridadDatos(db) {
  console.log('\n=== VERIFICACIÓN DE INTEGRIDAD DE DATOS ===');
  
  try {
    const clientes = db.collection('clientes');
    const cuentas = db.collection('cuentas');
    const transacciones = db.collection('transacciones');

    // Contar documentos en cada colección
    const conteoClientes = await clientes.countDocuments();
    const conteoCuentas = await cuentas.countDocuments();
    const conteoTransacciones = await transacciones.countDocuments();

    console.log(`📊 Conteo de documentos:`);
    console.log(`  - Clientes: ${conteoClientes}`);
    console.log(`  - Cuentas: ${conteoCuentas}`);
    console.log(`  - Transacciones: ${conteoTransacciones}`);

    // Verificar integridad referencial
    console.log('\n🔍 Verificando integridad referencial...');
    
    // Verificar que todas las cuentas tienen cliente válido
    const cuentasSinCliente = await cuentas.aggregate([
      {
        $lookup: {
          from: 'clientes',
          localField: 'cliente',
          foreignField: 'curp',
          as: 'clienteInfo'
        }
      },
      {
        $match: { clienteInfo: { $size: 0 } }
      }
    ]).toArray();

    if (cuentasSinCliente.length === 0) {
      console.log('  ✓ Todas las cuentas tienen cliente válido');
    } else {
      console.log(`  ❌ ${cuentasSinCliente.length} cuentas sin cliente válido`);
    }

    // Verificar que todas las transacciones tienen cuenta válida
    const transaccionesSinCuenta = await transacciones.aggregate([
      {
        $lookup: {
          from: 'cuentas',
          localField: 'cuenta',
          foreignField: 'cuenta',
          as: 'cuentaInfo'
        }
      },
      {
        $match: { cuentaInfo: { $size: 0 } }
      }
    ]).toArray();

    if (transaccionesSinCuenta.length === 0) {
      console.log('  ✓ Todas las transacciones tienen cuenta válida');
    } else {
      console.log(`  ❌ ${transaccionesSinCuenta.length} transacciones sin cuenta válida`);
    }

    // Verificar consistencia de saldos
    console.log('\n💰 Verificando consistencia de saldos...');
    const resumenSaldos = await cuentas.aggregate([
      {
        $group: {
          _id: null,
          saldoTotal: { $sum: '$saldo' },
          saldoPromedio: { $avg: '$saldo' },
          saldoMaximo: { $max: '$saldo' },
          saldoMinimo: { $min: '$saldo' }
        }
      }
    ]).toArray();

    if (resumenSaldos.length > 0) {
      const resumen = resumenSaldos[0];
      console.log(`  💵 Saldo total en el sistema: $${resumen.saldoTotal}`);
      console.log(`  📊 Saldo promedio: $${resumen.saldoPromedio.toFixed(2)}`);
      console.log(`  📈 Saldo máximo: $${resumen.saldoMaximo}`);
      console.log(`  📉 Saldo mínimo: $${resumen.saldoMinimo}`);
    }

    // Verificar datos en nodos secundarios
    await verificarReplicacionEnSecundarios();

    console.log('\n✅ Verificación de integridad completada');

  } catch (error) {
    console.error('❌ Error en verificación de integridad:', error.message);
    throw error;
  }
}

async function verificarReplicacionEnSecundarios() {
  console.log('\n🔄 Verificando replicación en nodos secundarios...');
  
  try {
    // Crear nueva conexión para leer desde secundarios
    const clienteSecundario = new MongoClient(uri, {
      readPreference: 'secondaryPreferred' // Leer desde secundarios
    });

    await clienteSecundario.connect();
    const dbSecundario = clienteSecundario.db('banco_nexus');

    // Esperar un momento para asegurar replicación
    console.log('  ⏱️  Esperando replicación...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar datos en secundarios
    const clientesSecundario = await dbSecundario.collection('clientes').countDocuments();
    const cuentasSecundario = await dbSecundario.collection('cuentas').countDocuments();
    const transaccionesSecundario = await dbSecundario.collection('transacciones').countDocuments();

    console.log(`  📊 Conteo en nodos secundarios:`);
    console.log(`    - Clientes: ${clientesSecundario}`);
    console.log(`    - Cuentas: ${cuentasSecundario}`);
    console.log(`    - Transacciones: ${transaccionesSecundario}`);

    if (clientesSecundario === 10 && cuentasSecundario === 10 && transaccionesSecundario === 10) {
      console.log('  ✅ Datos replicados correctamente en nodos secundarios');
    } else {
      console.log('  ⚠️  Posible inconsistencia en la replicación');
    }

    await clienteSecundario.close();

  } catch (error) {
    console.error('  ❌ Error verificando replicación en secundarios:', error.message);
  }
}

// Función principal para ejecutar el script
async function main() {
  console.log('🏦 BANCO NEXUS - CONFIGURACIÓN DE BASE DE DATOS CON REPLICA SET');
  console.log('================================================================');
  
  try {
    await crearBDConReplicacion();
  } catch (error) {
    console.error('\n💥 Error fatal:', error.message);
    process.exit(1);
  }
}

export { crearBDConReplicacion, verificarIntegridadDatos };