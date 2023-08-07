import mongoose from "mongoose";

export const appointmentSchema = new mongoose.Schema ({
    category: String,
    datetime: Date,
    description: String,
    customerId: mongoose.Types.ObjectId
  });

const Appointment = mongoose.model("Appointment", appointmentSchema, "appointments");

export default Appointment;