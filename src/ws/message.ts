import Joi from "joi";
import { messageSchema } from "./schemas";
import { createEvent } from "./socket";

export const sendMessage = createEvent("message:send", messageSchema
, async (socket, { message, to }) => {
    // Insert your logic here
  });