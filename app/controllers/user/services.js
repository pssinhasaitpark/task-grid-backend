import ServiceTemplate from "../../models/services/serviceTemplate.js";
import ProviderService from "../../models/services/providerService.js";
import User from "../../models/user/user.js";
import { handleResponse } from "../../utils/helper.js";
import mongoose from "mongoose";
import Address from "../../models/user/address.js";





export const createTemplateRequest = async (req, res) => {
  try {
    const { name } = req.body;
    const providerId = req.user._id;
    const createdByRole = req.user.role;

    if (createdByRole !== "provider") {
      return res
        .status(403)
        .json({ error: "Only providers can request templates" });
    }

    const existing = await ServiceTemplate.findOne({
      name,
      createdBy: providerId,
    });
    if (existing) {
      return res
        .status(400)
        .json({ error: "You have already requested this template" });
    }

    const template = new ServiceTemplate({
      name,
      createdBy: providerId,
      createdByRole,
      isApproved: false,
      image: req.imagePath || null,
    });

    await template.save();
    return res
      .status(201)
      .json({ message: "Template request submitted for approval", template });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const createProviderService = async (req, res) => {
  try {
    const { template, hourlyRate, dailyRate, description } = req.body;
    const providerId = req.user._id;

    if (!hourlyRate && !dailyRate) {
      return res.status(400).json({
        error: "At least one of hourlyRate or dailyRate must be provided",
      });
    }

    const templateDoc = await ServiceTemplate.findById(template);
    if (!templateDoc || !templateDoc.isApproved) {
      return res
        .status(400)
        .json({ error: "Template is not approved or does not exist" });
    }

    const existingService = await ProviderService.findOne({
      provider: providerId,
      template,
    });

    let service;

    if (existingService) {
      existingService.hourlyRate = hourlyRate;
      existingService.dailyRate = dailyRate;
      existingService.description = description;
      existingService.isApproved = true; // ✅ approve updated service
      service = await existingService.save();
    } else {
      service = new ProviderService({
        provider: providerId,
        template,
        hourlyRate,
        dailyRate,
        description,
        isApproved: true, // ✅ approve newly created service
      });

      await service.save();
    }

    // Mark onboarding complete (set is_new = false)
    await User.findByIdAndUpdate(providerId, { isNew: false });

    return res.status(201).json({
      message: existingService
        ? "Service updated and approved successfully"
        : "Service created and approved successfully",
      service,
    });
  } catch (error) {
    console.log("error===", error);
    return res.status(500).json({ error: error.message });
  }
};


export const getMyServiceRequests = async (req, res) => {
  const userId = req.user._id;

  try {
    const services = await ServiceTemplate.find({ createdBy: userId });

    return res.status(200).json({ message: "Your service requests", services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


export const getMyServices = async (req, res) => {
  try {
    const providerId = req.user._id;

    const services = await ProviderService.find({ provider: providerId })
      .populate("template", "name image",)
      .sort({ createdAt: -1 });

    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateProviderService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const providerId = req.user._id;
    const { hourlyRate, dailyRate, description } = req.body;

    const service = await ProviderService.findOne({
      _id: serviceId,
      provider: providerId,
    });
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (hourlyRate !== undefined) service.hourlyRate = hourlyRate;
    if (dailyRate !== undefined) service.dailyRate = dailyRate;
    if (description !== undefined) service.description = description;

    await service.save();
    return res
      .status(200)
      .json({ message: "Service updated successfully", service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteProviderService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const providerId = req.user._id;

    const service = await ProviderService.findOneAndDelete({
      _id: serviceId,
      provider: providerId,
    });

    if (!service) {
      return res
        .status(404)
        .json({ error: "Service not found or not authorized" });
    }

    return res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getAllApprovedServices = async (req, res) => {
  try {
    const services = await ProviderService.find({ isApproved: true })
      .populate("template", "name image")
      .populate("provider", "name")
      .sort({ createdAt: -1 });

    return handleResponse(res, 200, "Services fetched successfuly", services);
  } catch (error) {
    return handleResponse(res, 500, "Internal server error");
  }
};


export const getAllTemplateNames = async (req, res) => {
  try {
    const templates = await ServiceTemplate.find({ isApproved: true })
      .select("name image")
      .sort({ createdAt: -1 });

    return handleResponse(
      res,
      200,
      "All templates fetched successfully",
      templates
    );
  } catch (error) {
    return handleResponse(res, 500, "Internal server error");
  }
};


export const getServicesByTemplate = async (req, res) => {
  try {
    const templateId = req.params.templateId;

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return handleResponse(res, 400, "Invalid template ID.");
    }

    const services = await ProviderService.find({
      template: templateId,
      isApproved: true,
    })
      .populate("provider", "name")
      .sort({ createdAt: -1 });

    return handleResponse(
      res,
      200,
      "Approved services fetched successfully",
      services
    );
  } catch (err) {
    console.error("Error fetching services by template:", err);
    return handleResponse(res, 500, "Internal server error");
  }
};


/* export const getProvidersByServiceTemplate = async (req, res) => {
  try {
    const { templateId, page = 1, limit = 10 } = req.query;

  
    let templateFilter = {};
    let templateIds = [];

    if (templateId) {
      templateIds = templateId.split(',').map(id => id.trim());


      const existingTemplates = await ServiceTemplate.find({
        _id: { $in: templateIds }
      }).select('_id');

      if (existingTemplates.length === 0) {
        return handleResponse(res, 404, "No matching service templates found");
      }

      templateFilter.template = { $in: templateIds };
    }


    const allProviderServices = await ProviderService.find({
      ...templateFilter,
      isApproved: true,
    }).select('provider');


    const uniqueProviderIds = [...new Set(allProviderServices.map(ps => ps.provider.toString()))];

    if (uniqueProviderIds.length === 0) {
      return handleResponse(res, 200, "No verified providers found", {
        count: 0,
        providers: [],
      });
    }


    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;


    const paginatedProviderIds = uniqueProviderIds.slice(skip, skip + limitNum);


    const providers = await User.find({
      _id: { $in: paginatedProviderIds },
      isVerified: true,
    }).select('name email serviceArea isVerified profile_image');

    if (providers.length === 0) {
      return handleResponse(res, 200, "No verified providers found on this page", {
        count: 0,
        providers: [],
      });
    }

   
    const services = await ProviderService.find({
      provider: { $in: providers.map(p => p._id) },
      isApproved: true,
      ...(templateFilter.template ? { template: templateFilter.template } : {}),
    })
    .populate('template', 'name')
    .select('provider template hourlyRate dailyRate description'); 
    
   
    const servicesByProvider = {};
    services.forEach(service => {
      const provId = service.provider.toString();
      if (!servicesByProvider[provId]) {
        servicesByProvider[provId] = [];
      }
      servicesByProvider[provId].push(service);
    });


    const providersWithServices = providers.map(provider => ({
      ...provider.toObject(),
      services: servicesByProvider[provider._id.toString()] || [],
    }));

    
    return handleResponse(res, 200, "Verified providers with services fetched successfully", {
      count: uniqueProviderIds.length,
      page: pageNum,
      limit: limitNum,
      providers: providersWithServices,
    });

  } catch (error) {
    console.error("Error fetching verified providers by template:", error);
    return handleResponse(res, 500, "Server Error");
  }
};
 */




export const getProvidersByServiceTemplate = async (req, res) => {
  try {
    const { templateId, page = 1, limit = 10, addressId } = req.query;

    // ✅ 1. Pagination validation
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    // ✅ 2. Validate templateId(s)
    let templateFilter = {};
    if (templateId) {
      const templateIds = templateId.split(",").map((id) => id.trim());
      const validTemplates = await ServiceTemplate.find({
        _id: { $in: templateIds },
      }).select("_id");

      if (!validTemplates.length) {
        return handleResponse(res, 404, "No matching service templates found");
      }

      templateFilter.template = { $in: validTemplates.map((t) => t._id) };
    }

    // ✅ 3. Resolve user's city/state from addressId (if given)
    let locationQuery = null;
    if (addressId) {
      if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return handleResponse(res, 400, "Invalid addressId format");
      }

      const address = await Address.findById(addressId).select("city state");
      if (!address) {
        return handleResponse(res, 404, "Address not found");
      }

      locationQuery = { city: address.city, state: address.state };
    }

    // ✅ 4. Get provider IDs with approved services (fast lookup)
    const providerServices = await ProviderService.find({
      ...templateFilter,
      isApproved: true,
    }).select("provider");

    const providerIds = [
      ...new Set(providerServices.map((ps) => ps.provider.toString())),
    ];

    if (!providerIds.length) {
      return handleResponse(res, 200, "No approved provider services found", {
        count: 0,
        providers: [],
      });
    }

    // ✅ 5. Build aggregation pipeline for provider filtering
    const aggregationPipeline = [
      {
        $match: {
          _id: { $in: providerIds.map((id) => new mongoose.Types.ObjectId(id)) },
          isVerified: true,
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "_id",      // User._id ↔ Address.user
          foreignField: "user",
          as: "addresses",
        },
      },
    ];

    if (locationQuery) {
      aggregationPipeline.push({
        $match: {
          addresses: {
            $elemMatch: {
              city: { $regex: new RegExp(`^${locationQuery.city}$`, "i") },
              state: { $regex: new RegExp(`^${locationQuery.state}$`, "i") },
            },
          },
        },
      });
    }

    // ✅ 6. Use $facet to get paginated results + total count
    aggregationPipeline.push({
      $facet: {
        totalCount: [{ $count: "count" }],
        providers: [
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              name: 1,
              email: 1,
              profile_image: 1,
              isVerified: 1,
            },
          },
        ],
      },
    });

    const [result] = await User.aggregate(aggregationPipeline);
    const totalCount = result.totalCount?.[0]?.count || 0;
    const providers = result.providers || [];

    if (!providers.length) {
      return handleResponse(res, 200, "No providers found for this location", {
        count: totalCount,
        providers: [],
      });
    }

    // ✅ 7. Fetch their approved services
    const providerIdsOnPage = providers.map((p) => p._id);
    const services = await ProviderService.find({
      provider: { $in: providerIdsOnPage },
      isApproved: true,
      ...(templateFilter.template ? { template: templateFilter.template } : {}),
    })
      .populate("template", "name")
      .select("provider template hourlyRate dailyRate description");

    // ✅ 8. Group services by provider
    const servicesByProvider = services.reduce((acc, s) => {
      const id = s.provider.toString();
      if (!acc[id]) acc[id] = [];
      acc[id].push(s);
      return acc;
    }, {});

    // ✅ 9. Merge providers + their services (no address data returned)
    const providersWithServices = providers.map((provider) => ({
      ...provider,
      services: servicesByProvider[provider._id.toString()] || [],
    }));

    // ✅ 10. Final Response
    return handleResponse(res, 200, "Providers fetched successfully", {
      count: totalCount,
      page: pageNum,
      limit: limitNum,
      providers: providersWithServices,
    });
  } catch (error) {
    console.error("❌ Error fetching providers:", error);
    return handleResponse(res, 500, "Server Error");
  }
};
