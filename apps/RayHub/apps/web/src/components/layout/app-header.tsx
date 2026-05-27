import { createClient } from '@/utils/supabase/server';
import { logout } from '@/app/login/actions';
import { Button } from '@/components/ui/button';

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        {/* Futuramente: Breadcrumbs ou Page Title */}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 font-medium">
          {user?.email}
        </span>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
