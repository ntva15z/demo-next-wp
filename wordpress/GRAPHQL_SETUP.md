# WooGraphQL Setup Guide

This document describes the GraphQL configuration for the WordPress e-commerce headless CMS.

## Requirements Covered

- **2.1**: Product queries via GraphQL endpoint
- **2.2**: Cart mutations via GraphQL endpoint
- **2.3**: Order queries and mutations via GraphQL endpoint
- **2.4**: Properly typed product data including variations

## Installed Plugins

1. **WPGraphQL** (`wp-graphql`) - Core GraphQL API for WordPress
2. **WooGraphQL** (`wp-graphql-woocommerce`) - WooCommerce GraphQL extension

## GraphQL Endpoint

- **URL**: `http://localhost:8800/graphql`
- **Method**: POST
- **Content-Type**: `application/json`

## Testing Product Queries (Requirements 2.1, 2.4)

### Query All Products

```graphql
query GetProducts {
  products(first: 10) {
    nodes {
      id
      databaseId
      name
      slug
      type
      description
      shortDescription
      sku
      price
      regularPrice
      salePrice
      onSale
      stockStatus
      stockQuantity
      formattedPrice
      stockMessage
      image {
        sourceUrl
        altText
      }
      galleryImages {
        nodes {
          sourceUrl
          altText
        }
      }
      productCategories {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
}
```

### Query Variable Product with Variations

```graphql
query GetVariableProduct($slug: ID!) {
  product(id: $slug, idType: SLUG) {
    id
    databaseId
    name
    slug
    type
    ... on VariableProduct {
      variationCount
      variations {
        nodes {
          id
          databaseId
          name
          sku
          price
          regularPrice
          salePrice
          stockStatus
          stockQuantity
          formattedPrice
          attributeSummary
          attributes {
            nodes {
              name
              value
            }
          }
          image {
            sourceUrl
            altText
          }
        }
      }
      attributes {
        nodes {
          id
          name
          options
          variation
          visible
        }
      }
    }
  }
}
```

Variables:
```json
{
  "slug": "your-product-slug"
}
```

### Query Product by ID

```graphql
query GetProductById($id: ID!) {
  product(id: $id, idType: DATABASE_ID) {
    id
    databaseId
    name
    slug
    price
    stockStatus
  }
}
```

## Testing Cart Mutations (Requirement 2.2)

### Add to Cart

```graphql
mutation AddToCart($productId: Int!, $quantity: Int!) {
  addToCart(input: { productId: $productId, quantity: $quantity }) {
    cartItem {
      key
      product {
        node {
          id
          name
        }
      }
      quantity
      subtotal
    }
    cart {
      contents {
        nodes {
          key
          quantity
        }
      }
      subtotal
      total
      formattedTotal
      formattedSubtotal
      itemCount
    }
  }
}
```

Variables:
```json
{
  "productId": 123,
  "quantity": 1
}
```

### Add Variable Product to Cart

```graphql
mutation AddVariationToCart($productId: Int!, $variationId: Int!, $quantity: Int!) {
  addToCart(
    input: { 
      productId: $productId, 
      variationId: $variationId, 
      quantity: $quantity 
    }
  ) {
    cartItem {
      key
      product {
        node {
          name
        }
      }
      variation {
        node {
          name
          attributeSummary
        }
      }
      quantity
    }
    cart {
      total
      formattedTotal
    }
  }
}
```

### Update Cart Item Quantity

```graphql
mutation UpdateCartItemQuantities($items: [CartItemQuantityInput]!) {
  updateItemQuantities(input: { items: $items }) {
    cart {
      contents {
        nodes {
          key
          quantity
        }
      }
      total
      formattedTotal
    }
  }
}
```

Variables:
```json
{
  "items": [
    { "key": "cart-item-key", "quantity": 2 }
  ]
}
```

### Remove Cart Item

```graphql
mutation RemoveCartItem($keys: [ID]!) {
  removeItemsFromCart(input: { keys: $keys }) {
    cart {
      contents {
        nodes {
          key
        }
      }
      total
      formattedTotal
      itemCount
    }
  }
}
```

Variables:
```json
{
  "keys": ["cart-item-key"]
}
```

### Get Cart

```graphql
query GetCart {
  cart {
    contents {
      nodes {
        key
        product {
          node {
            id
            name
            slug
          }
        }
        variation {
          node {
            id
            name
            attributeSummary
          }
        }
        quantity
        subtotal
        formattedSubtotal
      }
    }
    subtotal
    shippingTotal
    total
    formattedTotal
    formattedSubtotal
    itemCount
    appliedCoupons {
      nodes {
        code
        discountAmount
      }
    }
  }
}
```

