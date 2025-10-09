import ServiceTemplate from '../../models/services/serviceTemplate.js';
import { handleResponse } from '../../utils/helper.js';


export const createServiceTemplate = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return handleResponse(res, 400, 'Service name is required');
  }

  try {
    const existing = await ServiceTemplate.findOne({ name: name.trim().toLowerCase() });
    if (existing) {
      return handleResponse(res, 400, 'Service template already exists');
    }

    const newTemplate = new ServiceTemplate({
      name: name.trim().toLowerCase(),
      isApproved: true, 
      createdBy: req.user._id,
      createdByRole: req.user.role
    });

    await newTemplate.save();

    return handleResponse(res, 201, 'Service template created successfully', newTemplate);
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Server error');
  }
};

export const approveServiceTemplate = async (req, res) => {
    const { id } = req.params;
  
    try {
      const template = await ServiceTemplate.findById(id);
  
      if (!template) {
        return handleResponse(res, 404, 'Service template not found');
      }
  
      if (template.isApproved) {
        return handleResponse(res, 400, 'Template is already approved');
      }
  
      template.isApproved = true;
      await template.save();
  
      return handleResponse(res, 200, 'Service template approved successfully', template);
    } catch (err) {
      console.error(err);
      return handleResponse(res, 500, 'Server error');
    }
};
  
export const getPendingServiceTemplates = async (req, res) => {
    try {
      const templates = await ServiceTemplate.find({
        isApproved: false,
        createdByRole: 'provider'
      }).populate('createdBy', 'name email');
  
      return handleResponse(res, 200, 'Pending service requests', templates);
    } catch (err) {
      console.error(err);
      handleResponse(res, 500, 'Server error');
    }
};