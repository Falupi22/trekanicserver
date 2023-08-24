import mongoose, { Schema, Document, ObjectId } from 'mongoose';

interface Mechanic extends Document {
  fullName: string,
  appointments: Array<ObjectId>
}

const mechanicSchema: Schema = new mongoose.Schema({
  fullName: {type: String, require: true},
  appointments: {type: Array<Schema.Types.ObjectId>, require: true}
});

export const MechanicModel = mongoose.model<Mechanic>('Mechanic', mechanicSchema, "mechanics");

export default Mechanic;
