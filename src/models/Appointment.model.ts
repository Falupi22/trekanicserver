import mongoose, { Document, Schema } from "mongoose";

interface AppointmentSchema {
  category: mongoose.Types.ObjectId,
  datetime: Date,
  description: String,
  customer: mongoose.Types.ObjectId,
  mechanic: mongoose.Types.ObjectId,
  product: mongoose.Types.ObjectId
}

export interface Appointment extends AppointmentSchema, Document {}

export const appointmentSchema = new mongoose.Schema<Appointment> ({
    category: {type: Schema.Types.ObjectId, required: true},
    datetime: {type: Date, required: true},
    description: {type: String, required: true},
    customer: {type: Schema.Types.ObjectId, required: true},
    mechanic: {type: Schema.Types.ObjectId, required: true},
    product: {type: Schema.Types.ObjectId, required: true}
  });

export const AppointmentModel = mongoose.model("Appointment", appointmentSchema, "appointments");

export default Appointment;