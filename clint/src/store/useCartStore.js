import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      giftTier: 0, 
      activeOrder: null,
      isDrawerOpen: false,
      availableOffers: [], 

      setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

      fetchOffers: async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/offers/active`);

          const data = await res.json();
          if (data.success) {
            const sortedOffers = (data.offers || [])
              .filter(o => o.isActive)
              .sort((a, b) => a.minOrderValue - b.minOrderValue);
            set({ availableOffers: sortedOffers });
            get().applyGiftLogic();
          }
        } catch (error) {
          console.error('Failed to fetch offers:', error);
        }
      },

      addItem: (product) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === product.id);

        let newItems;
        if (existingItem) {
          newItems = items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          newItems = [...items, { ...product, quantity: 1, isGift: false }];
        }

        set({ items: newItems });
        get().applyGiftLogic();
      },

      // Completely remove an item
      deleteItem: (productId) => {
        const { items } = get();
        const newItems = items.filter((item) => item.id !== productId);
        set({ items: newItems });
        get().applyGiftLogic();
      },

      removeItem: (productId) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === productId);
        if (!existingItem || existingItem.isGift) return;

        if (existingItem.quantity > 1) {
          const newItems = items.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
          );
          set({ items: newItems });
        } else {
          const newItems = items.filter((item) => item.id !== productId);
          set({ items: newItems });
        }
        get().applyGiftLogic();
      },

      updateItemQuantity: (id, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          get().deleteItem(id);
          return;
        }

        const existingItem = items.find(item => item.id === id);
        if (!existingItem) return;

        const newItems = items.map(item => 
          item.id === id ? { ...item, quantity } : item
        );

        set({ items: newItems });
        get().applyGiftLogic();
      },

      calculateSubtotal: () => {
        const { items } = get();
        // Ensure we calculate subtotal BASED ON CURRENT ITEMS
        return items
          .filter(item => !item.isGift)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },

      applyGiftLogic: () => {
        const { items, availableOffers } = get();
        const subtotal = get().calculateSubtotal();

        // 1. Find the best offer
        const activeOffer = [...availableOffers]
          .reverse()
          .find(offer => subtotal >= offer.minOrderValue);

        // Filter out existing gift items first
        let filteredItems = items.filter(item => !item.isGift);
        
        if (activeOffer && subtotal > 0) {
          filteredItems.push({
            id: `gift-${activeOffer._id}`,
            name: `${activeOffer.options[0]}`,
            weight: 'Gift Choice',
            price: 0,
            originalPrice: activeOffer.minOrderValue * 0.1, 
            image: 'https://cdn-icons-png.flaticon.com/512/3209/3209931.png',
            quantity: 1,
            isGift: true
          });
          set({ giftTier: activeOffer.minOrderValue });
        } else {
          set({ giftTier: 0 });
        }

        set({ items: filteredItems });
      },

      placeOrder: async () => {
        set({ isDrawerOpen: false });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const subtotal = get().calculateSubtotal();
        const newOrder = {
          id: `ORD-${Math.floor(Math.random() * 100000)}`,
          status: 'Confirmed',
          displayStatus: 'Confirmed',
          items: [...get().items],
          total: subtotal,
          timestamp: new Date().toISOString(),
          timeSlot: 'Morning (7:00 AM - 10:00 AM)', // Default for instant place demo
          eta: 18,
        };
        
        set({ activeOrder: newOrder, items: [], giftTier: 0 });
      },

      confirmReceived: () => {
        set({ activeOrder: null });
      },

      completeOrder: (orderId) => {
        const current = get().activeOrder;
        if (current && current.id === orderId) {
          set({ activeOrder: null });
        }
      },

      markAsDelivered: async (orderId) => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/delivered`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to update order: ${response.status}`);
          }

          const data = await response.json();
          if (data.success) {
            set({ activeOrder: null });
            return true;
          }
          return false;
        } catch (err) {
          console.error("Mark as delivered failed:", err);
          return false;
        }
      },

      syncActiveOrder: async (userId) => {
        if (!userId) return;
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/user/${userId}`);
          const data = await res.json();
          
          if (data.success && data.orders?.length > 0) {
            const activeStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out for delivery'];
            const active = data.orders
              .filter(o => activeStatuses.includes(o.status.toLowerCase()))
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

            if (active) {
              const currentActive = get().activeOrder;
              if (!currentActive || currentActive.id !== active._id || currentActive.status !== active.status) {
                set({ 
                  activeOrder: {
                    id: active._id,
                    status: active.status.toLowerCase(),
                    displayStatus: active.status,
                    items: active.items || [],
                    total: active.totalAmount || active.total || 0,
                    timestamp: active.createdAt,
                    deliveryDate: active.deliveryDate,
                    timeSlot: active.timeSlot || 'Standard Delivery',
                    eta: (active.status.toLowerCase() === 'shipped' || active.status.toLowerCase() === 'out for delivery') ? 12 : 25
                  } 
                });
              }
            } else if (get().activeOrder) {
              set({ activeOrder: null });
            }
          }
        } catch (err) {
          console.error("Sync active order failed:", err);
        }
      },

      dismissOrder: () => set({ activeOrder: null }),
    }),
    {
      name: 'rg-cart-storage',
      partialize: (state) => ({ 
        items: state.items, 
        activeOrder: state.activeOrder,
        giftTier: state.giftTier,
        availableOffers: state.availableOffers
      }),
    }
  )
);

export default useCartStore;
