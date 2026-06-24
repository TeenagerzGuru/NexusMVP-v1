"use client";

type BrandPricing = {
  slug: string;
  name: string;
  lanes: Array<{
    id: string;
    matchLevel: string;
    originCode: string;
    destinationCode: string;
    vehicleType: string;
    basePrice: number;
    label: string | null;
  }>;
  surcharges: Array<{ addonType: string; valueType: string; value: number }>;
  config: { marginMultiplier: number; minimumJobValue: number } | null;
};

export function PricingEditor({ brands }: { brands: BrandPricing[] }) {
  return (
    <div className="space-y-8">
      {brands.map((brand, i) => (
        <section key={brand.slug} className="animate-fade-in-up nexus-card" style={{ animationDelay: `${i * 80}ms` }}>
          <h2 className="text-lg font-semibold">{brand.name}</h2>
          {brand.config && (
            <p className="text-sm text-gray-600">
              Margin ×{brand.config.marginMultiplier} · Min £{brand.config.minimumJobValue}
            </p>
          )}
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Lane</th>
                <th>Vehicle</th>
                <th>Base</th>
              </tr>
            </thead>
            <tbody>
              {brand.lanes.map((lane) => (
                <tr key={lane.id} className="border-b">
                  <td className="py-2">
                    {lane.matchLevel} {lane.originCode} → {lane.destinationCode}
                  </td>
                  <td>{lane.vehicleType}</td>
                  <td>£{lane.basePrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-gray-500">
            Full inline editing via API can be added — rules are live from database on next quote.
          </p>
        </section>
      ))}
    </div>
  );
}
