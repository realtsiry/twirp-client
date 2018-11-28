const api = require('request')
const parse = require('proto-parse')
const fs = require('fs')

const TwirpClient = {
  create(url, proto) {
    const data = parse(fs.readFileSync(proto).toString())
    const client = {}
    const pkg = data.content.filter(x => x.type === 'package')[0]
    const services = data.content.filter(x => x.type === 'service')
    client['package'] = pkg.package

    if (!pkg) {
      throw new Error('Invalid proto file!')
    }

    if (services.length === 0) {
      throw new Error('Invalid proto file!')
    }
    
    services.map(item => {
      const rpc = item.content.filter(x => x.type === 'rpc')
      const methods = {}

      if (rpc.length === 0) {
        throw new Error('Invalid proto file!')
      }

      rpc.map(x => methods[x.name] = (params) => {
        return new Promise((resolve, reject) => {
          api.post(`${url}/${client.package}.${item.name}/${x.name}`, { json: params }, (err, res) => {
            if (err) {
              reject(err)
              return
            }
            resolve(res)
          })
        })
      })
      
      client[item.name] = methods
    })

    return client
  }
}

module.exports = TwirpClient