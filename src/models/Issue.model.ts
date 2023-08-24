import mongoose, { Schema, Document, ObjectId } from 'mongoose';

interface Issue extends Document {
  code: string,
  title: string,
  price: number,
  category: ObjectId, 
  duration: number
}

const issueSchema: Schema = new mongoose.Schema({
  code: {type: String, require: true},
  title: {type: String, require: true},
  price: {type: Schema.Types.Number, require: true},
  category: {type: Schema.Types.ObjectId, require: true},
  duration: {type: Schema.Types.Number, require: true}
});

export const IssueModel = mongoose.model<Issue>('Issue', issueSchema, "issues");

export default Issue;
