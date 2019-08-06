const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
var mongo = require('mongodb');
mongoose.connect(process.env.MLAB_URI, { useNewUrlParser: true })

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: String,
  exercises: Array
});

const User = mongoose.model('User', userSchema);

app.post("/api/exercise/new-user", (req, res) => {
  User.create({
    username: req.body.username
  }, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      res.json({
        username: data.username,
        _id: data._id
      })
    }
  })
});

app.post("/api/exercise/add", (req, res) => {
  let date = new Date();
  if (req.query.date) {
    date = req.query.date
  }
  User.findOneAndUpdate({
    _id: req.body.userId
  },
    {
      $push: {
        exercises: {
          description: req.body.description,
          duration: parseInt(req.body.duration),
          date: date
        }
      }
    }, (err, data) => {
      if (err) {
        console.error(err);
      } else {
        res.json({
          username: data.username,
          description: req.body.description,
          duration: parseInt(req.body.duration),
          _id: data._id,
          date: date.toDateString()
        })
      }
    })
})

app.get("/api/exercise/users", (req, res) => {
  User.find({}).select("-__v").exec((err, data) => {
    if (err) {
      console.error(err)
    } else {
      res.json(data)
    }
  })
})

app.get("/api/exercise/log/", (req, res) => {

  User.findOne({ _id: req.query.userId }, (err, data) => {
    let from = null;
    let to = null;
    if (req.query.from) {
      from = new Date(req.query.from);
    }
    if (req.query.to) {
      to = new Date(req.query.to);
    }
    let log = []
    if (from && to) {
      log = data.exercises.filter((e) => e.date > from && e.date < to)
    } else if (from) {
      log = data.exercises.filter((e) => e.date > from)
    } else if (to) {
      log = data.exercises.filter((e) => e.date < to)
    } else {
      log = data.exercises
    }
    if (req.query.limit) {
      log = log.slice(0, parseInt(req.query.limit))
    }

    if (err) {
      console.error(err);
    } else {
      res.json({
        _id: data._id,
        username: data.username,
        count: log.length,
        log: log
      })
    }
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
