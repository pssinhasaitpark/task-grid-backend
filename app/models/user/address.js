// models/Address.js
import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  addressType: {
    type: String,
    enum: ['Home', 'Work', 'Other'], 
    default: 'Other'
  },

  addressLine1: {
    type: String,
    required: true
  },

  addressLine2: {
    type: String
  },

  city: {
    type: String,
    required: true
  },

  state: {
    type: String,
    required: true
  },

  pincode: {
    type: String,
    required: true
  },

  country: {
    type: String,
    required: true,
    default: 'India'
  }
}, {
  timestamps: true
});

const Address = mongoose.model('Address', AddressSchema);
export default Address;
