import { getSessionUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { signOut } from '@/app/auth/actions';

export async function AuthControls() {
  if (!isSupabaseConfigured) return null;

  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div className="auth-controls">
      <span>{user.email}</span>
      <form action={signOut}>
        <button className="text-button" type="submit">Sign out</button>
      </form>
    </div>
  );
}
