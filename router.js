var express = require('express');
var router = new express.Router;
var passport = require('passport');

function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {return next(); }
    req.flash('info', 'You need to log in to access this content!');
    res.redirect('/auth/login');
}

router.route('/auth/login')
    .get(function(req, res) {
        res.render('auth/login', {
            title: "Addressbook",
            uzenetek: req.flash()
        });
    })
    .post(passport.authenticate('local-login', {
        successRedirect: '/list',
        failureRedirect: '/auth/login',
        failureFlash:   true,
        badRequestMessage: 'Invalid username or password'
    }));

router.route('/auth/signup')
    .get(function(req, res) {
        res.render('auth/signup', {
            title: "Addressbook",
            uzenetek: req.flash()
        });
    })
    .post(passport.authenticate('local-signup', {
        successRedirect: '/auth/login', 
        failureRedirect: '/auth/signup',
        failureFlash:   true,
        badRequestMessage:  'Something went wrong. Please try to fill in the lines correctly!'
    }));
    
router.use('/auth/logout', function(req,res) {
    req.logout();
    res.redirect('/auth/login');
});

router.get('/', function (req, res) {
    res.render('info', {
       title: "Addressbook"
    });
});

router.route('/list')
    .get(ensureAuthenticated, function (req, res) {
        var result;
        if(req.query.query) {
            var searchedpbEntry = req.query.query; 
            result = req.app.Models.pbEntry.find({
                forename: searchedpbEntry,
                user: req.user.id
            });
        } else {
            result = req.app.Models.pbentry.find({
                user: req.user.id
            });
        }
        result
            .then(function(data) {
                res.render('list', {
                    title: "Addressbook",
                    data: data,
                    query: req.query.query,
                    uzenetek: req.flash()
                });
        
            })
            .catch(function() {
                console.log('Hiba!!!');
                throw 'error';
            });
    });
    
router.route('/list/:id')
    .get(ensureAuthenticated, function (req, res) {
        req.app.Models.pbEntry.find({ id: req.params.id })
        .then(function(data) {
            res.render('list', {
                title: "Addressbook",
                data: data,
                uzenetek: req.flash()
            });
        })
        .catch(function() {
            console.log('Hiba!!!');
            throw 'error'; 
        });
    });
    
router.route('/add')
    .get(ensureAuthenticated, function (req, res) {
        res.render('add', {
            title: "Addressbook",
            uzenetek: req.flash()
        });
    })
    .post(ensureAuthenticated, function (req, res) {
        req.checkBody('forename', 'Missing forename').notEmpty();
        req.checkBody('surname', 'Missing surname').notEmpty();
        
        if(req.validationErrors()) {
            req.validationErrors().forEach(function (error) {
                req.flash('error', error.msg);
            });
            res.redirect('/add');
        } else {
            req.app.Models.pbentry.create({
                prefix: req.body.prefix,
                forename: req.body.forename,
                surname: req.body.surname,
                suffix: req.body.suffix,
                number: req.body.number,
                permanentaddress: req.body.permanentaddress,
                user: req.user.id
            })
            .then(function() {
                req.flash('success', 'Entry added.');
                res.redirect('/add');
            })
            .catch(function() {
                req.flash('error', 'Entry did not get added.');
                res.redirect('/add');
            });
        }
    
    });

router.route('/modify/:id')
    .get(ensureAuthenticated, function(req, res) {
        req.app.Models.pbentry.findOne({
            id: req.params.id
        })
        .then(function (pbEntry) {
            res.render('modify', {
                pbEntry: pbEntry,
                title: "Addressbook",
                uzenetek: req.flash()
            });
        });
    })
    .post(function(req, res) {     //ensureAuthenticated, ....
        req.checkBody('forename').notEmpty().withMessage('Missing forename!');
        req.checkBody('surname').notEmpty().withMessage('Missing surname!');
        if(req.validationErrors()) {
            req.validationErrors().forEach(function (error) {
                req.flash('error', error.msg);
            });
            res.redirect('/modify');
        } else {
            req.app.Models.pbentry.update({
                id: req.params.id },
                req.body
                
            ).then(function (pbEntry) {
                req.flash('success', 'Entry successfuly modified!');
                res.redirect('/list');
            })
            .catch(function () {
                req.flash('error', 'Entry modification failed!');
                res.redirect('/modify/:id');
            });
        }
        
    });
    
router.use('/delete/:id', ensureAuthenticated, function(req, res) {
    req.app.Models.pbentry.destroy({ id: req.params.id })
        .then(function() {
            req.flash('success', 'Entry was deleted successfully!');
            res.redirect('/list');
        })
       .catch(function() {
            req.flash('error', 'Entry was not deleted!');
            res.redirect('/list');
        });
       
});



module.exports = router;