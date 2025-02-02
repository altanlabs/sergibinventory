import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { inventoryService, type CS2Item } from "@/services/inventory-service";
import { steamService } from "@/services/steam-service";
import { Skeleton } from "@/components/ui/skeleton";

export function CS2InventoryDashboard() {
  const [inventory, setInventory] = useState<CS2Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState(0);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await inventoryService.getInventoryItems();
      setInventory(items);
      setTotalValue(items.reduce((acc, item) => acc + item.last_sale_price, 0));
    } catch (err) {
      setError('Error loading inventory. Please try again later.');
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInventory = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await steamService.fetchSteamInventory();
      await fetchInventory();
    } catch (err) {
      setError('Error refreshing inventory from Steam. Please try again later.');
      console.error('Error refreshing inventory:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      "Consumer Grade": "bg-gray-500",
      "Industrial Grade": "bg-blue-500",
      "Mil-Spec": "bg-blue-600",
      "Restricted": "bg-purple-500",
      "Classified": "bg-pink-500",
      "Covert": "bg-red-500",
      "★": "bg-yellow-500",
    };
    return colors[rarity] || "bg-gray-500";
  };

  if (error) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
          <Button onClick={fetchInventory} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CS2 Inventory Dashboard</CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-[200px]" />
                ) : (
                  `Total Inventory Value: $${totalValue.toFixed(2)}`
                )}
              </CardDescription>
            </div>
            <Button
              onClick={refreshInventory}
              disabled={isRefreshing}
              className="ml-4"
            >
              {isRefreshing && (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Refresh from Steam
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Exterior</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rarity</TableHead>
                  <TableHead className="text-right">Last Sale Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-12 w-12" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="flex items-center gap-2">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 object-contain"
                        />
                        <span>{item.name}</span>
                      </TableCell>
                      <TableCell>{item.exterior}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>
                        <Badge className={getRarityColor(item.rarity)}>
                          {item.rarity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.last_sale_price.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}