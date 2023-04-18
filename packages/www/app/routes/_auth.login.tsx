import { useOutletContext } from "@remix-run/react";
import { useState } from "react";
import { SupabaseClient, Database } from "~/infra";
import { getDomainUrl } from "~/domain-url";
import { type LoaderArgs } from "@remix-run/node";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";
import { sb } from "~/infra";

export async function loader({ request }: LoaderArgs) {
  const response = new Response();
  const sbClient = sb(request, response);
  const {
    data: { user },
  } = await sbClient.auth.getUser();

  if (user) {
    return redirect("/pools", { headers: response.headers });
  }

  return typedjson(
    { url: getDomainUrl(request) },
    { headers: response.headers }
  );
}

export default function Login() {
  const { url } = useTypedLoaderData<typeof loader>();
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();
  const [email, setEmail] = useState("");

  async function signInWithEmail() {
    const options = {
      emailRedirectTo: `${url}/welcome`,
    };

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options,
    });

    if (error) console.error(error);
  }

  return (
    <div className="h-[100svh] w-[100vw] flex items-center align-middle justify-center">
      <div className="card w-96 bg-base-100 shadow-xl p-4 bg-white text-primary-content flex flex-col gap-2">
        <div className="form-control">
          <label htmlFor="field_email" className="label">
            <span className="label-text text-violet-600">Email address</span>
          </label>
          <input
            type="email"
            id="field_email"
            placeholder="nom@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full text-white placeholder:text-violet-600"
          />
        </div>
        <button onClick={signInWithEmail} className="btn">
          {" "}
          Send Login Link{" "}
        </button>
      </div>
    </div>
  );
}