## Testing Order Queries (Requirement 2.3)

### Create Order (Checkout)

```graphql
mutation Checkout($input: CheckoutInput!) {
  checkout(input: $input) {
    order {
      id
      databaseId
      orderNumber
      status
      total
      formattedTotal
      statusLabel
      formattedDate
    }
    result
    redirect
  }
}
```

Variables:
```json
{
  "input": {
    "paymentMethod": "cod",
    "billing": {
      "firstName": "Nguyen",
      "lastName": "Van A",
      "address1": "123 Nguyen Hue",
      "city": "Ho Chi Minh",
      "state": "SG",
      "postcode": "700000",
      "country": "VN",
      "email": "test@example.com",
      "phone": "0901234567"
    },
    "shipping": {
      "firstName": "Nguyen",
      "lastName": "Van A",
      "address1": "123 Nguyen Hue",
      "city": "Ho Chi Minh",
      "state": "SG",
      "postcode": "700000",
      "country": "VN"
    }
  }
}
```

### Query Customer Orders (Authenticated)

```graphql
query GetCustomerOrders {
  customer {
    id
    email
    orders {
      nodes {
        id
        databaseId
        orderNumber
        status
        statusLabel
        date
        formattedDate
        total
        formattedTotal
        lineItems {
          nodes {
            product {
              node {
                name
                slug
              }
            }
            quantity
            total
          }
        }
        formattedShippingAddress
        formattedBillingAddress
      }
    }
  }
}
```

### Query Single Order

```graphql
query GetOrder($id: ID!) {
  order(id: $id, idType: DATABASE_ID) {
    id
    databaseId
    orderNumber
    status
    statusLabel
    date
    formattedDate
    subtotal
    shippingTotal
    total
    formattedTotal
    paymentMethod
    paymentMethodTitle
    customerNote
    lineItems {
      nodes {
        product {
          node {
            id
            name
            slug
            image {
              sourceUrl
            }
          }
        }
        variation {
          node {
            name
            attributeSummary
          }
        }
        quantity
        subtotal
        total
      }
    }
    shippingLines {
      nodes {
        methodTitle
        total
      }
    }
    formattedShippingAddress
    formattedBillingAddress
  }
}
```

## Authentication

For authenticated queries (customer orders, checkout), include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

To obtain a JWT token, use the login mutation:

```graphql
mutation Login($username: String!, $password: String!) {
  login(input: { username: $username, password: $password }) {
    authToken
    refreshToken
    user {
      id
      name
      email
    }
  }
}
```

## Session Handling

For cart operations, WooGraphQL uses session tokens. The session token is returned in the `woocommerce-session` response header and should be included in subsequent requests:

```
woocommerce-session: Session <session-token>
```

## Custom Fields Added

The theme adds these custom GraphQL fields:

### Product Fields
- `formattedPrice`: Price formatted in VND
- `stockMessage`: Human-readable stock message in Vietnamese

### VariableProduct Fields
- `variationCount`: Number of variations

### ProductVariation Fields
- `formattedPrice`: Variation price formatted in VND
- `attributeSummary`: Summary of attributes (e.g., "Size: M, Color: Red")

### Cart Fields
- `formattedTotal`: Cart total formatted in VND
- `formattedSubtotal`: Cart subtotal formatted in VND
- `itemCount`: Total number of items in cart

### CartItem Fields
- `formattedSubtotal`: Item subtotal formatted in VND

### Order Fields
- `formattedTotal`: Order total formatted in VND
- `statusLabel`: Order status in Vietnamese
- `formattedDate`: Date formatted for Vietnamese locale
- `formattedShippingAddress`: Formatted shipping address
- `formattedBillingAddress`: Formatted billing address

## Troubleshooting

### GraphQL Endpoint Not Working

1. Ensure WPGraphQL and WooGraphQL plugins are activated
2. Check WordPress permalinks are set (Settings > Permalinks > Save)
3. Verify the GraphQL endpoint at `/graphql`

### CORS Issues

The theme configures CORS headers for `http://localhost:3000`. Update `HEADLESS_MODE_CLIENT_URL` in wp-config.php for production.

### Session Issues

Ensure the `woocommerce-session` header is being passed correctly for cart operations.
