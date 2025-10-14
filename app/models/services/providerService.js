import mongoose from 'mongoose';

const providerServiceSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceTemplate',
    required: true
  },
  hourlyRate: {
    type: Number,
    default: null
  },
  dailyRate: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const ProviderService = mongoose.model('ProviderService', providerServiceSchema);
export default ProviderService;
