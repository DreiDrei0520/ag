import type {
  AdditionalService,
  CostLine,
  PricingConfig,
  PricingRule,
  PricingSnapshot,
  Quotation,
  QuotationInputs,
} from '../types';
import { makeQuotationNumber, nowIso, uid, parseBudgetMin } from '../lib/format';

export interface EngineDeps {
  rules: PricingRule[];
  config: PricingConfig;
  additionalServices: AdditionalService[];
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
}

function round2(n: number): number {
  return Math.round(n);
}

export function findPricingRule(rules: PricingRule[], inputs: QuotationInputs): PricingRule | null {
  const active = rules.filter((r) => r.isActive);
  const exact = active.find(
    (r) => r.projectType === inputs.projectType && r.scope === inputs.scopeOfWork
  );
  if (exact) return exact;
  return active.find((r) => r.projectType === inputs.projectType) ?? null;
}

export function computeQuotation(inputs: QuotationInputs, deps: EngineDeps): Quotation {
  const rule = findPricingRule(deps.rules, inputs);
  const baseRate = rule?.baseRate ?? 25000;

  const baseCost = round2(inputs.floorArea * baseRate);
  const materialMult = deps.config.materialMultipliers[inputs.materialPreference] ?? 1;
  const scopeMult = deps.config.scopeMultipliers[inputs.scopeOfWork] ?? 0;
  const designMult = deps.config.designMultipliers[inputs.designPreference] ?? 1;
  const laborMult = deps.config.laborMultiplier ?? 0.25;

  const materialCost = round2(baseCost * materialMult);
  const scopeCost = round2(baseCost * scopeMult);
  const designCost = round2(baseCost * designMult);
  const laborCost = round2(baseCost * laborMult);

  const selectedServices = deps.additionalServices.filter((s) =>
    inputs.additionalServiceIds.includes(s.id)
  );
  const additionalCost = round2(
    selectedServices.reduce((sum, s) => {
      const amount = s.unit === 'per sqm' ? s.price * inputs.floorArea : s.price;
      return sum + amount;
    }, 0)
  );

  const totalEstimate = round2(
    baseCost + materialCost + scopeCost + designCost + laborCost + additionalCost
  );

  const lines: CostLine[] = [
    {
      label: 'Base Construction Cost',
      detail: `${inputs.floorArea} sqm × ₱${baseRate.toLocaleString()} per sqm`,
      amount: baseCost,
    },
    {
      label: 'Material Adjustment',
      detail: `Base cost × ${Math.round(materialMult * 100)}% (${inputs.materialPreference})`,
      amount: materialCost,
    },
    {
      label: 'Scope Adjustment',
      detail: `Base cost × ${Math.round(scopeMult * 100)}% (${inputs.scopeOfWork})`,
      amount: scopeCost,
    },
    {
      label: 'Design Adjustment',
      detail: `Base cost × ${Math.round(designMult * 100)}% (${inputs.designPreference})`,
      amount: designCost,
    },
    {
      label: 'Labor & Overhead',
      detail: `Base cost × ${Math.round(laborMult * 100)}%`,
      amount: laborCost,
    },
    ...(additionalCost > 0
      ? [
          {
            label: 'Additional Services',
            detail: selectedServices.map((s) => s.name).join(', ') || 'None',
            amount: additionalCost,
          },
        ]
      : []),
  ];

  const budgetMin = parseBudgetMin(inputs.budgetRange);
  const withinBudget = budgetMin != null ? totalEstimate <= budgetMin : undefined;
  const budgetNote =
    withinBudget == null
      ? undefined
      : withinBudget
        ? 'The preliminary estimate falls within your stated budget range.'
        : 'The preliminary estimate exceeds the minimum of your stated budget range. We can adjust scope, materials, or design to match your budget.';

  const snapshot: PricingSnapshot = {
    pricingConfig: { ...deps.config },
    pricingRule: rule ? { ...rule } : null,
    computedAt: nowIso(),
  };

  return {
    id: uid('q_'),
    quotationNumber: makeQuotationNumber(),
    clientId: deps.clientId,
    clientName: deps.clientName,
    clientEmail: deps.clientEmail,
    clientPhone: deps.clientPhone,
    inputs: { ...inputs, additionalServiceIds: [...inputs.additionalServiceIds] },
    baseCost,
    materialCost,
    scopeCost,
    designCost,
    laborCost,
    additionalCost,
    totalEstimate,
    lines,
    pricingVersion: `v${deps.config.version ?? 1}`,
    pricingRuleId: rule?.id,
    pricingSnapshot: snapshot,
    budgetNote,
    withinBudget,
    status: 'Draft',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}
