const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

const ONE_MINUTE = 1000 * 60

const {
  PORT = 3000, SESS_NAME = 'test', SESS_SECRET = 'random', SESS_LIFETIME = ONE_MINUTE, NODE_ENV = 'development'
} = process.env;



const IN_PROD = NODE_ENV === 'production'

// users 
const users = [{
    id: 1,
    name: 'sonia',
    email: 'sonia@gm.com',
    password: '123'
  },
  {
    id: 2,
    name: 'Jimmy',
    email: 'jimmy@gm.com',
    password: '321'
  },
  {
    id: 3,
    name: 'max',
    email: 'max@gm.com',
    password: '54321'
  }
]

app.use(bodyParser.urlencoded({
  extended: true
}))

// Session Config

app.use(session({
  name: SESS_NAME,
  resave: false,
  saveUninitialized: false,
  secret: SESS_SECRET,
  cookie: {
    maxAge: SESS_LIFETIME,
    sameSite: true,
    secure: IN_PROD
  }
}))

//  End of Session Config

// protect routes
const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('/login')
  } else {
    next()
  }
}

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect('/home')
  } else {
    next()
  }
}

app.use((req, res, next) => {
  const {
    userId
  } = req.session
  if (userId) {
    res.locals.user = users.find(user => user.id === userId)
  }
  next()
})


// Welcome Page
app.get('/', (req, res) => {
  const {
    userId
  } = req.session

  res.send(
    ` <h1>Hello!</h1> 
      ${userId ? `
      
      <a href='/home'>Home</a>
      <form action='post' action='/logout'>
      <button>Logout</button>
      </form>
      ` : `
      <a href='/login'>Login</a>
      <a href='/register'>Register</a> 
  `}
  `)
})

// Home Page
app.get('/home', redirectLogin, (req, res) => {
  const {
    user
  } = res.locals
  console.log(req.session);
  res.send(`
    <h1>Home Page</h1>
    <a href='/'>Main</a>
    <ul>
      <li>Name: ${user.name} </li>
      <li>Email: ${user.email}</li>
    </ul>
  `)
})

app.get('/profile', redirectLogin, (req, res) => {
  const {
    user
  } = res.locals
})

// Login route
app.get('/login', redirectHome, (req, res) => {
  res.send(`
    <h1>Login</h1>
      <form method='POST' action='/login'>
      <input type="email" name="email" placeholder="email"/>
      <input type="password" name="password" placeholder="password" />
      <input type="submit" />
    </form>
    <a href='/register'>Register</a>
  `)
})

// Register route Get req
app.get('/register', redirectHome, (req, res) => {
  res.send(`
    <h1>Register</h1>
      <form method='POST' action='/register'>
      <input type="text" name="name" placeholder="name" required />
      <input type="email" name="email" placeholder="email" required />
      <input type="password" name="password" placeholder="password" required />
      <input type="submit" />
    </form>
    <a href='/login'>Login</a>
  `)
})

// Register route Post req
app.post('/login', redirectHome, (req, res) => {
  const {
    email,
    password
  } = req.body
  if (email && password) {
    const user = users.find(user => user.email === email && user.password === password)
    if (user) {
      req.session.userId = user.id
      return res.redirect('/home')
    }
  }

  res.redirect('/login')
})

app.post('/register', redirectHome, (req, res) => {
  const {
    name,
    email,
    password
  } = req.body

  if (name && email && password) {
    const exists = users.some(
      user => user.email === email
    )

    if (!exists) {
      const user = {
        id: users.length + 1,
        name,
        email,
        password
      }

      users.push(user)

      req.session.userId = user.id
      return res.redirect('/home')

    }
  }

  res.redirect('/register')

})

app.post('/logout', redirectLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/home')
    } else {
      res.clearCookie(SESS_NAME)
      res.redirect('/login')
    }
  })
})

app.listen(process.env.PORT || PORT, () => console.log(`Server Started on port ${PORT}`))