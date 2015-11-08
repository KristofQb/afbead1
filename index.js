var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var Waterline = require('waterline');
var diskAdapter = require('sails-disk');
var flash = require('connect-flash');
var validator = require('express-validator');
var hbs = require('hbs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

app.use(session({
    cookie: {maxAge: 60000},
    secret: 'secret message',
    resave: false,
    saveUninitialized: false,
}));

//Passport middlewares
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

//LocalStrategy for sign-up
passport.use('local-signup', new LocalStrategy({
        usernameField: 'userId',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, userId, password, done) {
        req.app.Models.user.findOne({userId: userId}, function(err, user) {
            if(err) {return done(err); }
            if(user) {
                return done(null, false, {message: "User with this username already exists!"});
            }
            req.app.Models.user.create(req.body)
            .then(function(user) {
                req.flash('success', 'Your registration was successful');
                return done(null, user);
            })
            .catch(function(err) {
                return done(err);
            });
        });
    }
));

//Strategy
passport.use('local-login', new LocalStrategy({
        usernameField: 'userId',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, userId, password, done) {
        req.app.Models.user.findOne({ userId: userId}, function(err, user) {
            if(err) { return done(err); }
            if(!user || !user.validPassword(password)) {
                return done(null, false, {message: 'Username or password is invalid!'});  
            } 
            return done(null, user);
        });
    }
));

//middleware segedfuggveny
function setLocalsForLayout() {
    return function(req, res, next) {
        res.locals.loggedIn = req.isAuthenticated();
        res.locals.user = req.user;
        next();
    };
}

app.use(flash());
app.use(validator());

app.use(setLocalsForLayout());

var orm = new Waterline();
var ormConfig = {
    adapters: {
        disk: diskAdapter
    },
    connections: {
        disk: {
            adapter: 'disk'
        }
    },
    defaults: {
        migrate: 'safe'
    }
};

app.use(bodyParser.urlencoded({ extended: false }));

hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

var router = require("./router");
app.use(router);

orm.loadCollection(require('./models/pbEntry'));
orm.loadCollection(require('./models/user'));

orm.initialize(ormConfig, function (err, models) {
    if(err) throw err;
    
    app.Models = models.collections;
    
    var port = process.env.PORT || 1337;
    app.listen(port, function() {
        console.log('App server started on port ' + port);
    });
});

