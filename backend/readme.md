http://localhost:3000/clients

```js
let render_clients
const clients = await fetch("http://localhost:3000/clients")
const render_clients = clients.json()
render_clients.forEach(async (client) => {
    const acc_data = await fetch(`http://localhost:3000/accounts/${client.curp}`)
    const acc_json = await acc_data.json()

    const trans_data = await fetch(`http://localhost:3000/transactions/${acc_json.cuenta}`)
    const trans_json = await trans_data.json()

    client.account_data = acc_json
    client.acc_transactions = trans_json
})
```
