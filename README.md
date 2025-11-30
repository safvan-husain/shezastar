# ShezaStar E-Commerce - Product Management System

A comprehensive product management system for vehicle electronic gadgets with dynamic variant types, multiple images, and intelligent image-to-variant mapping.

## Features

- **Dynamic Variant Types**: Create custom variant categories (Color, Size, Storage, etc.) with unlimited items
- **Multiple Images**: Upload and manage multiple product images with drag-and-drop reordering
- **Image-to-Variant Mapping**: Map images to specific variant items or combinations using drag-and-drop
- **Flexible Pricing**: Base price, offer price, and optional per-variant price modifiers
- **Full CRUD Operations**: Complete admin panel for managing products and variant types

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: MongoDB
- **Validation**: Zod
- **UI**: React with Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Image Processing**: Sharp

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or connection string to MongoDB instance

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your MongoDB connection:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=shezastar
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### 1. Create Variant Types

Before creating products, set up your variant types:

1. Navigate to **Variant Types** from the admin panel
2. Click **Create Variant Type**
3. Enter a name (e.g., "Color", "Storage", "Size")
4. Add items to the variant type (e.g., "Red", "Blue", "Black")
5. Save the variant type

### 2. Create Products

1. Navigate to **Products** from the admin panel
2. Click **Create Product**
3. Follow the multi-step form:
   - **Step 1**: Enter product name, description, base price, and optional offer price
   - **Step 2**: Upload product images (drag & drop or click to select)
   - **Step 3**: Select variant types and choose items for each
   - **Step 4**: Map images to variant items (drag variant tags onto images)
   - **Step 5**: Review and submit

### 3. Image-to-Variant Mapping

Two ways to map images to variants:

- **Drag & Drop**: Drag a variant tag and drop it on an image
- **Multi-Select**: Check multiple variant items and click "Map Selected" on an image

**Mapping Logic**:
- Images with no mappings show for all variant combinations
- Images mapped to single items show when that item is selected
- Images mapped to multiple items show only when ALL those items are selected together

## Project Structure

```
app/
  (admin)/              # Admin panel pages
    products/           # Product management
    variant-types/      # Variant type management
  api/                  # API routes
    products/           # Product endpoints
    variant-types/      # Variant type endpoints

lib/
  db/                   # Database connection
  errors/               # Error handling
  product/              # Product feature
    product.schema.ts   # Zod schemas
    product.service.ts  # Business logic (legacy)
    model/              # Domain models (legacy)
  variant-type/         # Variant type feature
  utils/                # Utilities (file upload, etc.)

components/
  ui/                   # Reusable UI components
```

## API Endpoints

### Variant Types

- `GET /api/variant-types` - List all variant types
- `POST /api/variant-types` - Create variant type
- `GET /api/variant-types/[id]` - Get variant type
- `PUT /api/variant-types/[id]` - Update variant type
- `DELETE /api/variant-types/[id]` - Delete variant type

### Products

Product management now uses Server Actions plus Prisma-backed services/queries. UI components call `lib/actions/product.actions.ts` for mutations and `lib/queries/product.queries.ts` for reads.

## Architecture

This project follows a clean, layered architecture aligned with Server Actions:

- **Server Components**: Call queries for data reads
- **Server Actions (`lib/actions`)**: Validate input, call services, and revalidate caches
- **Queries (`lib/queries`)**: Centralize reads with Prisma and caching
- **Services (`lib/services`)**: Contain business logic and Prisma access

See `AGENTS.md` for detailed architecture guidelines.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Notes

- No authentication is implemented (as requested for development)
- Images are stored in `public/uploads/`
- All images are automatically optimized using Sharp
- The system supports unlimited variant types and items
- Image filtering is handled automatically based on variant selection

## Future Enhancements

- User authentication and authorization
- Product categories and tags
- Inventory management
- Order processing
- Customer-facing storefront
- Search and filtering
- Product reviews and ratings
