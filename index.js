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
  propic: String
}))

var baseUser = require('./userInfo')

var user = new User(baseUser)
user.save()

let formatDate = function (d) {
  return moment(d).format('MMMM D YYYY')
}

app.route('/')
  .get((req, res, next) => {
    User.findOne({}).then((user) => {
      res.render('index', {user})
    })
  })

app.route('/blog')
  .get((req, res, next) => {
    Post.find({
      category: 'blog'
    }).sort('-updated').then(posts => {
      res.render('posts', {md, formatDate, posts, title: 'Blog'})
    })
  })

app.route('/research')
  .get((req, res, next) => {
    Post.find({
      category: 'research'
    }).sort('-updated').then(posts => {
      res.render('posts', {md, formatDate, posts, title: 'Research'})
    })
  })

app.route('/edit')
  .get((req, res, next) => {
    Post.find().lean().sort('-updated').then(posts => {
      res.render('edit', {posts})
    })
  })

app.route('/edit-post')
  .post(auth.required(), (req, res) => {
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
