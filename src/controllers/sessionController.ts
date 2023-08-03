import { User } from "../models";
import HttpStatus from "http-status-codes"
import asyncHandler from "express-async-handler"
import passport from "passport";

export const login = asyncHandler(async (req, res, next) => {
    let statusCode: number = HttpStatus.BAD_REQUEST;

    const user = User({
        username: req.body.username,
        password: req.body.password
    });

    if (await User.findOne({ username: user.username, password: user.password })) {
        await new Promise((resolve, reject) => req.login(user, async function (error) {
            if (error) {
                console.log(error);
            } else {
                await new Promise((resolve , reject) => {passport.authenticate("local", function (error, user, info) {
                    if (error) {
                        console.log(error);
                        statusCode = HttpStatus.UNAUTHORIZED;
                    }
                    else {
                        statusCode = HttpStatus.OK;
                    }

                    resolve(null);
                })(req, res, next);
            });

            resolve(null);
        }}));
    }

    res.status(statusCode);
    res.send();
});