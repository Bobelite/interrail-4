const { data, error } = await supabase
  .from('profiles')
  .select('id, full_name, role')
  .eq('id', user.id)
  .maybeSingle();

if (error) {
  console.error('Profile fetch error:', error);
  setError(error.message);
  setLoading(false);
  return;
}

if (!data) {
  console.log('No profile found for user:', user.id);
  setError('Profile not found.');
  setLoading(false);
  return;
}
