-- Create a policy that allows users to view and update their own profiles
CREATE POLICY "Allow individual users to manage their own profiles"
ON public.users
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
