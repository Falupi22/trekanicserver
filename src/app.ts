import express from 'express';
import cors from 'cors'
import DOMAIN, { PORT } from './constants';
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
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(session({
        secret: process.env.SECRET_CODE,
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    // Allows access to the trekanic site only!
    app.use(cors({
        origin: DOMAIN
    }));
    // Adds all the routes
    app.use(sessionRouter);
    app.use(appointmentsRouter);
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

config();
connectToDB();
setMiddlewares();
setSchemaPlugins();
setPassport();

app.listen(PORT, () => {
   console.log(`Express is listening at http://localhost:${PORT}`);
});

export default app;