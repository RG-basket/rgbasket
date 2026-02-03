# Stale Cart Detection & Validation System

## Overview
This feature detects and handles cart items that have become unavailable or had stock changes since they were added to the cart. It provides a smooth, non-intrusive user experience while ensuring order accuracy.

## Features Implemented

### 1. **Automatic Detection**
- ✅ Validates cart on page load
- ✅ Validates before checkout/order placement
- ✅ Checks every time products data updates

### 2. **Smart Validation Checks**
The system checks for:
- **Out of Stock Items**: Products where `inStock = false` or `stock <= 0`
- **Inactive Products**: Products where `active = false`
- **Quantity Mismatches**: When cart quantity exceeds available stock
- **Max Order Limits**: When cart quantity exceeds `maxOrderQuantity`
- **Variant Availability**: When specific weight/unit variants are removed

### 3. **Auto-Adjustment (Customer-Friendly)**
- **Quantity Auto-Fix**: If cart has 5 items but only 3 are available, automatically adjusts to 3
- **No Scary Errors**: Adjustments happen silently with friendly notifications
- **Preserves User Intent**: Only removes items when absolutely necessary

### 4. **Beautiful Modal Interface**
The `StaleCartModal` component displays:
- **Categorized Issues**:
  - ❌ Out of Stock items (red theme)
  - 📦 Quantity Adjusted items (blue theme)
  - ⏸️ Inactive/Removed items (gray theme)
- **Clear Actions**:
  - Remove unavailable items button
  - Continue shopping button
  - "I'll decide later" option
- **Premium Design**: Gradient backgrounds, smooth animations, custom scrollbar

## File Changes

### New Files Created
1. **`clint/src/components/Cart/StaleCartModal.jsx`**
   - Beautiful modal component for displaying stale cart warnings
   - Categorizes issues by type (out of stock, quantity adjusted, inactive)
   - Provides clear CTAs for user action

### Modified Files
1. **`clint/src/components/Cart/index.js`**
   - Added export for `StaleCartModal`

2. **`clint/src/pages/Cart.jsx`**
   - Added state management for stale cart detection
   - Implemented `validateStaleCart()` function
   - Added validation on page load via useEffect
   - Added validation before order placement
   - Added modal handlers and rendering

## How It Works

### Flow Diagram
```
User Opens Cart Page
        ↓
Products Load (500ms delay)
        ↓
validateStaleCart() runs
        ↓
    ┌───────────────────────┐
    │ Check Each Cart Item  │
    └───────────────────────┘
            ↓
    ┌─────────────────────────────────┐
    │ Compare with Fresh Product Data │
    └─────────────────────────────────┘
            ↓
    ┌───────────────────────────────────────┐
    │ Issues Found?                         │
    │ - Out of stock?                       │
    │ - Inactive?                           │
    │ - Quantity > available stock?         │
    │ - Quantity > maxOrderQuantity?        │
    └───────────────────────────────────────┘
            ↓
        ┌───┴───┐
        │       │
       Yes      No
        │       │
        ↓       ↓
    Show Modal  Continue
    Auto-adjust
    quantities
```

### Validation Logic

```javascript
validateStaleCart() {
  For each item in cart:
    1. Find fresh product data
    2. Check if product exists
    3. Check if product is active
    4. Check if variant exists
    5. Check stock availability
    6. Check quantity vs available stock
       → If cart qty > stock: AUTO-ADJUST to stock
    7. Check maxOrderQuantity
       → If cart qty > max: AUTO-ADJUST to max
  
  Return: {
    isValid: boolean,
    staleItems: array,
    cartWasModified: boolean
  }
}
```

### Trigger Points

1. **On Cart Page Load**
   ```javascript
   useEffect(() => {
     // Runs 500ms after products load
     validateStaleCart()
   }, [cartArray.length, products.length])
   ```

2. **Before Order Placement**
   ```javascript
   placeOrder() {
     // ... other validations
     const validation = await validateStaleCart()
     if (!validation.isValid) {
       showModal()
       return // Prevent order
     }
     // ... continue with order
   }
   ```

