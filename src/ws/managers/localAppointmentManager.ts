const APPOINTMENT_TIMEOUT = 300000; // 5 minutes in milliseconds
const appointments = new Map();

/*
    * Stores an appointment in the appointments Map.
    * @param appointment The appointment to store.
    * @param socketId The socket id of the client that sent the appointment.
    * @param notifyTakenCallback The callback to notify the client that the appointment has been taken.
    * @param notifyFreedCallback The callback to notify the client that the appointment has been freed.
*/
export const storeAppointment = (appointment, socketId, notifyTakenCallback,
    notifyFreedCallback) => {

    if (isValidAppointment(appointment)) {
        appointments.set(appointment.datetime, {
            datetime: appointment.datetime,
            clientId: socketId,
        });

        // Notify all connected clients that the appointment is taken
        notifyTakenCallback(appointment);

        // Schedule a timeout to free the appointment if not saved
        setTimeout(() => {
            freeAppointment(appointment, notifyFreedCallback);
        }, APPOINTMENT_TIMEOUT);
    }
};

/* 
    * Frees an appointment in the appointments Map.
    * @param appointment The appointment to free.
    * @param notifyFreedCallback The callback to notify the client that the appointment has been freed.
*/
export const freeAppointment = (appointment, notifyFreedCallback) => {
    if (appointments.has(appointment.datetime)) {
        appointments.delete(appointment.datetime);
        notifyFreedCallback(appointment);
    }
}

/* 
    * Frees all appointments of a specific client.
    * @param socketId The socket id of the client.
*/
export const freeClientAppointments = (socketId) => {
    for (const appointment of appointments.values()) {
        if (appointment.clientId === socketId) {
            appointments.delete(appointment.datetime);
        }
    }
}

function isValidAppointment(appointment) {
    return appointment && appointment.datetime && appointment.issue &&
           appointment.Issue.duration && appointment.clientId;
}