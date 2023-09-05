import Joi, { ObjectSchema } from "joi";

export const messageSchema: ObjectSchema = Joi.object().keys({
    message: Joi.string().required().description("The content of the message"),
    sender: Joi.string().optional().description("The name of the user that sent the message"),
  });