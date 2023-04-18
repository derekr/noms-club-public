import { ActionArgs, json } from "@remix-run/node"
import { redirect } from "react-router";
import { db, schema, sb } from "~/infra"

export async function action({ request }: ActionArgs) {
  const response = new Response();
  const sbClient = sb(request, response);
  const {
    data: { session },
  } = await sbClient.auth.getSession();

  if (!session) {
    return redirect("/login", { headers: response.headers })
  }

  const body = await request.formData()

  const name = String(body.get("name"))
  const eventId = String(body.get('eventId'))

  if (!name) {
    return json({ error: 'Missing name' }, { status: 400 })
  }

  await db.insert(schema.pools).values({ name, authorId: session.user.id, eventId: eventId })
}

export default function () {
  return (
    <div className="flex flex-col align-middle items-center justify-center h-[100dvh]">
      <form method="post" className="p-4 flex flex-col gap-2">
        <div>
          <label htmlFor="field_name" className="label">Pool Name</label>
          <input id="field_name" type="text" name="name" className="text-black placeholder:text-slate-300" placeholder="Every Pool All At Once" />
        </div>
        <input type="submit" value="Create" className="btn" />
      </form>
    </div>
  )
}