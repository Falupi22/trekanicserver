import { Server } from 'socket.io';
import { bindEvent } from "./helpers/socket";
import * as messageHandlers from "./events/message";
import { freeClientAppointments } from './managers/localAppointmentManager';

export default (listener) => {
  const handlers = Object.values({
    ...messageHandlers
  });

  const sio = new Server(listener);
  sio.on("connection", (socket) => {
      handlers.forEach((handler) => {
        bindEvent(socket, handler);
    });

    socket.on("disconnect", () => {
      freeClientAppointments(socket.id);
    });
  });
};