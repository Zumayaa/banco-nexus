// iniciarReplica.js (run una sola vez en mongo shell)
// Ejecutar en terminal con `mongosh`
/*
rs.initiate({
  _id: "rsBanco",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})
*/

// conexión desde Node.js
// mongoClient.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Conectado a la réplica de MongoDB');
})
.catch(err => {
  console.error('Error de conexión:', err);
});

