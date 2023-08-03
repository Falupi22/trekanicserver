import { Router } from "express";
import passport from "passport";
import { User } from "../models";
import HttpStatus from "http-status-codes"
import { login } from "../controllers"

const sessionRouter = Router();

sessionRouter.post('/login', login);

export default sessionRouter;