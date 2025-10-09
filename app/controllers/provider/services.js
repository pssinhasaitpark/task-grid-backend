

export const requestNewServiceTemplate = async (req, res) => {
    const { name } = req.body;
    const user = req.user;
  
    try {
      const existing = await ServiceTemplate.findOne({ name });
      if (existing) {
        return handleResponse(res, 400, 'Service already exists');
      }
  
      const template = new ServiceTemplate({
        name,
        createdBy: user._id,
        createdByRole: user.role,
        isApproved: false // since it's provider
      });
  
      await template.save();
      return handleResponse(res, 201, 'Service request submitted for approval', template);
    } catch (err) {
      console.error(err);
      handleResponse(res, 500, 'Server error');
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
  