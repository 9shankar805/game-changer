# Cart Debug Guide

## Issue: Products not appearing in cart after clicking "Add to Cart"

### Debug Steps Added:

1. **Console Logs in useCart.tsx**:
   - Guest cart localStorage operations
   - Product addition tracking
   - Cart refresh operations

2. **Console Logs in Cart.tsx**:
   - Cart state display
   - Loading status
   - User authentication status

### How to Debug:

1. **Open Browser Developer Tools** (F12)
2. **Go to Console tab**
3. **Try adding a product to cart**
4. **Check the console logs**

### Expected Console Output:

```
Adding to guest cart: {productId: 1, quantity: 1}
Added new item: {id: 1234567890, productId: 1, quantity: 1, userId: null, createdAt: "..."}
Saved guest cart to localStorage: [{id: 1234567890, productId: 1, quantity: 1, ...}]
Guest cart from localStorage: [{id: 1234567890, productId: 1, quantity: 1, ...}]
Cart items with products: [{id: 1234567890, productId: 1, quantity: 1, product: {...}}]
Cart component - cartItems: [{...}]
Cart component - totalItems: 1
```

### Common Issues to Check:

1. **Network Errors**: Check if `/api/products/{id}` requests are failing
2. **localStorage Issues**: Check if localStorage is working in your browser
3. **Authentication Issues**: Check if user state is correct
4. **Product API Issues**: Check if product data is being fetched correctly

### Manual Test:

1. Open browser console
2. Run: `localStorage.setItem('guestCart', JSON.stringify([{id: 999, productId: 1, quantity: 1}]))`
3. Refresh the cart page
4. Check if the item appears

### Quick Fix Test:

If the issue persists, try this temporary fix in the browser console:

```javascript
// Force refresh cart
window.location.reload();

// Or manually trigger cart refresh
const event = new CustomEvent('cartRefresh');
window.dispatchEvent(event);
```

### Next Steps:

1. Run the app and try adding products
2. Check console logs for any errors
3. Verify localStorage contains cart data
4. Check network tab for failed API requests