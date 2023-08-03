import mongoose from "mongoose";

export let User = null;

export const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    secret: String
  });

export function setUserModel() {
   if (!User) {
    User = mongoose.model("User", userSchema, "users")
   }
  }

export function setUserPlugin(plugin) {
    userSchema.plugin(plugin);
}