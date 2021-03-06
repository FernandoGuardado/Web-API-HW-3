// Fernando Guardado
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var jwt = require('jsonwebtoken');
var Movie = require('./Movies');
var dotenv = require('dotenv').config();
var mongoose = require('mongoose');
var port = process.env.PORT || 8080;

// creates application
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

// initialize router
var router = express.Router();

mongoose.connect(process.env.DB , (err, database) => {
                 if (err) throw err;
                 console.log("Connected to the database.");
                 db = database;
                 console.log("Database connected on " + process.env.DB);
                 });

//===============================================================================================
// routes
//===============================================================================================
// /postjwt route
router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );
//===============================================================================================
// /users/:userID route
router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });
//===============================================================================================
// /users route
router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });
//===============================================================================================
// /signup route
router.post('/signup', function(req, res) {
            if (!req.body.username || !req.body.password) {
            res.json({success: false, msg: 'Please pass username and password.'});
            }
            else {
            var user = new User();
            user.name = req.body.name;
            user.username = req.body.username;
            user.password = req.body.password;

            // save
            user.save(function(err) {
                      if (err) {
                      // duplicate entry
                      if (err.code == 11000)
                      return res.json({ success: false, message: 'A user with that username already exists.'});
                      else
                      return res.send(err);
                      }
                      res.json({ message: 'User created! Welcome ' + req.body.name + '!' });
                      });
            }
            });
//===============================================================================================
// /signin route
router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        });


    });
});
//===============================================================================================
// /movies route
router.route('/movies')
// get all movies
.get(authJwtController.isAuthenticated, function (req, res) {
     Movie.find(function (err, movies) {
                
                if (err) res.send(err);
                
                // return movies
                res.json(movies);
                });
     })
// create a new movie
.post(authJwtController.isAuthenticated, function (req, res) {
      if (!req.body.title) {
        res.json({ success: false, message: 'You have entered the movie information incorrectly. You where missing the title.' });
      }
      else if(!req.body.year){
        res.json({ success: false, message: 'You have entered the movie information incorrectly. You where missing the year.' });
      }else if(!req.body.genre){
        res.json({ success: false, message: 'You have entered the movie information incorrectly. You where missing the genre.' });
      }else if(!req.body.actors){
        res.json({ success: false, message: 'You have entered the movie information incorrectly. You where missing at least one actor.' });
      }
      else if (req.body.actors.length <= 2) {
      res.json({ success: false, message: 'Please add at atleast three actors to the movie.' })
      }
      else {

      var movie = new Movie();
      
      // set inputs to movie data
      movie.title = req.body.title;
      movie.year = req.body.year;
      movie.genre = req.body.genre;
      movie.actors = req.body.actors;
      
      // save
      movie.save(function(err) {
                 if (err) {
                 //d uplicate entry
                 if (err.code === 11000)
                 return res.json({ success: false, message: req.body.title + ' already exists in the database!' });
                 else
                 return res.send(err);
                 }
                 res.json({ message: req.body.title +  ' has been created & added to the database.' });
                 });
      }
      })
// update a movie
.put(authJwtController.isAuthenticated, function (req, res) {
     Movie.findById(req.body._id,function (err, movie) {
                    if (err) {
                    res.send(err);
                    }
                    else if (!req.body.title) {
                        res.json({ success: false, message: 'You have entered the movie information incorrectly. You where missing the title.' });
                      }
                    else if(!req.body.year){
                        res.json({ success: false, message: 'You have entered the movie information incorrectly. You where missing the year.' });
                    }else if(!req.body.genre){
                        res.json({ success: false, message: 'You have entered the movie information incorrectly. You where missing the genre.' });
                    }else if(!req.body.actors){
                        res.json({ success: false, message: 'You have entered the movie information incorrectly. You where missing at least one actor.' });
                    }
                    else if (req.body.actors.length <= 2)
                    {
                    res.json({ success: false, message: 'Please add at atleast three actors to the movie.' });
                    }
                    else {
                    movie.title = req.body.title;
                    movie.year = req.body.year;
                    movie.genre = req.body.genre;
                    movie.actors = req.body.actors;
                    
                    movie.save(function(err) {
                               if (err) {
                               // duplicate entry
                               if (err.code === 11000)
                               return res.json({ success: false, message: req.body.title + ' already exists in the database!' });
                               else
                               return res.send(err);
                               }
                               res.json({ message: req.body.title +  ' has been updated!' });
                               });
                    }
                    });
     })
// delete a movie
.delete(authJwtController.isAuthenticated, function (req, res) {
        Movie.findByIdAndRemove(req.body._id,function (err, movie) {
            if (err) res.send(err);
                                
            res.json({ message: req.body.title + ' has been deleted from the database.'});
            });
        });
//===============================================================================================
app.use('/', router);
app.listen(port);