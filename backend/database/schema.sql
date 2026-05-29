-- =========================================================
-- SOCIETIES
-- =========================================================

CREATE TABLE IF NOT EXISTS societies (
    id BIGSERIAL PRIMARY KEY,
    society_name VARCHAR(255) NOT NULL,
    property_type VARCHAR(20) DEFAULT 'flat' CHECK (property_type IN ('flat', 'villa', 'shop', 'mixed')),
    total_blocks INT DEFAULT 0,
    total_units INT DEFAULT 0,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    default_due_day SMALLINT DEFAULT 1,
    grace_days SMALLINT DEFAULT 5,
    late_fee_percent DECIMAL(5,2) DEFAULT 0.00,
    monthly_maintenance DECIMAL(12,2) DEFAULT 0.00,
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (society_name)
);

CREATE INDEX IF NOT EXISTS idx_society_city ON societies (city);
CREATE INDEX IF NOT EXISTS idx_society_active ON societies (is_active);

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'committee', 'resident', 'staff')),
    is_active SMALLINT DEFAULT 1,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (username),
    UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_user_society ON users (society_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON users (role);

-- =========================================================
-- BLOCKS
-- =========================================================

CREATE TABLE IF NOT EXISTS blocks (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    block_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (society_id, block_name)
);

-- =========================================================
-- UNITS / FLATS
-- =========================================================

CREATE TABLE IF NOT EXISTS units (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    block_id BIGINT REFERENCES blocks(id) ON DELETE SET NULL,
    unit_number VARCHAR(20) NOT NULL,
    floor_number VARCHAR(10),
    unit_type VARCHAR(20) DEFAULT 'flat' CHECK (unit_type IN ('flat', 'villa', 'shop', 'office')),
    area_sqft DECIMAL(10,2),
    occupancy_status VARCHAR(20) DEFAULT 'occupied' CHECK (occupancy_status IN ('occupied', 'vacant', 'maintenance')),
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (society_id, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_unit_block ON units (block_id);
CREATE INDEX IF NOT EXISTS idx_unit_status ON units (occupancy_status);

-- =========================================================
-- UNIT RESIDENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS unit_residents (
    id BIGSERIAL PRIMARY KEY,
    unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resident_type VARCHAR(20) NOT NULL CHECK (resident_type IN ('owner', 'tenant', 'family_member')),
    is_primary SMALLINT DEFAULT 0,
    move_in_date DATE,
    move_out_date DATE NULL,
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (unit_id, user_id)
);

-- =========================================================
-- MAINTENANCE INVOICES
-- =========================================================

CREATE TABLE IF NOT EXISTS maintenance_invoices (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    unit_id BIGINT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    billing_year INT NOT NULL,
    billing_month SMALLINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    late_fee DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + late_fee) STORED,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partial', 'Overdue', 'Cancelled')),
    notes TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (unit_id, billing_year, billing_month),
    UNIQUE (invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoice_status ON maintenance_invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON maintenance_invoices (due_date);

-- =========================================================
-- PAYMENT TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES maintenance_invoices(id) ON DELETE CASCADE,
    transaction_number VARCHAR(100),
    payment_gateway VARCHAR(50),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'card', 'cheque')),
    amount DECIMAL(12,2) NOT NULL,
    gateway_response TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Failed', 'Refunded')),
    paid_at TIMESTAMP NULL,
    receipt_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_invoice ON payment_transactions (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions (status);

-- =========================================================
-- EXPENSES
-- =========================================================

CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    vendor_name VARCHAR(255),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'card', 'cheque')),
    notes TEXT,
    attachment_url VARCHAR(500),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses (expense_date);

-- =========================================================
-- NOTICES
-- =========================================================

CREATE TABLE IF NOT EXISTS notices (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    notice_type VARCHAR(20) DEFAULT 'general' CHECK (notice_type IN ('general', 'maintenance', 'emergency', 'event')),
    publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NULL,
    attachment_url VARCHAR(500),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- COMPLAINTS
-- =========================================================

CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    society_id BIGINT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    unit_id BIGINT REFERENCES units(id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    resolution_notes TEXT,
    resolved_at TIMESTAMP NULL,
    raw_flat_number VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaint_status ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaint_priority ON complaints (priority);

-- =========================================================
-- TRIGGERS FOR UPDATED_AT
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_societies_updated_at ON societies;
CREATE TRIGGER update_societies_updated_at BEFORE UPDATE ON societies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_units_updated_at ON units;
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_invoices_updated_at ON maintenance_invoices;
CREATE TRIGGER update_maintenance_invoices_updated_at BEFORE UPDATE ON maintenance_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notices_updated_at ON notices;
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
