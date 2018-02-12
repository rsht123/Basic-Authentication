const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const User = require('./models/User');
const bcrypt = require('bcrypt');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const config = require('./webpack.config');

const compiler = webpack(config);

const app = express();

app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath
}))

app.use(webpackHotMiddleware(compiler, {
    log: console.log
}))

mongoose.connect('mongodb://localhost/trialAuth');
const db = mongoose.connection;

app.use(session({
    name: 'authTrial',
    secret: 'someSecret',
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: db
    })
}))

app.use(express.static(path.join(__dirname, 'views')));

//BodyParser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join('index.html'));
})

app.get('/api/logout', (req, res) => {
    console.log('logout', req.session);
    if(req.session) {
        req.session.destroy(function(err) {
            if(err) throw err;

            res.redirect('/');
        })
    }
})

app.get('/api/profile', (req, res) => {
    console.log('profile', req.session);
    User.findById(req.session.userId, function(err, user) {
        if(err || !user) {
            const err = new Error('You are not Authorized');
            err.status = 401;
            res.send(err);
        } else {
            res.send("<h1>User:" + user.username + "</h1><br /><a href='/api/logout'>Logout</a>")
        }
    })
})

app.post('/api', (req, res) => {
    console.log(req.body);
    const body = req.body;
    if(body.signPassword !== body.confPassword) {
        const err = new Error('Passwords do not match');
        err.status(400);
        res.send(err);
    }

    if(body.signUsername && body.signPassword && body.signEmail && body.confPassword) {
        User.create({
            username: body.signUsername,
            email: body.signEmail,
            password: body.signPassword
        }, function(err, user) {
            req.session.userId = user._id;
            res.redirect('/api/profile');
        })
    } else if(body.logUsername && body.logPassword) {
        User.findOne({username: body.logUsername}, function(err, user) {
            if(err) throw err;

            if(!user) {
                const err = new Error('User not found');
                err.status = 401;
                res.send(err);
            } else if(body.logPassword === user.password) {
                req.session.userId = user._id;
                res.redirect('/api/profile')
            } else {
                const err = new Error('Password invalid');
                err.status = 403;
                err.message = "password invalid";
                res.send(err);
            }
        })
    } else {
        const err = new Error('All fields required');
        err.status = 400;
        res.send(err);
    }
})

app.listen(3000, () => console.log('App running on port 3000'));