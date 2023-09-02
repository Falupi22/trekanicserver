import mongoose, { Schema, Document } from 'mongoose';

interface IssueCategory extends Document {
  name: string; // Duration in minutes
  // Define other properties
}

const issueCategorySchema: Schema = new mongoose.Schema({
    name: { type: String, require: true }
});

export const IssueCategoryModel = mongoose.model<IssueCategory>('IssueCategory', issueCategorySchema, 'issueCategories');

export default IssueCategory;