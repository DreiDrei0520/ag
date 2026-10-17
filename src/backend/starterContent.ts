import { db } from '.';
import { seedData } from './seed';

// Copies the website's built-in content (services, projects, announcements, pricing, settings) into
// an empty Firebase database, keeping each record's id so links like /services/<slug> keep working.
// Sample quotations, inquiries, and notifications are left out — those come from real visitors.
export async function importStarterContent(onProgress?: (label: string) => void): Promise<void> {
  const groups = [
    ['Service categories', db.serviceCategories, seedData.serviceCategories],
    ['Services', db.services, seedData.services],
    ['Project categories', db.projectCategories, seedData.projectCategories],
    ['Projects', db.projects, seedData.projects],
    ['Pricing rules', db.pricingRules, seedData.pricingRules],
    ['Additional services', db.additionalServices, seedData.additionalServices],
    ['Announcements', db.announcements, seedData.announcements],
  ] as const;

  for (const [label, collection, items] of groups) {
    onProgress?.(label);
    // Lists are shown newest first, so write the last item first to keep the original order.
    for (const item of [...items].reverse()) {
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = item as typeof item & { updatedAt?: string };
      await (collection.create as (data: typeof rest) => Promise<unknown>)(rest);
    }
  }

  onProgress?.('Settings');
  await db.setSettings(seedData.settings);
  await db.setPricingConfig(seedData.pricingConfig);
}
