//medconnect
//using node 4.2.5 LTS

require('dotenv').config()
const express	= require('express')
const http = require('http')
const https = require('https')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt-nodejs')
const session = require('express-session')
const Q = require('q')
const async = require('async-q')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const app	= express()

const port = process.env.PORT || 80

const db = require('./config/db')

app.disable('x-powered-by')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser('byuITsecret'))
app.use(session({
	secret: 'byuITsecret',
	duration: 1 * 60 * 60 * 1000,
	cookie: {
		ephemeral: false,
		httpOnly: true,
		secure: false
	},
	resave: true,
	saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(__dirname + '/public'))

passport.use(new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
},
function (email, password, done) {
	email = email.toLowerCase()
	db.query('SELECT * FROM Users WHERE email =? LIMIT 1;', [email]).then( function (data){
		if(data[0].length === 0){
			return done(null, false)
		}
		var user = data[0][0]

		bcrypt.compare(password, user.password, function (err, res) {
			if(res){
				return done(null, { id: user.userID, type: user.userType, email: user.email, first: user.firstName, last: user.lastName })
			}
			done(null, false)
		})
	}).catch( function (err){
		console.error(err)
	})
}))
passport.serializeUser(function (user, done) {
	done(null, user.id)
})
passport.deserializeUser(function (id, done) {
	db.query('SELECT * FROM Users WHERE userID =? LIMIT 1;', [id]).then( function (user){
		done(null, user[0][0])
	})
})

app.use('/patient/*', require('./controllers/patientRoutes'))
app.use('/doctor/*', require('./controllers/doctorRoutes'))
app.use('/admin/*', require('./controllers/adminRoutes'))
app.use('/', require('./controllers/routes'))

http.createServer(app).listen(port, function (){
	console.log('SERVER STARTED ' + port)
})
