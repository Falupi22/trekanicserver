import { Appointment, AppointmentModel, User } from "../models";
import HttpStatus from "http-status-codes";
import asyncHandler from "express-async-handler";
import Mechanic, { MechanicModel } from "../models/Mechanic.model";
import Issue, { IssueModel } from "../models/Issue.model";
import jsonpatch from "fast-json-patch";
import { NumberSchema } from "joi";

const openingTime: number = 8;
const closingTime: number = 22

export const getAppointments = asyncHandler(async (req, res) => {
    try {
        let appointments: Appointment[] = []

        if (req.isAuthenticated()) {
            const user = await User.findOne({ username: req.user.username });

            appointments = await AppointmentModel.find({ customer: user._id }).populate('issue').populate('issueCategory');
            res.status(HttpStatus.OK).send(appointments);
        }
        else {
            res.status(HttpStatus.UNAUTHORIZED).send();
        }
    }
    catch (error) {
        console.error("An error occurred: ", error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("An error occurred");
    }
})

export const getAvailableDates = asyncHandler(async (req, res) => {
    try {
        let takenDates: Date[] = [];

        if (req.isAuthenticated()) {
            const appointments: Appointment[] = await AppointmentModel.find({});
            takenDates = appointments.map(appointment => appointment.datetime);

            const appointmentTimes: AppointmentTime[] = await Promise.all(appointments.map(async (appointmentId) => {
                const appointment: Appointment = await AppointmentModel.findById(appointmentId);
                const issue: Issue = await IssueModel.findById(appointment.issue);

                return new AppointmentTime(appointment.datetime, issue.duration);
            }));

            res.status(HttpStatus.OK).send(calculateFreeTime(appointmentTimes));
        }
        else {
            res.status(HttpStatus.UNAUTHORIZED).send();
        }
    }
    catch (error) {
        console.error("An error occurred: ", error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("An error occurred");
    }
});

export const createAppointment = asyncHandler(async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            res.status(HttpStatus.UNAUTHORIZED).send();
            return;
        }

        const currentAppointment: Appointment = req.body.appointment;

        if (currentAppointment.description.length > 250) {
            res.status(HttpStatus.BAD_REQUEST).send();
            return;
        }
        if (currentAppointment.datetime.getHours() < openingTime ||
            currentAppointment.datetime.getHours() >= closingTime) {
            res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).send();
            return;
        }

        const appointmentIssue: Issue = await IssueModel.findById(currentAppointment.issue);
        const currentAppointmentTime: AppointmentTime = new AppointmentTime(
            new Date(currentAppointment.datetime),
            appointmentIssue.duration
        );

        const freeMechanics: Mechanic[] = await getFreeMechanicsByTime(currentAppointmentTime);
        const availableMechanics = freeMechanics.filter((mechanic) => mechanic !== null);

        let appointment;

        if (availableMechanics.length > 0) {
            const user = await User.findOne({ username: req.user.username });

            appointment = await AppointmentModel.create({
                issue: currentAppointment.issue,
                description: currentAppointment.description,
                datetime: currentAppointment.datetime,
                customer: user._id,
                mechanic: availableMechanics[0]._id,
                product: currentAppointment.product
            })
        }

        const statusCode = availableMechanics.length > 0 ? HttpStatus.OK : HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE;

        res.status(statusCode).send(appointment);
    }
    catch (error) {
        console.error("An error occurred: ", error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("An error occurred");
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

        if (editedAppointment.description.length > 250) {
            res.status(HttpStatus.BAD_REQUEST).send();
            return;
        }

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

        await AppointmentModel.deleteOne({ _id: appointmentId });
        res.status(HttpStatus.OK).send();
    }
    catch (error) {
        console.error("An error occurred:", error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("An error occurred");
    }
});

export const getIssues = asyncHandler(async (req, res) => {

    try {
        if (!req.isAuthenticated()) {
            res.status(HttpStatus.UNAUTHORIZED).send();
            return;
        }

        const issues: Issue[] = await IssueModel.find({}).populate('category');
        res.status(HttpStatus.OK).send(issues);
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

function calculateFreeTime(appointmentTimes: AppointmentTime[]): AppointmentTime[] {
    const freeTimeSlots: AppointmentTime[] = [];

    const startTime = new Date(); // Starting at 8:00 AM
    startTime.setHours(8, 0, 0, 0);

    const endTime = new Date(); // Ending at 10:00 PM
    endTime.setHours(22, 0, 0, 0);

    if (appointmentTimes.length === 0) {
        // If there are no appointments, the entire time range is free.
        return [new AppointmentTime(startTime, endTime.getTime() - startTime.getTime())];
    }

    // Sort the appointment times by datetime.
    appointmentTimes.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

    if (appointmentTimes[0].datetime > startTime) {
        // If the first appointment is after the start time, there is free time before it.
        freeTimeSlots.push(new AppointmentTime(startTime, appointmentTimes[0].datetime.getTime() - startTime.getTime()));
    }

    for (let i = 1; i < appointmentTimes.length; i++) {
        const currentAppointment = appointmentTimes[i - 1];
        const nextAppointment = appointmentTimes[i];

        const freeTimeStart = currentAppointment.datetime.getTime() + currentAppointment.duration;
        const freeTimeEnd = nextAppointment.datetime.getTime();

        if (freeTimeStart < freeTimeEnd) {
            const freeTime = new AppointmentTime(new Date(freeTimeStart), freeTimeEnd - freeTimeStart);
            freeTimeSlots.push(freeTime);
        }
    }

    if (appointmentTimes[appointmentTimes.length - 1].datetime.getTime() + appointmentTimes[appointmentTimes.length - 1].duration < endTime.getTime()) {
        // If the last appointment ends before the end time, there is free time after it.
        freeTimeSlots.push(new AppointmentTime(new Date(appointmentTimes[appointmentTimes.length - 1].datetime.getTime() + appointmentTimes[appointmentTimes.length - 1].duration),
            endTime.getTime() - (appointmentTimes[appointmentTimes.length - 1].datetime.getTime() + appointmentTimes[appointmentTimes.length - 1].duration)));
    }

    return freeTimeSlots;
}

class AppointmentTime {
    datetime: Date
    duration: number;

    public constructor(datetime: Date, duration: number) {
        this.datetime = datetime;
        this.duration = duration;
    }

    getEndTime(): Date {
        return new Date(this.datetime.getTime() + this.duration * 60 * 1000)
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