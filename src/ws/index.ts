import { Server } from 'socket.io';
import { messageSchema } from './schemas';

const APPOINTMENT_TIMEOUT = 300000; // 5 minutes in milliseconds

const appointments = new Map();

/**
 * Create a new websocket server.
 * @param server The server associated with the websocket.
 */

export const wsManager = function (server) {
  const io = new Server(server);
  
  io.of('/').on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send existing appointments to the new client
    socket.emit('existing-appointments', Array.from(appointments.values()));

    socket.on('store-appointment-temp', (appointment) => {
      if (isValidAppointment(appointment)) {
        appointments.set(appointment.datetime, {
          datetime: appointment.datetime,
          clientId: socket.id,
        });

        // Notify all connected clients that the appointment is taken
        io.emit('appointment-taken', appointment);

        // Schedule a timeout to free the appointment if not saved
        setTimeout(() => {
          if (appointments.has(appointment.datetime)) {
            appointments.delete(appointment.datetime);
            io.emit('appointment-freed', appointment);
          }
        }, APPOINTMENT_TIMEOUT);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Remove any appointments associated with the disconnected client
      for (const [datetime, appointment] of appointments.entries()) {
        if (appointment.clientId === socket.id) {
          appointments.delete(datetime);
          io.emit('appointment-freed', appointment);
        }
      }
    });
  });

  function isValidAppointment(appointment) {
    // Implement your validation logic here
    return appointment && appointment.datetime && appointment.clientId;
  }
}

import Joi from "joi";

/**
 * Bind an event to a socket
 * @param {String} name - The name of the event
 * @param {any} validation - A Joi object validation
 * @param {Function} fn - The function to be called on event
 */
export const bindEvent = (socket, {name, validation, fn}) => {
    socket.on(name, (payload = {}) => {
      if (validation) {
        Joi.valid(payload, validation, (error) => {
          if (error) {
            return socket.emit(name, {error});
          }
          fn(socket, payload);
        });
      }
      return fn(socket, payload);
    });
  };

export { messageSchema };