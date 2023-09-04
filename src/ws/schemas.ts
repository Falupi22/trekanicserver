import Joi, { ObjectSchema } from "joi";

export const messageSchema: ObjectSchema = Joi.object().keys({
    message: Joi.string().required().description("The content of the message"),
    to: Joi.string().optional().description("The name of the user to send the message")
  });