// models/serviceTemplate.js
import mongoose from 'mongoose';

const serviceTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByRole: {
    type: String,
    enum: ['admin', 'provider'],
    required: true
  },
  isApproved: {
    type: Boolean,
    default: function () {
      return this.createdByRole === 'admin'; 
    }
  },
  image: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ServiceTemplate = mongoose.model('ServiceTemplate', serviceTemplateSchema);
export default ServiceTemplate;
