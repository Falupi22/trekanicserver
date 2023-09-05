/**
 * Create an event to be implemented into sockets
 * @param {String} name - The name of the event
 * @param {object} rules - Object containing Joi validation rules
 * @param {Function} fn - The function to be called on event
 * @returns {*} The event Object
 */
export const createEvent = (name, validationSchema, fn) => {
    return {
        name,
        validationSchema, 
        fn
    };
};

/**
 * Bind an event to a socket
 * @param {String} name - The name of the event
 * @param {any} validation - A Joi object validation
 * @param {Function} fn - The function to be called on event
 */
export const bindEvent = (socket, { name, validationSchema, fn }) => {
    socket.on(name, (payload = {}) => {
        if (validationSchema) {
            const { error } = validationSchema.validate(payload);

            if (error) {
                return socket.emit(name, { error });
            }
        }
        return fn(socket, payload);
    });
};