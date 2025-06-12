// Define your delivery type (simplified here)
interface Delivery {
  delivery_id: number;
  // ... add other fields as needed
}

interface DeliveriesCache {
  nearest: Delivery[];
  suburbs: Delivery[];
  intercity: Delivery[];
}

// Initialize cachedDeliveries as a DeliveriesCache or null
let cachedDeliveries: DeliveriesCache | null = null;

export const setCachedDeliveries = (deliveries: DeliveriesCache) => {
  cachedDeliveries = deliveries;
};

export const getCachedDeliveries = (): DeliveriesCache | null => cachedDeliveries;
