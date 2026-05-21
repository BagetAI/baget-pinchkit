-- ==========================================
-- PINCHKIT DATABASE SCHEMA (POSTGRESQL)
-- Optimized for peak performance and scale
-- Created: May 21, 2026
-- ==========================================

BEGIN;

-- 1. WAITLIST TABLE (Lead Capture & GTM Operations)
-- Designed for rapid key-value lookups and fast inserts during marketing surges.
CREATE TABLE IF NOT EXISTS waitlist (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL DEFAULT 'PinchKit Lead',
    preferred_recipe VARCHAR(100), -- Track recipe interests from lead forms (e.g., Thai Green Curry, Szechuan Mapo Tofu, Moroccan Tagine)
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index the email field for high-speed lookup and validation
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Index created_at for sorting GTM dashboards and batch exports
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);


-- 2. SUPPLIERS TABLE (Operations & Sourcing)
-- Vetted supply chain entities for premium bulk ingredients and co-packing.
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact JSONB NOT NULL, -- Stores nested contact details: {"email": "contact@supplier.com", "phone": "123-456-7890", "address": "123 Main St"}
    product_category VARCHAR(100) NOT NULL, -- e.g., 'Sachet Co-Packer', 'Bulk Spice Importer', 'Packaging Materials'
    moq INTEGER NOT NULL DEFAULT 0, -- Minimum Order Quantity in units or lbs
    lead_time VARCHAR(100) NOT NULL, -- e.g., '14 Days', '48 Hours', '6 Weeks'
    status VARCHAR(50) NOT NULL DEFAULT 'vetted' CHECK (status IN ('vetted', 'negotiating', 'active_contract', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index product_category to speed up procurement routing queries
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(product_category);

-- Index supplier status to filter operational pipelines efficiently
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);


-- 3. INITIAL SEED DATA FOR VETTED SUPPLIERS
INSERT INTO suppliers (name, contact, product_category, moq, lead_time, status) VALUES
('IBR Packaging', '{"email": "sales@ibrpackaging.com", "phone": "469-555-0192", "location": "Carrollton, TX"}', 'Sachet Co-Packer', 10000, '4 Weeks', 'vetted'),
('Ingredients Corporation of America (ICA)', '{"email": "info@icispices.com", "phone": "901-555-0184", "location": "Memphis, TN"}', 'Bulk Blending Partner', 5000, '3 Weeks', 'vetted'),
('Advanced Spice & Trading', '{"email": "orders@advancedspice.com", "phone": "214-555-0133", "location": "Dallas, TX"}', 'Bulk Spice Importer', 1, '48 Hours', 'active_contract'),
('Pacific Spice Company', '{"email": "import@pacificspice.com", "phone": "323-555-0177", "location": "Commerce, CA"}', 'Bulk Spice Importer', 1000, '2 Weeks', 'vetted')
ON CONFLICT (name) DO NOTHING;

COMMIT;
