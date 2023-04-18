import { json, redirect, type LoaderArgs } from '@remix-run/node'
import { sb } from '~/infra'

export async function loader({ request }: LoaderArgs) {
  const response = new Response()
  const sbClient = sb(request, response);
  const {
    data: { user },
    error
  } = await sbClient.auth.getUser();

  if (error) {
    return redirect('/login', { headers: response.headers })
  }

  if (!user) {
    return redirect('/login', { headers: response.headers })
  } else {
    const { data: profile } = await sbClient.from('profiles').select('*').eq('id', user.id).limit(1).single()
    if (profile?.username) {
      return redirect('/welcome', { headers: response.headers })
    } else {
      return redirect('/pools', { headers: response.headers })
    }
  }
}

// export default function Component() {
//   const { data } = useLoaderData<typeof loader>()
//   return (
//     <div>
//       <h1>Home</h1>
//       <pre>{JSON.stringify(data)}</pre>
//     </div>
//   );
// }
