const express = require('express')
const app = express()
const port = 3000

const sessions = require('../index.js')
const cookieParser = require('cookie-parser')

app.use(cookieParser('SuperSecureSecret'))
app.use(sessions());

app.get('/', (req, res) => {
  res.json(req.session())
})

app.get('/login', (req, res) => {
  res.session({'Hello': require('crypto').randomBytes(16).toString('hex')})
  return res.redirect('/')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
