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
    const res = await fetch(`http://localhost:3000/api/cuenta/${cuenta}`);
    const json = await res.json();

    if (json.error) {
      mostrarMensaje(json.error, true);
      datos = null;
      document.getElementById('resultado').innerHTML = '';
    } else {
      datos = json;
      mostrarMensaje('');
      mostrarDatos();
    }
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
}

async function op(tipo) {
  const cuenta = document.getElementById('cuentaInput').value;
  const monto = document.getElementById('montoInput').value;

  if (!cuenta || !monto) {
    mostrarMensaje('Debes ingresar un número de cuenta y un monto válido.', true);
    return;
  }

  const url = tipo === 'deposito' ? '/api/deposito' : '/api/retiro';
  try {
    const res = await fetch(`http://localhost:3000${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cuentaId: parseInt(cuenta),
        monto: parseFloat(monto)
      })
    });

    const data = await res.json();
    mostrarMensaje(data.mensaje || data.error, !!data.error);
    consultar(); 
  } catch (err) {
    console.error(err);
    mostrarMensaje('Error en la operación.', true);
  }
}
