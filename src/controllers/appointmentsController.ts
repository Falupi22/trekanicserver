import { Appointment, AppointmentModel, User } from "../models";
import HttpStatus from "http-status-codes";
import asyncHandler from "express-async-handler";
import Mechanic, { MechanicModel } from "../models/Mechanic.model";
import Issue, { IssueModel } from "../models/Issue.model";
import jsonpatch from "fast-json-patch";

const openingTime: number = 8;
const closingTime: number = 22

export const getAppointments = asyncHandler(async (req, res) => {
    let statusCode: number = HttpStatus.BAD_REQUEST;
    let appointments: Appointment[] = []

    if (req.isAuthenticated()) {
        const user = await User.findOne({ username: req.user.username });

        appointments = await AppointmentModel.find({ customer: user._id });
        statusCode = HttpStatus.OK
    }
    else {
        statusCode = HttpStatus.FORBIDDEN;
    }

    res.status(statusCode);
    res.send(appointments);
})

export const getTakenDates = asyncHandler(async (req, res) => {
    let statusCode: number = HttpStatus.BAD_REQUEST;
    let takenDates: Date[] = [];

    if (req.isAuthenticated()) {
        const appointments: Appointment[] = await AppointmentModel.find({});
        takenDates = appointments.map(appointment => appointment.datetime);
        statusCode = HttpStatus.OK
    }
    else {
        statusCode = HttpStatus.FORBIDDEN;
    }

    res.status(statusCode);
    res.send(takenDates);
});

export const createAppointment = asyncHandler(async (req, res) => {
    let statusCode: number = HttpStatus.BAD_REQUEST;
    let freeMechanics: Mechanic[]

    if (req.isAuthenticated()) {
        const currentAppointment: Appointment = req.body.appointment;

        if (openingTime < currentAppointment.datetime.getHours() &&
            closingTime > currentAppointment.datetime.getHours()) {
            const appointmentIssue = await IssueModel.findById(currentAppointment.issue);
            const currentAppointmentTime: AppointmentTime = new AppointmentTime(new Date(currentAppointment.datetime),
                appointmentIssue.duration);

            const mechanics: Mechanic[] = await MechanicModel.find({})
            freeMechanics = await Promise.all(mechanics.map(async (mechanic) => {
                const appointmentTimes: AppointmentTime[] = await Promise.all(mechanic.appointments.map(async (appointmentId) => {
                    const appointment: Appointment = await AppointmentModel.findById(appointmentId);
                    const issue: Issue = await IssueModel.findById(appointment.issue);

                    return new AppointmentTime(appointment.datetime, issue.duration);
                }));

                let free = true;

                for (let index = 0; index < appointmentTimes.length && free; index++) {
                    free = !currentAppointmentTime.isSameDay(appointmentTimes[index]) ||
                        (currentAppointmentTime.compareTo(appointmentTimes[index].getEndTime()) === 1 ||
                            appointmentTimes[index].compareTo(currentAppointmentTime.getEndTime()) === 1);
                }

                return free ? mechanic : null; // Return mechanic if free, otherwise null
            }));

            freeMechanics = freeMechanics.filter(mechanic => mechanic !== null);

            if (freeMechanics.length > 0) {
                statusCode = HttpStatus.OK;
            } else {
                statusCode = HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE;
            }
        }

        res.status(statusCode);
        res.send();
    }
});

