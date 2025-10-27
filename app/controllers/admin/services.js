import ServiceTemplate from '../../models/services/serviceTemplate.js';
import { handleResponse } from '../../utils/helper.js';
import mongoose from 'mongoose';



export const createServiceTemplate = async (req, res) => {
  const { name, tokenAmountPercent, convenienceFee } = req.body;

  if (!name) {
    return handleResponse(res, 400, 'Service name is required');
  }

  try {
    const existing = await ServiceTemplate.findOne({ name: name.trim() });
    if (existing) {
      return handleResponse(res, 400, 'Service template already exists');
    }

    const newTemplate = new ServiceTemplate({
      name: name.trim(),
      isApproved: true, 
      createdBy: req.user._id,
      createdByRole: req.user.role,
      image: req.imagePath || null,
      tokenAmountPercent: tokenAmountPercent || 0,
      convenienceFee: convenienceFee || 0          
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
  

export const getAllServiceTemplates = async (req, res) => {
    try {
      const templates = await ServiceTemplate.find({
      }).populate('createdBy', 'name email');
  
      return handleResponse(res, 200, 'All service templates', templates);
    } catch (err) {
      console.error(err);
      handleResponse(res, 500, 'Server error');
    }
};


export const approveTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    const userRole = req.user.role; 

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admin can approve templates' });
    }

    const template = await ServiceTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    template.isApproved = true;
    await template.save();

    return res.status(200).json({ message: 'Template approved successfully', template });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const getServiceTemplateById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return handleResponse(res, 400, "Invalid ID.");
  }


  try {
    const template = await ServiceTemplate.findById(id).populate('createdBy', 'name');

    if (!template) {
      return handleResponse(res, 404, 'Service template not found');
    }

    return handleResponse(res, 200, 'Service template fetched successfully', template);
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Server error');
  }
};


export const updateServiceTemplate = async (req, res) => {
  const { id } = req.params;
  const { name, tokenAmountPercent, convenienceFee } = req.body;

  try {
    const template = await ServiceTemplate.findById(id);
    if (!template) {
      return handleResponse(res, 404, 'Service template not found');
    }

    if (name) {
      const existing = await ServiceTemplate.findOne({ 
        name: name.trim().toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existing) {
        return handleResponse(res, 400, 'Another template with this name already exists');
      }
      template.name = name.trim();
    }

    if (tokenAmountPercent !== undefined) {
      template.tokenAmountPercent = tokenAmountPercent;
    }

    if (convenienceFee !== undefined) {
      template.convenienceFee = convenienceFee;
    }

    if (req.imagePath) {
      template.image = req.imagePath;
    }

    await template.save();

    return handleResponse(res, 200, 'Service template updated successfully', template);
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Server error');
  }
};



export const deleteServiceTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    const template = await ServiceTemplate.findByIdAndDelete(id);

    if (!template) {
      return handleResponse(res, 404, 'Service template not found');
    }

    return handleResponse(res, 200, 'Service template deleted successfully');
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, 'Server error');
  }
};
