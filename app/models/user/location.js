import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isoCode: { type: String },
  countryCode: { type: String },
  stateCode: { type: String },
  type: { type: String, enum: ['country', 'state', 'city'], required: true },
  latitude: { type: Number }, 
  longitude: { type: Number }
});

const Location = mongoose.model("Location", locationSchema);

export default Location;
