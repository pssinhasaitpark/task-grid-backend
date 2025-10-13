import ServiceTemplate from '../../models/services/serviceTemplate.js';
import ProviderService from '../../models/services/providerService.js'



export const createTemplateRequest = async (req, res) => {
  try {
    const { name } = req.body;
    const providerId = req.user._id; 
    const createdByRole = req.user.role;


    if (createdByRole !== 'provider') {
      return res.status(403).json({ error: 'Only providers can request templates' });
    }

    const existing = await ServiceTemplate.findOne({ name, createdBy: providerId });
    if (existing) {
      return res.status(400).json({ error: 'You have already requested this template' });
    }

    const template = new ServiceTemplate({
      name,
      createdBy: providerId,
      createdByRole,
      isApproved: false,
      image: req.imagePath || null 
    });

    await template.save();
    return res.status(201).json({ message: 'Template request submitted for approval', template });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const createProviderService = async (req, res) => {
  try {
    const { template, price, duration, description } = req.body;
    const provider = req.user._id;


    const templateDoc = await ServiceTemplate.findById(template);
    if (!templateDoc || !templateDoc.isApproved) {
      return res.status(400).json({ error: 'Template is not approved or does not exist' });
    }

    const service = new ProviderService({
      provider,
      template,
      price,
      duration,
      description
    });

    await service.save();
    return res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    console.log("error===",error);
    
    return res.status(500).json({ error: error.message });

  }
};


export const getMyServiceRequests = async (req, res) => {
    const userId = req.user._id;
  
    try {
      const services = await ServiceTemplate.find({ createdBy: userId });
  
      return handleResponse(res, 200, 'Your service requests', services);
    } catch (err) {
      console.error(err);
      handleResponse(res, 500, 'Server error');
    }
};
  

export const getMyServices = async (req, res) => {
  try {
    const providerId = req.user._id;

  
    const services = await ProviderService.find({ provider: providerId })
      .populate('template', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};