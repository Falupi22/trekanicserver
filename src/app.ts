import express from 'express';
import cors from 'cors'
import DOMAIN, { PORT, IP, WEB_SERVER_PORT } from './constants';
import bodyParser from 'body-parser';
import passport from 'passport';
import mongoose from 'mongoose';
import session from 'express-session';
import passportLocalMongoose from "passport-local-mongoose"
import { User, setUserPlugin, setUserModel } from './models';
import { config } from 'dotenv';
import { appointmentsRouter, sessionRouter } from './routers';

const app = express();
function connectToDB() {
    mongoose.connect("mongodb://localhost:27017/trekanic");
}

function setMiddlewares() {
    // Using all the files from the public folder
    app.use(express.static("public"));
    app.use((req, res, next) => {
        console.log(`Received ${req.method} request at ${req.url} 
                     with headers: ${JSON.stringify(req.headers)}
                     with cookies: ${JSON.stringify(req.cookies)}
                     with body: ${JSON.stringify(req.body)}`);
        next(); // Move to the next middleware or route handler
    });
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(express.json());
    app.use(cors({
        origin: `http://${IP}:${PORT}`,
        methods: ["GET, POST"],
        credentials: true
    }));

    app.use(session({
        secret: process.env.SECRET_CODE,
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
}

function setSchemaPlugins() {
    setUserPlugin(passportLocalMongoose);

    // The model itself is created ONLY after the plugin was set.
    setUserModel()
}

function setPassport() {
    passport.use(User.createStrategy())
    passport.serializeUser(User.serializeUser())
    passport.deserializeUser(User.deserializeUser())
}

function setRoutes() {
    // Adds all the routes
    app.use(sessionRouter);
    app.use(appointmentsRouter);
}

config();
connectToDB();
setMiddlewares();
setSchemaPlugins();
setPassport();
setRoutes();

const publicPath = 'C:\\Libraries\\trekanic\\dist'

app.use(express.static(publicPath))
app.get('/', (request, response) => {
    response.sendFile(`${publicPath}\\index.html`)
})

app.listen(PORT, IP, () => {
    console.log(`Express is listening at ${DOMAIN}`);
});

export default app;