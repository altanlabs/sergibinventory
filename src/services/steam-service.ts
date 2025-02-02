import axios from 'axios';
import { inventoryService, type CS2Item } from './inventory-service';

const STEAM_ID = 'Sergib';
const CS2_APP_ID = '730';

interface SteamInventoryResponse {
  assets: Array<{
    appid: string;
    contextid: string;
    assetid: string;
    classid: string;
    instanceid: string;
  }>;
  descriptions: Array<{
    appid: string;
    classid: string;
    instanceid: string;
    market_hash_name: string;
    market_name: string;
    type: string;
    icon_url: string;
    name: string;
    marketable: number;
  }>;
}

export const steamService = {
  async fetchSteamInventory() {
    try {
      // Steam inventory endpoint
      const response = await axios.get<SteamInventoryResponse>(
        `https://steamcommunity.com/id/${STEAM_ID}/inventory/json/${CS2_APP_ID}/2`
      );

      if (!response.data || !response.data.assets || !response.data.descriptions) {
        throw new Error('Invalid inventory data received from Steam');
      }

      // Process inventory items
      const items = response.data.descriptions.map(async (item) => {
        // Get market price from Steam market
        const marketPrice = await this.getMarketPrice(item.market_hash_name);

        const newItem: Omit<CS2Item, 'id'> = {
          name: item.name,
          exterior: this.extractExterior(item.market_hash_name),
          type: item.type,
          rarity: this.extractRarity(item.type),
          last_sale_price: marketPrice,
          market_hash_name: item.market_hash_name,
          image_url: `https://steamcommunity-a.akamaihd.net/economy/image/${item.icon_url}`,
          steam_id: STEAM_ID,
          updated_at: new Date().toISOString()
        };

        return newItem;
      });

      // Update database with new items
      const processedItems = await Promise.all(items);
      for (const item of processedItems) {
        await inventoryService.addItem(item);
      }

      return processedItems;
    } catch (error) {
      console.error('Error fetching Steam inventory:', error);
      throw error;
    }
  },

  async getMarketPrice(marketHashName: string): Promise<number> {
    try {
      const response = await axios.get(
        `https://steamcommunity.com/market/priceoverview/?appid=${CS2_APP_ID}&currency=1&market_hash_name=${encodeURIComponent(
          marketHashName
        )}`
      );

      if (response.data && response.data.lowest_price) {
        // Convert price string (e.g., "$10.50") to number
        return parseFloat(response.data.lowest_price.replace('$', ''));
      }

      return 0;
    } catch (error) {
      console.error('Error fetching market price:', error);
      return 0;
    }
  },

  extractExterior(marketHashName: string): string {
    const exteriors = [
      'Factory New',
      'Minimal Wear',
      'Field-Tested',
      'Well-Worn',
      'Battle-Scarred'
    ];
    
    for (const exterior of exteriors) {
      if (marketHashName.includes(`(${exterior})`)) {
        return exterior;
      }
    }
    
    return 'Not Applicable';
  },

  extractRarity(type: string): string {
    const rarityMap: { [key: string]: string } = {
      'Consumer Grade': 'Consumer Grade',
      'Industrial Grade': 'Industrial Grade',
      'Mil-Spec Grade': 'Mil-Spec',
      'Restricted': 'Restricted',
      'Classified': 'Classified',
      'Covert': 'Covert'
    };

    for (const [key, value] of Object.entries(rarityMap)) {
      if (type.includes(key)) {
        return value;
      }
    }

    return type.includes('★') ? '★' : 'Consumer Grade';
  }
};