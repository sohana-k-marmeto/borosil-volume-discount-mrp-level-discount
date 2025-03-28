// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";
/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.All,
  discounts: [],
};

/**
 * @param {RunInput} input
 */
export function run(input) {
  const discounts = [];
  const lines = input?.cart?.lines || [];
  lines.forEach((line) => {
    if (line?.merchandise?.__typename === "ProductVariant") {
      let metafieldValue = line.merchandise.product.metafield?.value;
  
      // Ensure metafieldValue is valid and parse it as JSON
      let parsedValues = metafieldValue ? JSON.parse(metafieldValue) : [];
    
      parsedValues.forEach((item) => {
        let [volumeDiscountQuantity, discountAmount] = item.split(",");
        // Convert to numbers for comparison
        volumeDiscountQuantity = Number(volumeDiscountQuantity) || 0;
        let parsedDiscountAmount = Number(discountAmount) || 0; 
        let sellingPrice = line?.cost?.amountPerQuantity?.amount;
        let compareAtPrice = line?.cost?.compareAtAmountPerQuantity?.amount;
        let requiredDiscountAmount = 0; // Initialize with 0
  
        if (volumeDiscountQuantity === line.quantity) {
          let discountAmountForMRP =
            compareAtPrice - (compareAtPrice * parsedDiscountAmount) / 100; 
          if (sellingPrice > discountAmountForMRP) {
            requiredDiscountAmount = sellingPrice - discountAmountForMRP;
          }
        }
  
        let parsedRequiredDiscount = Number(requiredDiscountAmount) || 0;
  
        // Multiply discount by quantity
        let totalDiscountAmount = parsedRequiredDiscount * line.quantity;
  
        // Apply discount if the quantity matches
        if (volumeDiscountQuantity === line.quantity && totalDiscountAmount > 0) {
          discounts.push({
            message: `Discount Applied`,
            targets: [
              {
                cartLine: {
                  id: line.id,
                },
              },
            ],
            value: {
              fixedAmount: {
                amount: totalDiscountAmount, //  Apply total discount
              },
            },
          });
        }
      });
    }
  });
  

  return discounts.length > 0
    ? {
        discountApplicationStrategy: DiscountApplicationStrategy.All,
        discounts,
      }
    : EMPTY_DISCOUNT;
}
