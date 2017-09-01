require('dotenv').config()
// Set up server and socket
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var server = require('http').createServer(app)
// DB imports
var mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
var path = require('path')
var Schema = mongoose.Schema
const port = process.env.PORT
var md = require('node-markdown').Markdown
var auth = require('express-authentication')
var moment = require('moment')

app.use(function (req, res, next) {
  req.challenge = req.get('Authorization')
  req.authenticated = req.challenge === process.env.PASSWORD

  if (req.authenticated) {
    req.authentication = { user: 'Kerry' }
  } else {
    req.authentication = { error: 'INVALID_API_KEY' }
  }

  next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'public'))

// connect to the database
var url = process.env.MONGODB_URI
mongoose.connect(url)
var db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  server.listen(port, () => {
    console.log('App running on port ' + port)
  })
})

var Post = mongoose.model('Post', new Schema({
  title: String,
  body: String,
  category: String,
  updated: Date
}))

var User = mongoose.model('User', new Schema({
  name: String,
  github: String,
  linkedin: String,
  facebook: String,
  twitter: String,
  instagram: String,
  resume: String,
  spotify: String,
  email: String,
  bio: String,
  about: String,
  propic: String,
  categories: Object
}))

var baseUser = require('./userInfo')

User.find({}).then(users => {
  if (users.length === 0) {
    var user = new User(baseUser)
    user.save()
  } else {
    let user = users[0]
    Object.assign(user, baseUser, user)
    user.save()
  }
})

let formatDate = function (d) {
  return moment(d).format('dddd, MMMM D, YYYY')
}

app.route('/')
  .get((req, res, next) => {
    User.findOne({}).then((user) => {
      res.render('index', {user})
    })
  })

app.route('/edit')
  .get((req, res, next) => {
    User.findOne({}).then(user => {
      let categories = user.categories
      Post.find().lean().sort('-updated').then(posts => {
        res.render('edit', {posts, categories})
      })
    })
  })

app.route('/edit-post')
  .post(auth.required(), (req, res) => {
    if (req.body._id) {
      Post.findById({
        _id: req.body._id
      }).then(post => {
        if (post) {
          Object.assign(post, req.body)
          post.save().then(() => {
            res.json('{ "status": "success" }')
          })
        } else {
          let p = new Post(req.body)
          p.save().then(() => {
            res.json('{ "status": "success" }')
          })
        }
      })
    } else {
      let p = new Post(req.body)
      p.save().then(() => {
        res.json('{ "status": "success" }')
      })
    }
  })

app.route('/delete-post')
  .post(auth.required(), (req, res) => {
    Post.findOneAndRemove({
      _id: req.body._id
    }).then(() => {
      res.json('{ "status": "success" }')
    })
  })

app.route('/edit-me')
  .get((req, res) => {
    User.findOne({}).lean().then(user => {
      let editedUser = Object.assign({}, user)
      delete editedUser._id
      delete editedUser.__v
      res.render('edit-me', {user: JSON.stringify(editedUser, null, '    ')})
    })
  })
  .post(auth.required(), (req, res) => {
    User.findOne({}).then(user => {
      Object.assign(user, req.body)
      user.save().then(() => {
        res.json('{ "status": "success" }')
      })
    })
  })

app.route('/about')
  .get((req, res) => {
    User.findOne({}).then(user => {
      res.render('about', {md, user})
    })
  })

app.route('/contact')
  .get((req, res) => {
    User.findOne({}).then(user => {
      res.render('contact', {md, user})
    })
  })

app.route('/:category')
  .get((req, res, next) => {
    User.findOne({}).then(user => {
      let page = user.categories.find(elem => {
        return elem.url === req.params.category
      })
      if (!page) {
        res.sendStatus(404)
        return
      }
      Post.find({
        category: req.params.category
      }).sort('-updated').then(posts => {
        res.render('posts', {
          md,
          formatDate,
          posts,
          title: page.title
        })
      })
    })
  })
