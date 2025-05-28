// app.js - Frontend con manejo de errores y alertas de réplica
let datos = null;
let intervaloPing = null;

// Función para mostrar mensajes con diferentes tipos
function mostrarMensaje(msg, tipo = 'info') {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = msg;
  
  // Remover clases anteriores
  mensaje.classList.remove('success', 'error', 'warning', 'info');
  
  // Agregar clase según el tipo
  mensaje.classList.add(tipo);
  
  // Colores según el tipo
  const colores = {
    'success': 'green',
    'error': 'red',
    'warning': 'orange',
    'info': 'blue'
  };
  
  mensaje.style.color = colores[tipo] || 'blue';
}

// Función para mostrar alertas de sistema
function mostrarAlerta(mensaje, tipo = 'warning') {
  const alertContainer = document.getElementById('alert-container') || crearContenedorAlertas();
  
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  alerta.innerHTML = `
    <span>${mensaje}</span>
    <button onclick="this.parentElement.remove()">×</button>
  `;
  
  alertContainer.appendChild(alerta);
  
  // Auto-remover después de 10 segundos
  setTimeout(() => {
    if (alerta.parentElement) {
      alerta.remove();
    }
  }, 10000);
}

function crearContenedorAlertas() {
  const container = document.createElement('div');
  container.id = 'alert-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
  `;
  document.body.appendChild(container);
  return container;
}

// Función para verificar el estado del sistema
async function verificarEstadoSistema() {
  try {
    const response = await fetch('http://localhost:3000/health');
    const estado = await response.json();
    
    if (response.ok && estado.status === 'OK') {
      document.getElementById('status-indicator').innerHTML = '🟢 Sistema operativo';
      document.getElementById('replica-info').innerHTML = `
        <small>
          Replica Set: ${estado.replica_set.name} | 
          Nodos activos: ${estado.replica_set.miembros_activos}/${estado.replica_set.total_miembros} | 
          Primario: ${estado.replica_set.primario}
        </small>
      `;
    } else {
      throw new Error('Sistema no disponible');
    }
  } catch (error) {
    document.getElementById('status-indicator').innerHTML = '🔴 Sistema con problemas';
    mostrarAlerta('⚠️ Problemas de conectividad con el sistema bancario', 'warning');
    console.error('Error verificando estado:', error);
  }
}

// Función mejorada para manejar errores de API
async function manejarRespuestaAPI(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 503) {
      mostrarAlerta('🔄 El sistema está procesando cambios en la infraestructura. Reintentando...', 'warning');
      // Reintentar después de 3 segundos
      setTimeout(() => window.location.reload(), 3000);
    } else if (response.status === 500) {
      mostrarAlerta('❌ Error interno del servidor. Contacte al administrador.', 'error');
    }
    
    throw new Error(errorData.mensaje || 'Error en la operación');
  }
  
  return response.json();
}

async function consultarCuenta() {
  const curp = document.getElementById('cuentaInput').value.trim();
  if (!curp) {
    mostrarMensaje('Ingresa un CURP válido.', 'error');
    return;
  }

  try {
    mostrarMensaje('Consultando información...', 'info');
    
    // Obtener cliente
    const resCliente = await fetch('http://localhost:3000/clients');
    const clientes = await manejarRespuestaAPI(resCliente);
    const clienteData = clientes.find(c => c.curp === curp);

    if (!clienteData) {
      mostrarMensaje('Cliente no encontrado con ese CURP', 'error');
      return;
    }

    // Obtener cuentas
    const resCuenta = await fetch(`http://localhost:3000/accounts/${curp}`);
    const cuentas = await manejarRespuestaAPI(resCuenta);

    if (!cuentas || cuentas.length === 0) {
      mostrarMensaje('No se encontraron cuentas para este cliente', 'error');
      return;
    }

    const cuentaData = cuentas[0];

    // Obtener transacciones
    const resTrans = await fetch(`http://localhost:3000/transactions/${cuentaData.cuenta}`);
    const transaccionesData = await manejarRespuestaAPI(resTrans);

    datos = {
      nombre: clienteData.nombre,
      curp: clienteData.curp,
      cuenta: cuentaData.cuenta,
      saldo: cuentaData.saldo,
      transacciones: transaccionesData.map(t => ({
        tipo: t.tipo,
        monto: t.monto,
        fecha: t.fecha
      }))
    };

    mostrarMensaje('Información cargada exitosamente', 'success');
    mostrarDatos();
  } catch (err) {
    console.error('Error en consulta:', err);
    mostrarMensaje(err.message || 'Error al consultar la cuenta.', 'error');
  }
}

