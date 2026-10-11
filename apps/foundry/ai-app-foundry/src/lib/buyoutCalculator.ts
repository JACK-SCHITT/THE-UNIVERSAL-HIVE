import type { BuyoutProjection } from "@/types";
import { NICHE_MULTIPLIERS, BUYOUT_PERCENTAGE } from "@/constants";

export function calculateBuyout(
  appId: string,
  monthlyRevenue: number,
  growthRate: number,
  niche: string
): BuyoutProjection {
  const annualRevenue = monthlyRevenue * 12;
  const nicheMultiplier = NICHE_MULTIPLIERS[niche] ?? 5.5;
  const yearlyBreakdown: { year: number; revenue: number }[] = [];

  let projected10Year = 0;
  let temp = annualRevenue;

  for (let year = 1; year <= 10; year++) {
    projected10Year += temp;
    yearlyBreakdown.push({ year, revenue: Math.round(temp) });
    temp = temp * (1 + growthRate);
  }

  const buyoutPrice = projected10Year * BUYOUT_PERCENTAGE;
  const colossalShare = projected10Year * 0.10; // lifetime 10% after year 1

  console.log("[BuyoutCalc] App:", appId, "| 10yr projection:", projected10Year, "| Buyout:", buyoutPrice);

  return {
    appId,
    currentMRR: monthlyRevenue,
    annualRevenue,
    growthRate,
    projected10Year,
    buyoutPrice,
    yearlyBreakdown,
    colossalShare,
    nicheMultiplier,
  };
}

export function formatBuyoutSummary(proj: BuyoutProjection): string {
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return `10-Year Projection: ${formatter.format(proj.projected10Year)} | Buyout Price: ${formatter.format(proj.buyoutPrice)}`;
}
