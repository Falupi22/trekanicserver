import { Router } from "express";
import passport from "passport";
import { User } from "../models";
import { login, logout } from "../controllers"

const sessionRouter = Router();

sessionRouter.post('/login', login);
sessionRouter.post('/logout', logout);

export default sessionRouter;