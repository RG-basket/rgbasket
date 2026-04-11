import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import useCartStore from '../../store/useCartStore';

/**
 * CartSync Component
 * Ensures that the Instamart useCartStore is ALWAYS in sync with the primary AppContext cart.
 * This prevents "stale" data like the mystery 1200 subtotal in the floating bar.
 */
const CartSync = () => {
    const { getCartItemsWithDetails, cartItems } = useAppContext();
    const { items: zustandItems, deleteItem, updateItemQuantity, addItem, applyGiftLogic } = useCartStore();
    
    // Use a ref to prevent infinite loops if store updates trigger re-syncs
    const isSyncing = useRef(false);

    useEffect(() => {
        if (isSyncing.current) return;

        const detailedItems = getCartItemsWithDetails();
        const currentZustandItems = useCartStore.getState().items.filter(i => !i.isGift);

        // 1. Check if counts match. If not, full sync.
        const contextKeys = Object.keys(cartItems);
        
        // If context says cart is empty, ensure Zustand is empty
        if (contextKeys.length === 0 && currentZustandItems.length > 0) {
            isSyncing.current = true;
            useCartStore.setState({ items: [], giftTier: 0 });
            isSyncing.current = false;
            return;
        }

        // Deep comparison or simple key-set comparison
        const needsSync = contextKeys.length !== currentZustandItems.length || 
                         currentZustandItems.some(zi => cartItems[zi.id] !== zi.quantity);

        if (needsSync) {
            isSyncing.current = true;
            
            const newItems = detailedItems.map(item => {
                const weight = item.product.weights?.[item.weightIndex];
                const itemPrice = weight?.offerPrice || weight?.price || item.product.price;
                
                return {
                    id: item.itemKey,
                    name: item.product.name,
                    weight: `${weight?.weight}${weight?.unit || ""}`,
                    price: itemPrice,
                    originalPrice: weight?.price || item.product.price,
                    image: item.product.images?.[0] || "",
                    quantity: item.quantity,
                    isGift: false
                };
            });


            useCartStore.setState({ items: newItems });
            useCartStore.getState().applyGiftLogic();
            
            isSyncing.current = false;
        }
    }, [cartItems, getCartItemsWithDetails]);

    return null;
};

export default CartSync;
