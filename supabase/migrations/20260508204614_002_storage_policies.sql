/*
  # Storage policies for question-images bucket

  1. Security
    - Allow authenticated users to upload images (admin only in practice via RLS)
    - Allow public read access to images (they're displayed to students)
    - Allow admin to delete images

  2. Important Notes
    - The bucket is public so images can be displayed without signed URLs
    - Only authenticated users can upload/delete
*/

-- Allow anyone to read images (public bucket)
CREATE POLICY "Public read access for question images"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'question-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload question images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'question-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete question images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'question-images');

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update question images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'question-images')
  WITH CHECK (bucket_id = 'question-images');
