import { Database } from '@altanlabs/database';

const API_BASE_URL = 'https://api.altan.ai/galaxia/hook/NZSDFo';
const BASE_ID = '60fd38bb-0ce9-4cd2-a004-689cef089ac1';

const db = new Database({
  baseId: BASE_ID,
  apiUrl: API_BASE_URL,
});

export interface CS2Item {
  id: string;
  name: string;
  exterior: string;
  type: string;
  rarity: string;
  last_sale_price: number;
  market_hash_name: string;
  image_url: string;
  steam_id: string;
  updated_at: string;
}

export const inventoryService = {
  async getInventoryItems(): Promise<CS2Item[]> {
    try {
      const response = await db.from('items').select('*').execute();
      return response.data as CS2Item[];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  async updateItem(id: string, data: Partial<CS2Item>) {
    try {
      await db.from('items').update(data).where('id', '=', id).execute();
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  async addItem(item: Omit<CS2Item, 'id'>) {
    try {
      await db.from('items').insert(item).execute();
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  }
};