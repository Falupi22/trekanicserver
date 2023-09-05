import { messageSchema } from "../helpers/schemas";
import { createEvent } from "../helpers/socket";
import { freeAppointment, storeAppointment } from "../managers/localAppointmentManager";

const ROUTE_APPOINTMENTS: string = "appointments";
const EVENT_APPOINTMENTS_STORE: string = "store";
const EVENT_APPOINTMENTS_STORED: string = "stored";
const EVENT_APPOINTMENTS_FREE: string = "free";
const EVENT_APPOINTMENTS_FREED: string = "freed";

export const storeAppointmentEvent = createEvent(`${ROUTE_APPOINTMENTS}:${EVENT_APPOINTMENTS_STORE}`, messageSchema
  , async (socket, { message }) => {
    storeAppointment(message, socket.id, (appointment) => {
      socket.broadcast.emit(`${ROUTE_APPOINTMENTS}:${EVENT_APPOINTMENTS_STORED}`, appointment);
    }, (appointment) => {
      socket.broadcast.emit(`${ROUTE_APPOINTMENTS}:${EVENT_APPOINTMENTS_FREED}`, appointment);
    });
  });

export const freeAppointmentEvent = createEvent(`${ROUTE_APPOINTMENTS}:${EVENT_APPOINTMENTS_FREE}`, messageSchema
  , async (socket, { message }) => {
    freeAppointment(message, (appointment) => {
      socket.broadcast.emit(`${ROUTE_APPOINTMENTS}:${EVENT_APPOINTMENTS_FREED}`, appointment);
    })
  });