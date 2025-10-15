import ServiceTemplate from "../../models/services/serviceTemplate.js";
import ProviderService from "../../models/services/providerService.js";
import User from "../../models/user/user.js";
import { handleResponse } from "../../utils/helper.js";
import mongoose from "mongoose";





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
