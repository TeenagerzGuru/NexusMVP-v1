import { PageContainer } from "@/components/ui/page-container";

export default function AdminLoading() {
  return (
    <PageContainer className="ops-page">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-100" />
        <div className="h-1.5 w-full rounded-full bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="admin-stat-card h-24 rounded-xl bg-gray-50" />
          ))}
        </div>
        <div className="admin-panel h-64 rounded-xl bg-gray-50" />
      </div>
    </PageContainer>
  );
}
