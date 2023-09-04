import Joi from "joi";

/**
 * Create an event to be implemented into sockets
 * @param {String} name - The name of the event
 * @param {object} rules - Object containing Joi validation rules
 * @param {Function} fn - The function to be called on event
 * @returns {*} The event Object
 */
export const createEvent = (name, rules, fn) => {
    return {
        name,
        fn,
        validation: rules && Joi.object().keys(rules)
    };
  };