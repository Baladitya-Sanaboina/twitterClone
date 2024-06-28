const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'twitterClone.db')
let db = null
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
app.use(express.json())

const connectDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`Port running on https:localhost:3000/`)
    })
  } catch (e) {
    console.log(`DB Error: '${e}'`)
    process.exit(1)
  }
}

connectDbAndServer()

const validatePassword = pass => {
  return pass.length > 4
}

const authenticateToken = async (request, response, next) => {
  const authHeader = request.headers['authorization']
  let jwtToken
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
    if (jwtToken === undefined) {
      response.status(401)
      response.send('Invalid JWT Token')
    }
    jwt.verify(jwtToken, 'MY_SECRET_KEY', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.body = payload
        next()
      }
    })
  }
}

app.post('/register/', async (request, response) => {
  const {username, password, name, gender} = request.body
  const getUser = `SELECT * FROM user WHERE username = ${username}`
  if (getUser === undefined) {
    if (validatePassword(password)) {
      const hashedPassword = await bcrypt.hash(password, 10)
      const addUserQuery = `INSERT INTO user(username,
            password, name,gender)
            VALUES(
                '${username}',
                '${hashedPassword}',
                '${name}',
                '${gender}'
            )`
      await db.run(addUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const getUser = `SELECT * FROM user WHERE username = '${username}'`
  if (getUser !== undefined) {
    const isPasswordCorrect = await bcrypt.compare(getUser.password, password)
    if (isPasswordCorrect !== undefined) {
      const payload = {username: username}
      const jwtToken = jwt.sign(payload, 'MY_SECRET_KEY')
      response.send(jwtToken)
    } else {
      response.status = 400
      response.send('Invalid password')
    }
  } else {
    response.status(400)
    response.send('Invalid user')
  }
})

app.get('/user/tweets/feed/', authenticateToken, async(request, response)=>{
    const getQuery = `SELECT * FROM follower `


})

app.get('/user/following/', authenticateToken, async(request, response)=>{
  const getQuery = `SELECT * FROM user INNER JOIN follower 
  ON follower_user_id = user_id
  `
  const dbQuery = await db.all(getQuery)
  response.send(dbQuery)
})