## User Experience

### Scenario 1: Out of Stock Item
```
User added "Chicken Breast 1kg" yesterday
Today: Item is out of stock

Result:
→ Modal appears with red badge "Out of Stock"
→ Button: "Remove Unavailable Items (1)"
→ User clicks → Item removed → Toast: "1 unavailable item removed"
```

### Scenario 2: Quantity Adjustment
```
User added 5x "Eggs" yesterday (stock was 10)
Today: Stock is now 3

Result:
→ Cart automatically adjusts to 3
→ Modal shows blue badge "Quantity Adjusted"
→ Shows: "Qty: 5 → Now: 3"
→ Message: "✨ Good news! We've automatically adjusted quantities"
→ User clicks "Continue Shopping" → Proceeds normally
```

### Scenario 3: Mixed Issues
```
Cart has:
- Item A: Out of stock
- Item B: Quantity adjusted (5 → 3)
- Item C: Product removed

Result:
→ Modal shows all three categories
→ Item B auto-adjusted
→ Button removes Items A & C
→ User can proceed with adjusted Item B
```

## Technical Details

### State Management
```javascript
// Cart.jsx state
const [staleCartItems, setStaleCartItems] = useState([])
const [showStaleCartModal, setShowStaleCartModal] = useState(false)
```

### Stale Item Structure
```javascript
{
  ...cartItem,           // All original cart item data
  reason: string,        // 'out_of_stock' | 'quantity_adjusted' | 'inactive'
  message: string,       // User-friendly message
  requestedQuantity?: number,  // For quantity_adjusted
  availableQuantity?: number   // For quantity_adjusted
}
```

### Modal Props
```javascript
<StaleCartModal
  isOpen={boolean}
  onClose={function}
  staleItems={array}
  onRemoveStale={function}
  onContinueShopping={function}
/>
```

## Design Principles

1. **Non-Intrusive**: Auto-fixes what can be fixed
2. **Transparent**: Shows what changed and why
3. **User Control**: Provides clear options
4. **Premium Feel**: Beautiful animations and gradients
5. **Error Prevention**: Validates at multiple checkpoints

## Testing Scenarios

### Test Case 1: Stock Reduction
1. Add 5 items to cart
2. Admin reduces stock to 2
3. User opens cart
4. **Expected**: Modal shows quantity adjusted to 2

### Test Case 2: Product Deactivation
1. Add item to cart
2. Admin deactivates product
3. User tries to checkout
4. **Expected**: Modal shows item as inactive, prevents checkout

### Test Case 3: Out of Stock
1. Add item to cart
2. Admin sets stock to 0
3. User opens cart
4. **Expected**: Modal shows out of stock, offers removal

### Test Case 4: Multiple Issues
1. Add 3 different items
2. Make one out of stock, one inactive, one quantity reduced
3. User opens cart
4. **Expected**: Modal shows all three categories clearly

## Performance Considerations

- **Debounced Validation**: 500ms delay prevents rapid re-checks
- **Efficient Comparison**: Only checks against existing products array
- **Silent Updates**: Quantity adjustments don't trigger multiple re-renders
- **Conditional Rendering**: Modal only renders when needed

## Future Enhancements (Optional)

1. **Real-time Updates**: Use WebSocket to notify users of stock changes while browsing
2. **Wishlist Migration**: Move out-of-stock items to wishlist
3. **Stock Alerts**: Notify when out-of-stock items become available
4. **Analytics**: Track how often cart adjustments occur

## Maintenance Notes

- Modal styling uses Tailwind CSS classes
- Icons from `react-icons/fi` (Feather Icons)
- No external dependencies added
- Compatible with existing cart logic
- Doesn't interfere with slot validation or promo codes

## Support

If issues arise:
1. Check browser console for validation logs
2. Verify products array is populated
3. Ensure `updateCartItem` function works correctly
4. Check modal z-index if not appearing (currently 9999)
