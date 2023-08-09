import { Appointment, AppointmentModel, User } from "../models";
import HttpStatus from "http-status-codes"
import asyncHandler from "express-async-handler"

export const getAppointments = asyncHandler(async (req, res, next) => {
    let statusCode: number = HttpStatus.BAD_REQUEST;
    let appointments: Appointment[] = [] 

    if (req.isAuthenticated()) {
        let user = await User.findOne({username: req.user.username});

        appointments = await AppointmentModel.find({customer: user._id});
        statusCode = HttpStatus.OK
    }
    else {
        statusCode = HttpStatus.FORBIDDEN;
    }

    res.status(statusCode);
    res.send(appointments);
})

export const getTakenDates = asyncHandler(async (req, res, next) => {
    let statusCode: number = HttpStatus.BAD_REQUEST;
    let takenDates: Date[] = [];

    if (req.isAuthenticated()) {
        let appointments: Appointment[] = (await AppointmentModel.find({}));
        takenDates = appointments.map(appointment => appointment.datetime);
        statusCode = HttpStatus.OK
    }
    else {
        statusCode = HttpStatus.FORBIDDEN;
    }

    res.status(statusCode);
    res.send(takenDates);
});