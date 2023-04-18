import {
  type ActionArgs,
  json,
  redirect,
  type LoaderArgs,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { sb } from "~/infra";

export async function action({ request }: ActionArgs) {
  const body = await request.formData();
  const username = String(body.get('username'))

  if (!username) {
    return json({ error: 'username is required' }, { status: 400 })
  }

  const response = new Response();
  const sbClient = sb(request, response);
  const {
    data: { user },
  } = await sbClient.auth.getUser();

  if (!user) {
    return redirect("/login", { headers: response.headers });
  }

  const { data: profile } = await sbClient.from('profiles').select('*').eq('id', user.id).limit(1).single()

  if (!profile?.username) {
    const { data, error } = await sbClient.from('profiles').update({ username }).eq('id', user.id)

    if (error) {
      return json({ error }, { status: 500 })
    }

    return redirect("/pools", { headers: response.headers });
  }
}

export async function loader({ request }: LoaderArgs) {
  const response = new Response();
  const sbClient = sb(request, response)
  const {
    data: { session },
  } = await sbClient.auth.getSession();

  if (!session) {
    return json({ user: null }, { headers: response.headers });
  }

  if (session.user) {
    const { data: profile } = await sbClient.from('profiles').select('*').eq('id', session.user.id).limit(1).single()
    if (profile?.username) {
      return redirect("/pools", { headers: response.headers });
    }
  }

  // console.log('rendering', user)
  return json(
    {
      user: session?.user,
    },
    { headers: response.headers }
  );
}

export default function Component() {
  const { user } = useLoaderData<typeof loader>();

  // Client side auth w/ supabase doesn't have user on page load
  // after first render the auth state is updated and calls handle-supabase-auth to 
  // trigger remix to reload then the loader has a session/user to key off of.
  // So if no user just assume we're "loading…"
  if (!user) return null

  return (
    <div>
      <h1>Welcome!</h1>
      <form method="post">
        <label htmlFor="field_username">What should we call you?:</label>
        <input id="field_username" type="text" name="username" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

