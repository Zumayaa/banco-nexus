import db from "./db.js"
import express from 'express'
import { ObjectId } from 'mongodb'
const app = express()
const port = 3000
import cors from 'cors'
const transactions = await db.collection("transacciones");
const accounts = await db.collection("cuentas");

app.use(cors())
app.use(express.json())

app.get("/clients", async (req, res) => {
  let collection = await db.collection("clientes");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
});

app.get("/clients/:id", async (req, res) => {
  let collection = await db.collection("clientes");
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.findOne(query);
  res.send(result).status(200);
});

app.get("/accounts", async (req, res) => {
  let collection = await db.collection("cuentas");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
});

app.get("/accounts/:curp", async (req, res) => {
  let collection = await db.collection("cuentas");
  let query = { cliente: req.params.curp };
  let result = await collection.findOne(query);
  console.log(result);
  res.send(result).status(200);
});

app.get("/transactions", async (req, res) => {
  let collection = await db.collection("transacciones");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
});

app.post("/transactions", async (req, res) => {
  const { quantity, action, account, sucursal } = req.body

  if (quantity < 0) {
    res.status(400).json({ error: "Numeros negativos no!" })
    return
  }

  const query = { cuenta: account };
  const acc = await accounts.findOne(query);

  if (!acc) {
    res.status(400).json({ error: "La cuenta no existe" })
    return
  }

  const xd = {
    deposit: "deposito",
    withdraw: "retiro",
  }

  switch (action) {
    case "deposit":
      acc.saldo += quantity
      break;
    case "withdraw":
      if (acc.saldo < quantity) {
        res.status(400).json({ error: "Saldo insuficiente" })
        return
      }
      acc.saldo -= quantity
      break;
  }

  const transaction = {
    cuenta: account,
    sucursal: sucursal,
    tipo: xd[action],
    monto: quantity,
    fecha: new Date().toISOString(),
  }

  const new_values = { $set: acc }

  transactions.insertOne(transaction)

  accounts.updateOne(query, new_values, function(err, res) {
    if (err) {
      res.status(400).json({ error: "Error extra;o mongodbiano!" }).status(400)
      return
    }
  })

  res.json({ data: "todo" })
});


app.get("/transactions/:account", async (req, res) => {
  let collection = db.collection("transacciones");
  var query = { cuenta: req.params.account };
  const acc = await collection.find(query).toArray();
  res.send(acc).status(200);
});

app.listen(port, () => {
  console.log(`HOT TO GO: ${port}`)
})
