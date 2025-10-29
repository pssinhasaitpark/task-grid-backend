import ProviderService from "../models/services/providerService.js";
import User from "../models/user/user.js";

export const calculateBookingAmount = async (providerId, providerServiceId) => {
  const provider = await User.findById(providerId);
  if (!provider) throw new Error("Provider not found");

  const providerService = await ProviderService.findById(providerServiceId).populate("template");
  if (!providerService) throw new Error("Provider Service not found");

  const template = providerService.template;

  const dailyRate = providerService.dailyRate || 0;
  const tokenPercent = template.tokenAmountPercent || 0;
  const convenienceFee = template.convenienceFee || 0;

  const tokenAmount = (dailyRate * tokenPercent) / 100;

  const discount = Number(process.env.DISCOUNT_AMOUNT) || 0;
  const additionalCost = Number(process.env.ADDITIONAL_COST) || 0;
  const igstTaxPercent = Number(process.env.IGST_TAX_PERCENT) || 0;
  const sgstTaxPercent = Number(process.env.SGST_TAX_PERCENT) || 0;

  const baseAmount = tokenAmount + convenienceFee + additionalCost - discount;

  const igstTaxAmount = (baseAmount * igstTaxPercent) / 100;
  const sgstTaxAmount = (baseAmount * sgstTaxPercent) / 100;

  const paidOnline = baseAmount + igstTaxAmount + sgstTaxAmount;
  const payToProvider = dailyRate - tokenAmount;

  return {
    provider,
    providerService,
    template,
    calculations: {
      discount,
      additionalCost,
      igstTaxAmount,
      sgstTaxAmount,
      convenienceFee,
      tokenAmount,
      paidOnline,
      payToProvider,
      dailyRate,
    },
  };
};
