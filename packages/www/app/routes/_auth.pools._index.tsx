import { json, redirect, type LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { sb } from "~/infra";
import { db, schema, e } from "~/infra";

export async function loader({ request }: LoaderArgs) {
  const response = new Response();
  const sbClient = sb(request, response);
  const {
    data: { session },
  } = await sbClient.auth.getSession();

  if (!session) {
    return redirect("/login", { headers: response.headers });
  }

  const data = await db
    .select({ ...schema.pools })
    .from(schema.pools)
    .leftJoin(
      schema.poolParticipants,
      e.eq(schema.poolParticipants.poolId, schema.pools.id)
    )
    .where(e.eq(schema.poolParticipants.userId, session.user.id));

  let participants = null;
  if (data.length > 0) {
    participants = await db
      .select()
      .from(schema.poolParticipants)
      .leftJoin(
        schema.profiles,
        e.eq(schema.profiles.id, schema.poolParticipants.userId)
      )
      .where(
        e.inArray(
          schema.poolParticipants.poolId,
          data.map((d) => d.id)
        )
      )
      .then((result) => {
        return result.reduce((acc, cur) => {
          if (cur.pool_participants.poolId in acc) {
            acc[cur.pool_participants.poolId].push(cur.profiles);
          } else {
            acc[cur.pool_participants.poolId] = [cur.profiles];
          }
          return acc;
        }, {});
      });
  }

  return json({ data, participants }, { headers: response.headers });
}

export default function Component() {
  const { data, participants } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="flex flex-row items-center align-middle p-4">
        <h1 className="text-2xl">Pools</h1>
        {/* <Link to="/pools/new" prefetch="render" className="btn ml-auto">Create New Pool</Link> */}
      </div>
      <div className="flex flex-col">
        {data.length <= 0 ? (
          <span className="p-4">Adding you to pool soon</span>
        ) : (
          data.map((pool) => (
            <Link
              key={pool.id}
              to={`/pools/${pool.eventId}/${pool.id}`}
              prefetch="render"
              className="cursor-pointer flex flex-row align-middle items-center p-4 hover:bg-primary-focus rounded-sm"
            >
              {pool.name}
              <span className="text-sm ml-2">
                {participants[pool.id].map((p) => p.username).join(", ")}
              </span>
              <span className="ml-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
