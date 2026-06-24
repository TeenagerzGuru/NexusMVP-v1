-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATIONS', 'DRIVER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONVERTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('QUOTED', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'INVOICED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('T7_5', 'T18', 'T26', 'ARTIC');

-- CreateEnum
CREATE TYPE "AddonType" AS ENUM ('TAIL_LIFT', 'HIAB', 'ADR', 'TWO_PERSON');

-- CreateEnum
CREATE TYPE "LaneMatchLevel" AS ENUM ('DISTRICT', 'AREA');

-- CreateEnum
CREATE TYPE "SurchargeValueType" AS ENUM ('FLAT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "CarrierRateType" AS ENUM ('PER_MILE', 'PER_JOB');

-- CreateEnum
CREATE TYPE "FleetResourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING_ASSIGNMENT', 'ASSIGNED', 'EN_ROUTE_COLLECTION', 'ARRIVED_COLLECTION', 'LOADED', 'EN_ROUTE_DELIVERY', 'ARRIVED_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('BRAND', 'USER', 'CUSTOMER', 'PRICING_LANE', 'PRICING_VEHICLE_MULTIPLIER', 'PRICING_SURCHARGE', 'PRICING_BRAND_CONFIG', 'QUOTE', 'BOOKING', 'VEHICLE', 'CARRIER', 'JOB', 'POD', 'INVOICE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "logo_url" TEXT,
    "colours" JSONB NOT NULL DEFAULT '{}',
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "vat_number" TEXT NOT NULL,
    "terms_and_conditions" TEXT NOT NULL,
    "invoice_number_prefix" TEXT NOT NULL,
    "invoice_sequence_year" INTEGER NOT NULL,
    "invoice_sequence_next" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL,
    "brand_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "user_id" TEXT,
    "company_name" TEXT NOT NULL,
    "billing_name" TEXT,
    "billing_address_line1" TEXT,
    "billing_address_line2" TEXT,
    "billing_city" TEXT,
    "billing_county" TEXT,
    "billing_postcode" TEXT,
    "billing_country" TEXT NOT NULL DEFAULT 'GB',
    "payment_terms" TEXT NOT NULL DEFAULT 'Net 0',
    "credit_limit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_lanes" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "match_level" "LaneMatchLevel" NOT NULL,
    "origin_code" TEXT NOT NULL,
    "destination_code" TEXT NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_lanes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_vehicle_multipliers" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "multiplier" DECIMAL(6,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_vehicle_multipliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_surcharges" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "addon_type" "AddonType" NOT NULL,
    "value_type" "SurchargeValueType" NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_surcharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_pricing_configs" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "margin_multiplier" DECIMAL(6,4) NOT NULL DEFAULT 1,
    "minimum_job_value" DECIMAL(10,2) NOT NULL DEFAULT 150,
    "round_to_nearest" DECIMAL(10,2) NOT NULL DEFAULT 5,
    "vat_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    "urgent_within_24h_multiplier" DECIMAL(6,4) NOT NULL DEFAULT 1.25,
    "out_of_hours_multiplier" DECIMAL(6,4) NOT NULL DEFAULT 1.20,
    "weekend_multiplier" DECIMAL(6,4) NOT NULL DEFAULT 1.35,
    "per_mile_rates" JSONB NOT NULL DEFAULT '{}',
    "quote_expiry_minutes" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_pricing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "inputs" JSONB NOT NULL,
    "calculation_breakdown" JSONB NOT NULL,
    "price_ex_vat" DECIMAL(10,2) NOT NULL,
    "price_inc_vat" DECIMAL(10,2) NOT NULL,
    "vat_amount" DECIMAL(10,2) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "reference" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
    "customer_reference" TEXT,
    "special_instructions" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "contact_company" TEXT,
    "value_ex_vat" DECIMAL(10,2) NOT NULL,
    "value_inc_vat" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "has_tail_lift" BOOLEAN NOT NULL DEFAULT false,
    "has_hiab" BOOLEAN NOT NULL DEFAULT false,
    "has_adr" BOOLEAN NOT NULL DEFAULT false,
    "two_person" BOOLEAN NOT NULL DEFAULT false,
    "default_driver_id" TEXT,
    "status" "FleetResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "rate_type" "CarrierRateType",
    "rate_value" DECIMAL(10,4),
    "status" "FleetResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    "vehicle_id" TEXT,
    "carrier_id" TEXT,
    "driver_id" TEXT,
    "carrier_cost" DECIMAL(10,2),
    "internal_notes" TEXT,
    "assigned_at" TIMESTAMP(3),
    "en_route_collection_at" TIMESTAMP(3),
    "arrived_collection_at" TIMESTAMP(3),
    "loaded_at" TIMESTAMP(3),
    "en_route_delivery_at" TIMESTAMP(3),
    "arrived_delivery_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pods" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "signature_data" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "notes" TEXT,
    "captured_by_id" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "vat_amount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "pdf_url" TEXT,
    "issued_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "entity_type" "AuditEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brands_domain_key" ON "brands"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_brand_id_idx" ON "users"("brand_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_key" ON "customers"("user_id");

-- CreateIndex
CREATE INDEX "customers_brand_id_idx" ON "customers"("brand_id");

-- CreateIndex
CREATE INDEX "customers_company_name_idx" ON "customers"("company_name");

-- CreateIndex
CREATE INDEX "pricing_lanes_brand_id_is_active_idx" ON "pricing_lanes"("brand_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_lanes_brand_id_match_level_origin_code_destination__key" ON "pricing_lanes"("brand_id", "match_level", "origin_code", "destination_code", "vehicle_type");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_vehicle_multipliers_brand_id_vehicle_type_key" ON "pricing_vehicle_multipliers"("brand_id", "vehicle_type");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_surcharges_brand_id_addon_type_key" ON "pricing_surcharges"("brand_id", "addon_type");

-- CreateIndex
CREATE UNIQUE INDEX "brand_pricing_configs_brand_id_key" ON "brand_pricing_configs"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_reference_key" ON "quotes"("reference");

-- CreateIndex
CREATE INDEX "quotes_brand_id_status_idx" ON "quotes"("brand_id", "status");

-- CreateIndex
CREATE INDEX "quotes_expires_at_idx" ON "quotes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_quote_id_key" ON "bookings"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_key" ON "bookings"("reference");

-- CreateIndex
CREATE INDEX "bookings_brand_id_status_idx" ON "bookings"("brand_id", "status");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");

-- CreateIndex
CREATE INDEX "vehicles_brand_id_status_idx" ON "vehicles"("brand_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_brand_id_registration_key" ON "vehicles"("brand_id", "registration");

-- CreateIndex
CREATE INDEX "carriers_brand_id_status_idx" ON "carriers"("brand_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_booking_id_key" ON "jobs"("booking_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_driver_id_idx" ON "jobs"("driver_id");

-- CreateIndex
CREATE INDEX "jobs_vehicle_id_idx" ON "jobs"("vehicle_id");

-- CreateIndex
CREATE INDEX "jobs_carrier_id_idx" ON "jobs"("carrier_id");

-- CreateIndex
CREATE UNIQUE INDEX "pods_booking_id_key" ON "pods"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_booking_id_key" ON "invoices"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_brand_id_status_idx" ON "invoices"("brand_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_lanes" ADD CONSTRAINT "pricing_lanes_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_vehicle_multipliers" ADD CONSTRAINT "pricing_vehicle_multipliers_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_surcharges" ADD CONSTRAINT "pricing_surcharges_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_pricing_configs" ADD CONSTRAINT "brand_pricing_configs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_default_driver_id_fkey" FOREIGN KEY ("default_driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carriers" ADD CONSTRAINT "carriers_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pods" ADD CONSTRAINT "pods_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pods" ADD CONSTRAINT "pods_captured_by_id_fkey" FOREIGN KEY ("captured_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
