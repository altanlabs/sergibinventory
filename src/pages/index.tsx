import { CS2InventoryDashboard } from "@/components/blocks/cs2-inventory-dashboard";

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <CS2InventoryDashboard />
      </div>
    </div>
  );
}