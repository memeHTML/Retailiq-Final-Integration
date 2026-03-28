import {
  analyzeShelfScan,
  digitizeReceiptFromUrl,
  generateAiForecast,
  optimizeAiPricing,
  queryAiAssistantV2,
  recommendAiV2,
} from '@/api/aiTools';

export const forecast = generateAiForecast;
export const pricingOptimize = optimizeAiPricing;
export const visionShelfScan = analyzeShelfScan;
export const visionReceipt = digitizeReceiptFromUrl;
export const query = queryAiAssistantV2;
export const recommend = recommendAiV2;

export {
  analyzeShelfScan,
  digitizeReceiptFromUrl,
  generateAiForecast,
  optimizeAiPricing,
  queryAiAssistantV2,
  recommendAiV2,
};
