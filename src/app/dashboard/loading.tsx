import { PageContainer } from "@/components/ui/page-container";

export default function DashboardLoading() {
  return (
    <PageContainer className="ops-page">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-40 rounded-lg bg-gray-200" />
        <div className="h-4 w-56 rounded bg-gray-100" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-80 w-72 shrink-0 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
