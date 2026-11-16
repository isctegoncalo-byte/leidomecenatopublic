-- Remove legacy permissive policies that bypassed the private documents bucket.
-- The existing owner/admin policies remain in place.
drop policy if exists "CREATE POLICY \"Users can upload documents\" flreew_0" on storage.objects;
drop policy if exists "CREATE POLICY \"Users can upload documents\" flreew_1" on storage.objects;
drop policy if exists "CREATE POLICY \"Users can upload documents\" flreew_2" on storage.objects;
drop policy if exists "CREATE POLICY \"Users can upload documents\" flreew_3" on storage.objects;
