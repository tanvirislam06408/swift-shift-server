# Swift Shift Server

A backend API server for the SwiftMart e-commerce platform built with Express, TypeScript, and MongoDB.

## Project Overview

Swift Shift Server is a RESTful API that provides the backend functionality for an e-commerce platform. It handles:

- **Product Management**: CRUD operations for products with search, filtering, and pagination
- **Shopping Cart**: Add/remove items, view cart contents
- **Order Processing**: Create orders, track order history
- **User Management**: User authentication, admin controls, user blocking
- **Admin Dashboard**: Analytics and management endpoints

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5
- **Database**: MongoDB (with Mongoose-like native driver)
- **Authentication**: JWT (using jose library) with JWKS endpoint
- **Deployment**: Vercel (serverless functions)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)
- A client application running on the frontend (default: http://localhost:3000)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB connection string
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=YourApp

# Database name
DB_NAME=swiftmart

# Client application URL (for JWT JWKS verification)
NEXT_CLIENT_SITE=http://localhost:3000

# Server port (optional, defaults to 5000)
PORT=5000
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd swift-shift-server

# Install dependencies
npm install

# Set up environment variables (see above)
cp .env.example .env  # or create .env manually
```

## Running Locally

### Development Mode (with hot reload)

```bash
npm run dev
```

This starts the server with tsx watch, which automatically restarts when you make changes.

### Production Mode

```bash
# Build the TypeScript files
npm run build

# Start the server
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env`).

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/products` | Get products with pagination, search, and filtering |
| GET | `/products/:id` | Get single product by ID |
| GET | `/product/:category` | Get products by category |
| GET | `/products-featured` | Get featured products (first 4) |

### Protected Endpoints (require JWT token)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/add-to-cart` | Add product to cart | User |
| GET | `/api/cartData/:userId` | Get user's cart | User |
| DELETE | `/cart/delete` | Remove item from cart | User |
| GET | `/get-user-data/:userId` | Get user dashboard data | User |

### Admin Only Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/add-products` | Add new product |
| DELETE | `/delete-products/:id` | Delete product |
| GET | `/get-users` | Get all users |
| GET | `/get-admin-infos` | Get admin dashboard analytics |
| DELETE | `/packages/:id` | Delete user |
| PATCH | `/update-status/:status/:id` | Block/unblock user |
| POST | `/packages` | Add product (alternative endpoint) |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order and clear cart |

## Authentication

The server uses JWT authentication with JWKS (JSON Web Key Set) verification:

1. Obtain a JWT token from your client application (Next.js auth)
2. Include the token in the `Authorization` header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

The server verifies tokens against the JWKS endpoint at `{NEXT_CLIENT_SITE}/api/auth/jwks`.

## Database Structure

The MongoDB database `swiftmart` contains the following collections:

- **products**: Product catalog
- **cart**: Shopping cart items
- **orders**: Order history
- **user**: User accounts

## Deployment to Vercel

This project is configured for Vercel deployment:

1. Push to GitHub
2. Import project in Vercel dashboard
3. Set environment variables in Vercel project settings
4. Deploy

The `vercel.json` file is already configured for serverless deployment.

## Development Notes

- The server runs on port 5000 by default
- CORS is enabled for all origins (configure as needed for production)
- MongoDB connection is lazy (connects when first request is made)
- Admin routes require both valid JWT and `role: 'admin'` in the token payload

## License

ISC
