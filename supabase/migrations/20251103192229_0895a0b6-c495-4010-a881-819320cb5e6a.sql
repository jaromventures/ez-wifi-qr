-- Create orders table for POD tracking
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  printify_order_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  product_name TEXT NOT NULL,
  product_variant_id TEXT NOT NULL,
  printify_image_id TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  total_price NUMERIC(10,2) NOT NULL,
  printify_cost NUMERIC(10,2),
  profit NUMERIC(10,2),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_stripe_session ON public.orders(stripe_session_id);
CREATE INDEX idx_orders_email ON public.orders(customer_email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admin can manage all orders
CREATE POLICY "Admin full access to orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role can insert orders (for webhook)
CREATE POLICY "Service role can insert orders"
  ON public.orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);