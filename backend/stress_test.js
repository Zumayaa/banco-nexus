import { MongoClient } from 'mongodb';
const uri = 'mongodb://localhost:27017';
let client
try {
  client = new MongoClient(uri);
  await client.connect();
  const db = client.db('banco_nexus');
  const accounts = db.collection('cuentas');
  const transactions = db.collection('transacciones');
  async function trans(account, amount, kind, branch) {

    const trans = {
      cuenta: account,
      monto: amount,
      tipo: kind,
      sucursal: branch,
      fecha: new Date().toISOString(),
    }
    const t_res = await transactions.insertOne(trans)
    const operator = (kind == "deposit") ? 1 : -1
    const acc_res = await accounts.updateOne({ cuenta: account }, { $inc: { saldo: operator * amount } })
  }

  const branches = ["chametla", "cdmx", "centenario"]
  const kinds = ["deposito", "retiro"]

  for (let i = 100; i < 110; i++) {
    const ki = Math.trunc((Math.random() * 100) % kinds.length)
    const bi = Math.trunc((Math.random() * 100) % branches.length)
    const kind = kinds[ki]
    const branch = branches[bi]
    await trans(i.toString(), i * 1.5, kind, branch)
  }

  const t = await transactions.find({})
    .limit(100)
    .toArray();

  console.log(t);


} catch (error) {
  console.log(error);
} finally {
  client.close()
}

