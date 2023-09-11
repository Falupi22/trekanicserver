import { User } from "../models";
import HttpStatus from "http-status-codes"
import asyncHandler from "express-async-handler"
import passport from "passport";

export const login = asyncHandler(async (req, res, next) => {
    const user = User({
        username: req.body.username,
        password: req.body.password
    });

    if (!req.isAuthenticated()) {
        if (await User.findOne({ username: user.username, password: user.password })) {
            req.login(user, function (error) {
                if (error) {
                    console.log(error);
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
                } else {
                    passport.authenticate("local", function (error, user, info) {
                        if (error) {
                            console.log(error);
                            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
                        }
                        else {
                            res.status(HttpStatus.OK).send();
                        }
                    })(req, res, next);
                }
            });
        }
        else {
            res.status(HttpStatus.NOT_FOUND).send();
        }
    } else {
        res.status(HttpStatus.UNAUTHORIZED).send();
    }
});

export const logout = asyncHandler(async (req, res) => {
    if (req.isAuthenticated()) {
        req.logout(() => {});
        res.status(HttpStatus.OK).send();
    } else {
        res.status(HttpStatus.UNAUTHORIZED).send();
    }
});