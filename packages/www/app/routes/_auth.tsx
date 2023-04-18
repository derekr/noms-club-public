import { sb, type Database } from "~/infra";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import { useEffect, useState } from "react";
import { Outlet, useFetcher, useLoaderData } from "@remix-run/react";
import { json, type LoaderArgs } from "@remix-run/node";

export const action = () => null;

export async function loader({ request }: LoaderArgs) {
  const response = new Response();

  const {
    data: { session },
  } = await sb(request, response).auth.getSession();

  return json(
    {
      env: {
        supabase_url: process.env.SUPABASE_URL,
        supabase_anon_key: process.env.SUPABASE_ANON_KEY,
      },
      session,
    },
    { headers: response.headers }
  );
}

export default function Component() {
  const { env, session } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [supabase] = useState(() =>
    createBrowserClient<Database>(env.supabase_url!, env.supabase_anon_key!)
  );
  const serverAccessToken = session?.access_token;

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // server and client are out of sync.
        // Remix recalls active loaders after actions complete
        fetcher.submit(null, {
          method: "post",
          action: "/handle-supabase-auth",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [serverAccessToken, supabase, fetcher]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-[100svh]">
      <Outlet context={{ supabase, session }} />
      <footer className="p-4 mt-auto">
        {session && <button onClick={handleLogout}>Logout</button>}
      </footer>
    </div>
  );
}
