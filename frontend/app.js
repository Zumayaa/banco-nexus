let datos = null;

function mostrarMensaje(msg, esError = false) {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = msg;
  mensaje.style.color = esError ? 'red' : 'green';
}

async function consultarCuenta() {
  const curp = document.getElementById('cuentaInput').value;
  if (!curp) {
    mostrarMensaje('Ingresa un CURP.', true);
    return;
  }

  try {
    const resCliente = await fetch(`http://localhost:3000/clients`);
    const clientes = await resCliente.json();
    const clienteData = clientes.find(c => c.curp === curp);

    if (!clienteData) {
      mostrarMensaje('Cliente no encontrado', true);
      return;
    }

    const resCuenta = await fetch(`http://localhost:3000/accounts/${curp}`);
    const cuentas = await resCuenta.json();

    if (!cuentas || cuentas.length === 0) {
      mostrarMensaje('Cuenta no encontrada', true);
      return;
    }

    const cuentaData = cuentas[0];

    const resTrans = await fetch(`http://localhost:3000/transactions/${cuentaData.cuenta}`);
    const transaccionesData = await resTrans.json();

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

async function consultarClientesConTodo() {
  try {
    const resClientes = await fetch("http://localhost:3000/clients");
    const clientes = await resClientes.json();

    const resCuentas = await fetch("http://localhost:3000/accounts");
    const cuentas = await resCuentas.json();

    const resTrans = await fetch("http://localhost:3000/transactions");
    const transacciones = await resTrans.json();

    for (const client of clientes) {
      const cuentaData = cuentas.find(c => c.cliente === client.curp);

      if (!cuentaData) continue;

      const transCliente = transacciones.filter(t => t.cuenta === cuentaData.cuenta);

      client.cuenta = cuentaData;
      client.transacciones = transCliente;
    }

    const contenedor = document.getElementById('resultado');
    contenedor.innerHTML = clientes
      .filter(client => client.cuenta)
      .map(client => {
        const transaccionesHTML = client.transacciones.map(t => {
          const fecha = new Date(t.fecha).toLocaleDateString();
          return `<li>${t.tipo} de $${t.monto} el ${fecha} en ${t.sucursal}</li>`;
        }).join('');
        return `
          <div class="cliente">
            <a href="./account.html?cuenta=${client.cuenta.cuenta}&curp=${client.curp}"><strong>Nombre:</strong> ${client.nombre}</a>
            <p><strong>Cuenta:</strong> ${client.cuenta.cuenta}</p>
            <p><strong>Saldo:</strong> $${client.cuenta.saldo.toFixed(2)}</p>
            <h5>Movimientos:</h5>
            <ul>${transaccionesHTML}</ul>
          </div>
          <hr>
        `;
      }).join('');

    contenedor.style.display = 'block';
  } catch (err) {
    console.error(err);
    mostrarMensaje('Error al consultar todos los clientes.', true);
  }
}
consultarClientesConTodo()
mostrarDatos()
