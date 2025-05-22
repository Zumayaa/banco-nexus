let datos = null;

function mostrarMensaje(msg, esError = false) {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = msg;
  mensaje.style.color = esError ? 'red' : 'green';
}

async function consultarCuenta() {
  const cuenta = document.getElementById('cuentaInput').value;
  if (!cuenta) {
    mostrarMensaje('Ingresa un número de cuenta.', true);
    return;
  }

  try {
    const resCuenta = await fetch(`http://localhost:3000/accounts/${cuenta}`);
    const cuentaData = await resCuenta.json();
    
    if (!cuentaData) {
      mostrarMensaje('Cuenta no encontrada', true);
      return;
    }

    const resCliente = await fetch(`http://localhost:3000/clients/${cuentaData.cliente}`);
    const clienteData = await resCliente.json();

    const resTrans = await fetch(`http://localhost:3000/transactions`);
    const todasTransacciones = await resTrans.json();
    
    const transaccionesData = todasTransacciones.filter(t => t.cuenta === cuenta);

    datos = {
      nombre: clienteData.nombre,
      saldo: cuentaData.saldo,
      transacciones: transaccionesData.map(t => ({
        tipo: t.tipo,
        monto: t.monto,
        fecha: t.fecha
      }))
    };

    mostrarMensaje('');
    mostrarDatos();
  } catch (err) {
    console.error(err);
    mostrarMensaje('Error al consultar la cuenta.', true);
  }
}

function mostrarDatos() {
  const contenedor = document.getElementById('resultado');
  if (!datos) return;

  const transacciones = datos.transacciones.map(t => {
    const fecha = new Date(t.fecha).toLocaleDateString();
    return `<li>${t.tipo} de $${t.monto} el ${fecha}</li>`;
  }).join('');

  contenedor.innerHTML = `
    <div class="resultado">
      <p><strong>Nombre:</strong> ${datos.nombre}</p>
      <p><strong>Saldo:</strong> $${datos.saldo.toFixed(2)}</p>
      <h4>Movimientos:</h4>
      <ul>${transacciones}</ul>
    </div>
  `;
  contenedor.style.display = 'block';
}

async function realizarOperacion(tipo) {
  const cuenta = document.getElementById('cuentaInput').value;
  const monto = document.getElementById('montoInput').value;

  if (!cuenta || !monto) {
    mostrarMensaje('Debes ingresar un número de cuenta y un monto válido.', true);
    return;
  }

  try {
    const resCuenta = await fetch(`http://localhost:3000/accounts/${cuenta}`);
    const cuentaData = await resCuenta.json();
    
    if (!cuentaData) {
      mostrarMensaje('Cuenta no encontrada', true);
      return;
    }

    if (tipo === 'retiro' && cuentaData.saldo < parseFloat(monto)) {
      mostrarMensaje('Saldo insuficiente', true);
      return;
    }

    const transaccion = {
      cuenta: cuenta,
      tipo: tipo,
      monto: parseFloat(monto),
      fecha: new Date()
    };

    const nuevoSaldo = tipo === 'deposito' 
      ? cuentaData.saldo + parseFloat(monto)
      : cuentaData.saldo - parseFloat(monto);

    await fetch(`http://localhost:3000/accounts/${cuenta}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ saldo: nuevoSaldo })
    });

    await fetch('http://localhost:3000/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaccion)
    });

    mostrarMensaje(`${tipo === 'deposito' ? 'Depósito' : 'Retiro'} realizado con éxito`);
    consultarCuenta(); 
  } catch (err) {
    console.error(err);
    mostrarMensaje('Error en la operación.', true);
  }
}