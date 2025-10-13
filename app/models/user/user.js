import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
  },

  phone: {
    type: String,
    required: true,
  },

  serviceArea: {
    type: [String],
    default: [],
  },

  role: {
    type: String,
    enum: ["customer", "provider", "admin"],
    default: "customer",
  },
  profile_image: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  password_reset_jti: {
    type: String,
    default: null,
  },

  password_reset_token_expiry: {
    type: Date,
    default: null,
  },

  password_reset_otp_hash: { type: String, default: null },
  password_reset_otp_expires: { type: Date, default: null },
  password_reset_otp_attempts: { type: Number, default: 0 },
  password_reset_otp_verified: { type: Boolean, default: false },

  refresh_token_jti: { type: String, default: null },
  refresh_token_expiry: { type: Date, default: null },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.virtual("addresses", {
  ref: "Address",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

UserSchema.set("toObject", { virtuals: true });

UserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.password_reset_jti;
    delete ret.password_reset_token_expiry;
    delete ret.password_reset_otp_hash;
    delete ret.password_reset_otp_expires;
    delete ret.password_reset_otp_attempts;
    delete ret.password_reset_otp_verified;
    delete ret.refresh_token_jti;
    delete ret.refresh_token_expiry;
    return ret;
  },
});

const User = mongoose.model("User", UserSchema);
export default User;