export const editAppointment = asyncHandler(async (req, res) => {
    const appointmentId = req.body.appointmentId;
    const appointmentPatch = req.body.appointmentPatch;

    try {
        if (!req.isAuthenticated()) {
            res.status(HttpStatus.UNAUTHORIZED).send();
            return;
        }

        const originalAppointment: Appointment = await AppointmentModel.findById(appointmentId);

        if (!originalAppointment) {
            res.status(HttpStatus.NOT_FOUND).send("Appointment not found");
            return;
        }

        const editedAppointment = jsonpatch.applyPatch(originalAppointment, appointmentPatch).newDocument;
        const appointmentHour = editedAppointment.datetime.getHours();

        if (originalAppointment.datetime == editedAppointment.datetime || appointmentHour > openingTime && appointmentHour < closingTime) {
            const appointmentIssue = await IssueModel.findById(editedAppointment.issue);

            if (!appointmentIssue) {
                res.status(HttpStatus.NOT_FOUND).send("Issue not found");
                return;
            }

            if (originalAppointment.datetime != editedAppointment.datetime) {
                const currentAppointmentTime = new AppointmentTime(new Date(editedAppointment.datetime), appointmentIssue.duration);
                const freeMechanics = await getFreeMechanicsByTime(currentAppointmentTime);

                if (freeMechanics.length > 0) {
                    await AppointmentModel.updateOne({ _id: editedAppointment.id }, editedAppointment);
                    res.status(HttpStatus.OK).send();
                } else {
                    res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).send("No available mechanics");
                }
            }
            else {
                await AppointmentModel.updateOne({ _id: editedAppointment.id }, editedAppointment);
                res.status(HttpStatus.OK).send();
            }
        } else {
            res.status(HttpStatus.BAD_REQUEST).send("Invalid appointment time");
        }
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("An error occurred");
    }
});

export const deleteAppointment = asyncHandler(async (req, res) => {
    const appointmentId = req.params.id;

    try {
        if (!req.isAuthenticated()) {
            res.status(HttpStatus.UNAUTHORIZED).send();
            return;
        }

        const originalAppointment: Appointment = await AppointmentModel.findById(appointmentId);

        if (!originalAppointment) {
            res.status(HttpStatus.NOT_FOUND).send("Appointment not found");
            return;
        }

        await AppointmentModel.deleteOne({_id: appointmentId});
        res.status(HttpStatus.OK).send();
    }
    catch (error) {
        console.error("An error occurred:", error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("An error occurred");
    }
});


const getFreeMechanicsByTime = async (currentAppointmentTime: AppointmentTime) => {
    const mechanics: Mechanic[] = await MechanicModel.find({})
    const freeMechanics = await Promise.all(mechanics.map(async (mechanic) => {
        const appointmentTimes: AppointmentTime[] = await Promise.all(mechanic.appointments.map(async (appointmentId) => {
            const appointment: Appointment = await AppointmentModel.findById(appointmentId);
            const issue: Issue = await IssueModel.findById(appointment.issue);

            return new AppointmentTime(appointment.datetime, issue.duration);
        }));

        let free = true;

        for (let index = 0; index < appointmentTimes.length && free; index++) {
            free = !currentAppointmentTime.isSameDay(appointmentTimes[index]) ||
                (currentAppointmentTime.compareTo(appointmentTimes[index].getEndTime()) === 1 ||
                    appointmentTimes[index].compareTo(currentAppointmentTime.getEndTime()) === 1);
        }

        return free ? mechanic : null; // Return mechanic if free, otherwise null
    }));

    return freeMechanics.filter(mechanic => mechanic !== null);
}

class AppointmentTime {
    datetime: Date
    duration: number;

    public constructor(datetime: Date, duration: number) {
        this.datetime = datetime;
        this.duration = duration;
    }

    getEndTime(): Date {
        return new Date(this.datetime.getTime() + this.duration * 60 * 60 * 1000)
    }

    isSameDay(appointmentTime: AppointmentTime): boolean {
        return this.datetime.getDay() == appointmentTime.datetime.getDay() &&
            this.datetime.getMonth() == appointmentTime.datetime.getMonth() &&
            this.datetime.getFullYear() == appointmentTime.datetime.getFullYear()
    }

    compareTo(appointmentDateTime: Date): number {
        let result = -1;

        const newCurrentDate: Date = new Date(this.datetime.getFullYear(), this.datetime.getMonth(), this.datetime.getDate());
        const appointmentCurrentDate = new Date(appointmentDateTime.getFullYear(),
            appointmentDateTime.getMonth(), appointmentDateTime.getDate());

        if (newCurrentDate.getTime() == appointmentCurrentDate.getTime()) {
            result = 0;
        }
        else if (newCurrentDate.getTime() > appointmentCurrentDate.getTime()) {
            result = 1;
        }

        return result
    }
}