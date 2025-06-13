-- Create batch_processes table for tracking batch processing jobs
CREATE TABLE IF NOT EXISTS batch_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_files INTEGER NOT NULL,
  processed_files INTEGER DEFAULT 0,
  failed_files INTEGER DEFAULT 0,
  company_id VARCHAR(100),
  auto_detect_enabled BOOLEAN DEFAULT false,
  options JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create batch_process_files table for tracking individual files in a batch
CREATE TABLE IF NOT EXISTS batch_process_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_process_id UUID REFERENCES batch_processes(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  company_id VARCHAR(100),
  detection_result JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_batch_processes_user_id ON batch_processes(user_id);
CREATE INDEX idx_batch_processes_status ON batch_processes(status);
CREATE INDEX idx_batch_processes_created_at ON batch_processes(created_at DESC);

CREATE INDEX idx_batch_process_files_batch_process_id ON batch_process_files(batch_process_id);
CREATE INDEX idx_batch_process_files_work_order_id ON batch_process_files(work_order_id);
CREATE INDEX idx_batch_process_files_status ON batch_process_files(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_batch_processes_updated_at BEFORE UPDATE ON batch_processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_process_files_updated_at BEFORE UPDATE ON batch_process_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE batch_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_process_files ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own batch processes
CREATE POLICY "Users can view own batch processes" ON batch_processes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batch processes" ON batch_processes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch processes" ON batch_processes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batch processes" ON batch_processes
    FOR DELETE USING (auth.uid() = user_id);

-- Users can view and manage batch process files for their own batches
CREATE POLICY "Users can view own batch process files" ON batch_process_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM batch_processes 
            WHERE batch_processes.id = batch_process_files.batch_process_id 
            AND batch_processes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own batch process files" ON batch_process_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM batch_processes 
            WHERE batch_processes.id = batch_process_files.batch_process_id 
            AND batch_processes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own batch process files" ON batch_process_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM batch_processes 
            WHERE batch_processes.id = batch_process_files.batch_process_id 
            AND batch_processes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own batch process files" ON batch_process_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM batch_processes 
            WHERE batch_processes.id = batch_process_files.batch_process_id 
            AND batch_processes.user_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE batch_processes IS 'Stores batch processing jobs for multiple PDF files';
COMMENT ON TABLE batch_process_files IS 'Stores individual file processing results within a batch';

COMMENT ON COLUMN batch_processes.status IS 'Status of the batch: pending, processing, completed, cancelled, error';
COMMENT ON COLUMN batch_processes.options IS 'JSON object containing batch processing options like concurrentLimit, pauseOnError, etc.';
COMMENT ON COLUMN batch_process_files.detection_result IS 'JSON object containing company detection results';
COMMENT ON COLUMN batch_process_files.processing_time_ms IS 'Processing time in milliseconds';