function mostrarDatos() {
  const contenedor = document.getElementById('resultado');
  if (!datos) return;

  const transacciones = datos.transacciones.map(t => {
    const fecha = new Date(t.fecha).toLocaleDateString('es-MX');
    const icono = t.tipo === 'deposito' ? '💰' : '💸';
    return `<li>${icono} ${t.tipo.toUpperCase()} de $${t.monto.toLocaleString('es-MX')} el ${fecha}</li>`;
  }).join('');

  contenedor.innerHTML = `
    <div class="resultado">
      <h3>💳 Información de la Cuenta</h3>
      <p><strong>👤 Titular:</strong> ${datos.nombre}</p>
      <p><strong>🆔 CURP:</strong> ${datos.curp}</p>
      <p><strong>🏦 Número de cuenta:</strong> ${datos.cuenta}</p>
      <p><strong>💵 Saldo actual:</strong> $${datos.saldo.toLocaleString('es-MX')}</p>
      <h4>📊 Historial de Movimientos (${datos.transacciones.length}):</h4>
      ${datos.transacciones.length > 0 ? `<ul>${transacciones}</ul>` : '<p>No hay movimientos registrados</p>'}
    </div>
  `;
  contenedor.style.display = 'block';
}

async function realizarOperacion(tipo) {
  const curp = document.getElementById('cuentaInput').value.trim();
  const monto = parseFloat(document.getElementById('montoInput').value);

  if (!curp) {
    mostrarMensaje('Debes ingresar un CURP válido.', 'error');
    return;
  }

  if (!monto || monto <= 0) {
    mostrarMensaje('Debes ingresar un monto válido mayor a 0.', 'error');
    return;
  }

  try {
    mostrarMensaje(`Procesando ${tipo}...`, 'info');

    // Obtener información de la cuenta actual
    const resCuenta = await fetch(`http://localhost:3000/accounts/${curp}`);
    const cuentas = await manejarRespuestaAPI(resCuenta);
    
    if (!cuentas || cuentas.length === 0) {
      mostrarMensaje('Cuenta no encontrada', 'error');
      return;
    }

    const cuentaData = cuentas[0];

    // Validar fondos suficientes para retiro
    if (tipo === 'retiro' && cuentaData.saldo < monto) {
      mostrarMensaje(`Saldo insuficiente. Disponible: $${cuentaData.saldo.toLocaleString('es-MX')}`, 'error');
      return;
    }

    // Calcular nuevo saldo
    const nuevoSaldo = tipo === 'deposito' 
      ? cuentaData.saldo + monto
      : cuentaData.saldo - monto;

    // Crear transacción
    const transaccion = {
      cuenta: cuentaData.cuenta,
      tipo: tipo,
      monto: monto,
      fecha: new Date().toISOString()
    };

    // Actualizar saldo
    const resActualizar = await fetch(`http://localhost:3000/accounts/${cuentaData.cuenta}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ saldo: nuevoSaldo })
    });

    await manejarRespuestaAPI(resActualizar);

    // Registrar transacción
    const resTransaccion = await fetch('http://localhost:3000/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaccion)
    });

    await manejarRespuestaAPI(resTransaccion);

    const operacion = tipo === 'deposito' ? 'Depósito' : 'Retiro';
    mostrarMensaje(`✅ ${operacion} de $${monto.toLocaleString('es-MX')} realizado exitosamente`, 'success');
    
    // Limpiar campo de monto
    document.getElementById('montoInput').value = '';
    
    // Actualizar información mostrada
    setTimeout(() => consultarCuenta(), 1000);
    
  } catch (err) {
    console.error('Error en operación:', err);
    mostrarMensaje(err.message || 'Error en la operación bancaria.', 'error');
  }
}

async function consultarClientesConTodo() {
  try {
    mostrarMensaje('Cargando información de todos los clientes...', 'info');

    const [resClientes, resCuentas, resTrans] = await Promise.all([
      fetch("http://localhost:3000/clients"),
      fetch("http://localhost:3000/accounts"),
      fetch("http://localhost:3000/transactions")
    ]);

    const clientes = await manejarRespuestaAPI(resClientes);
    const cuentas = await manejarRespuestaAPI(resCuentas);
    const transacciones = await manejarRespuestaAPI(resTrans);

    // Combinar información
    for (const client of clientes) {
      const cuentaData = cuentas.find(c => c.cliente === client.curp);

      if (!cuentaData) continue;

      const transCliente = transacciones.filter(t => t.cuenta === cuentaData.cuenta);

      client.cuenta = cuentaData;
      client.transacciones = transCliente;
    }

    const contenedor = document.getElementById('resultado');
    const clientesConCuenta = clientes.filter(client => client.cuenta);
    
    if (clientesConCuenta.length === 0) {
      contenedor.innerHTML = '<p>No se encontraron clientes con cuentas activas</p>';
    } else {
      contenedor.innerHTML = `
        <h3>📋 Resumen de todos los clientes (${clientesConCuenta.length})</h3>
        ${clientesConCuenta.map(client => {
          const transaccionesHTML = client.transacciones.map(t => {
            const fecha = new Date(t.fecha).toLocaleDateString('es-MX');
            const icono = t.tipo === 'deposito' ? '💰' : '💸';
            return `<li>${icono} ${t.tipo.toUpperCase()} de $${t.monto.toLocaleString('es-MX')} el ${fecha}</li>`;
          }).join('');

          return `
            <div class="cliente">
              <h4>👤 ${client.nombre}</h4>
              <p><strong>🆔 CURP:</strong> ${client.curp}</p>
              <p><strong>🏦 Cuenta:</strong> ${client.cuenta.cuenta}</p>
              <p><strong>💵 Saldo:</strong> $${client.cuenta.saldo.toLocaleString('es-MX')}</p>
              <details>
                <summary><strong>📊 Movimientos (${client.transacciones.length})</strong></summary>
                ${client.transacciones.length > 0 ? `<ul>${transaccionesHTML}</ul>` : '<p>Sin movimientos</p>'}
              </details>
            </div>
            <hr>
          `;
        }).join('')}
      `;
    }

    contenedor.style.display = 'block';
    mostrarMensaje(`✅ Información de ${clientesConCuenta.length} clientes cargada`, 'success');
    
  } catch (err) {
    console.error('Error consultando clientes:', err);
    mostrarMensaje(err.message || 'Error al consultar todos los clientes.', 'error');
  }
}

// Función para reiniciar la aplicación (simula persistencia tras reinicio)
function reiniciarAplicacion() {
  if (confirm('¿Estás seguro de que deseas reiniciar la aplicación? Esto simulará un reinicio del sistema.')) {
    mostrarMensaje('🔄 Reiniciando aplicación...', 'info');
    
    setTimeout(() => {
      // Limpiar datos locales
      datos = null;
      document.getElementById('cuentaInput').value = '';
      document.getElementById('montoInput').value = '';
      document.getElementById('resultado').style.display = 'none';
      
      // Verificar estado del sistema después del reinicio
      verificarEstadoSistema();
      mostrarMensaje('✅ Aplicación reiniciada correctamente', 'success');
    }, 2000);
  }
}

// Función para exportar datos (funcionalidad adicional)
function exportarDatos() {
  if (!datos) {
    mostrarMensaje('No hay datos para exportar. Consulta una cuenta primero.', 'warning');
    return;
  }

  try {
    const datosExport = {
      cliente: {
        nombre: datos.nombre,
        curp: datos.curp,
        cuenta: datos.cuenta,
        saldo: datos.saldo
      },
      transacciones: datos.transacciones,
      fechaExportacion: new Date().toISOString(),
      sistema: 'Banco Nexus v1.0'
    };

    const jsonData = JSON.stringify(datosExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuenta_${datos.cuenta}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarMensaje('✅ Datos exportados correctamente', 'success');
  } catch (error) {
    console.error('Error exportando datos:', error);
    mostrarMensaje('❌ Error al exportar datos', 'error');
  }
}

// Función para monitoreo continuo del sistema
function iniciarMonitoreo() {
  // Verificar estado inicial
  verificarEstadoSistema();
  
  // Configurar verificación periódica cada 30 segundos
  intervaloPing = setInterval(() => {
    verificarEstadoSistema();
  }, 30000);
  
  console.log('🔍 Monitoreo del sistema iniciado');
}

function detenerMonitoreo() {
  if (intervaloPing) {
    clearInterval(intervaloPing);
    intervaloPing = null;
    console.log('⏹️ Monitoreo del sistema detenido');
  }
}

// Función para limpiar formularios
function limpiarFormularios() {
  document.getElementById('cuentaInput').value = '';
  document.getElementById('montoInput').value = '';
  document.getElementById('resultado').style.display = 'none';
  datos = null;
  mostrarMensaje('📝 Formularios limpiados', 'info');
}

// Función para mostrar estadísticas del sistema
async function mostrarEstadisticas() {
  try {
    mostrarMensaje('Cargando estadísticas del sistema...', 'info');
    
    const [resClientes, resCuentas, resTrans] = await Promise.all([
      fetch("http://localhost:3000/clients"),
      fetch("http://localhost:3000/accounts"),
      fetch("http://localhost:3000/transactions")
    ]);

    const clientes = await manejarRespuestaAPI(resClientes);
    const cuentas = await manejarRespuestaAPI(resCuentas);
    const transacciones = await manejarRespuestaAPI(resTrans);

    // Calcular estadísticas
    const totalClientes = clientes.length;
    const totalCuentas = cuentas.length;
    const totalTransacciones = transacciones.length;
    const saldoTotal = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
    const depositos = transacciones.filter(t => t.tipo === 'deposito');
    const retiros = transacciones.filter(t => t.tipo === 'retiro');
    const montoDepositos = depositos.reduce((sum, t) => sum + t.monto, 0);
    const montoRetiros = retiros.reduce((sum, t) => sum + t.monto, 0);

    const contenedor = document.getElementById('resultado');
    contenedor.innerHTML = `
      <div class="estadisticas">
        <h3>📊 Estadísticas del Sistema Bancario</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <h4>👥 Clientes</h4>
            <p class="stat-number">${totalClientes}</p>
          </div>
          <div class="stat-card">
            <h4>🏦 Cuentas Activas</h4>
            <p class="stat-number">${totalCuentas}</p>
          </div>
          <div class="stat-card">
            <h4>💰 Saldo Total</h4>
            <p class="stat-number">$${saldoTotal.toLocaleString('es-MX')}</p>
          </div>
          <div class="stat-card">
            <h4>📈 Total Transacciones</h4>
            <p class="stat-number">${totalTransacciones}</p>
          </div>
          <div class="stat-card">
            <h4>💵 Depósitos</h4>
            <p class="stat-number">${depositos.length}</p>
            <p class="stat-amount">$${montoDepositos.toLocaleString('es-MX')}</p>
          </div>
          <div class="stat-card">
            <h4>💸 Retiros</h4>
            <p class="stat-number">${retiros.length}</p>
            <p class="stat-amount">$${montoRetiros.toLocaleString('es-MX')}</p>
          </div>
        </div>
        <div class="system-info">
          <h4>🖥️ Información del Sistema</h4>
          <p><strong>Última actualización:</strong> ${new Date().toLocaleString('es-MX')}</p>
          <p><strong>Estado:</strong> <span id="system-status">Verificando...</span></p>
        </div>
      </div>
    `;
    
    contenedor.style.display = 'block';
    mostrarMensaje('✅ Estadísticas cargadas correctamente', 'success');
    
    // Verificar estado del sistema y actualizar
    verificarEstadoSistema().then(() => {
      const statusElement = document.getElementById('system-status');
      const statusIndicator = document.getElementById('status-indicator');
      if (statusElement && statusIndicator) {
        statusElement.innerHTML = statusIndicator.innerHTML;
      }
    });
    
  } catch (err) {
    console.error('Error cargando estadísticas:', err);
    mostrarMensaje(err.message || 'Error al cargar estadísticas del sistema.', 'error');
  }
}

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Aplicación Banco Nexus iniciada');
  iniciarMonitoreo();
  
  // Agregar estilos CSS dinámicamente para las alertas
  const style = document.createElement('style');
  style.textContent = `
    .alert {
      padding: 12px 16px;
      margin: 8px 0;
      border-radius: 8px;
      position: relative;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .alert-warning {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
    }
    
    .alert-error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    
    .alert-success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    
    .alert-info {
      background-color: #d1ecf1;
      border: 1px solid #bee5eb;
      color: #0c5460;
    }
    
    .alert button {
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: inherit;
      opacity: 0.7;
    }
    
    .alert button:hover {
      opacity: 1;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    
    .stat-card {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
      text-align: center;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #007bff;
      margin: 8px 0;
    }
    
    .stat-amount {
      font-size: 14px;
      color: #6c757d;
      margin: 4px 0;
    }
    
    .system-info {
      background: #e9ecef;
      padding: 16px;
      border-radius: 8px;
      margin-top: 20px;
    }
  `;
  document.head.appendChild(style);
});

// Limpiar monitoreo al cerrar la página
window.addEventListener('beforeunload', function() {
  detenerMonitoreo();
  console.log('👋 Aplicación Banco Nexus cerrada');
});