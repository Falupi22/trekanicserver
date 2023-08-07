import { Appointment, User } from "../models";
import HttpStatus from "http-status-codes"
import asyncHandler from "express-async-handler"

export const getAppointments = asyncHandler(async (req, res, next) => {
    let statusCode: number = HttpStatus.BAD_REQUEST;
    let appointments: Array<typeof Appointment> = [] 

    if (req.isAuthenticated()) {
        let user = await User.findOne({username: req.user.username});

        appointments = await Appointment.find({customer: user._id});
        statusCode = HttpStatus.OK
    }
    else {
        statusCode = HttpStatus.FORBIDDEN;
    }

    res.status(statusCode);
    res.send(appointments);
})