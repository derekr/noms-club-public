import { db, schema, e } from "~/infra";
import { get } from "@vercel/edge-config";
import { sb } from "~/infra";
import { LoaderArgs } from "@remix-run/node";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { sql } from "drizzle-orm";
import { Link, useParams } from "@remix-run/react";

export async function loader({ request, params }: LoaderArgs) {
  const response = new Response();
  const sbClient = sb(request, response);
  const {
    data: { session },
  } = await sbClient.auth.getSession();

  if (!session) {
    throw new Error("Not logged in");
  }

  const pool_id = String(params.pool_id);

  const picks = await db
    .select({
      username: schema.profiles.username,
      picks: sql`COUNT(${schema.eventCategoryNoms.isWinner})::INTEGER`,
    })
    .from(schema.poolPicks)
    .leftJoin(
      schema.profiles,
      e.eq(schema.profiles.id, schema.poolPicks.userId)
    )
    .leftJoin(
      schema.eventCategoryNoms,
      e.eq(schema.eventCategoryNoms.id, schema.poolPicks.eventCategoryNomId)
    )
    .where(e.eq(schema.poolPicks.poolId, pool_id))
    .groupBy(schema.profiles.username)
    .orderBy(e.desc(sql`COUNT(${schema.eventCategoryNoms.isWinner})::INTEGER`));

  const event_category_noms_with_picks = await db
    .select({
      event_category: {
        id: schema.eventCategories.id,
        name: schema.eventCategories.name,
      },
      event_category_nom: {
        id: schema.eventCategoryNoms.id,
        primary_text: schema.eventCategoryNoms.primaryText,
        secondary_text: schema.eventCategoryNoms.secondaryText,
        is_winner: schema.eventCategoryNoms.isWinner,
      },
      profile: {
        username: schema.profiles.username,
      },
    })
    .from(schema.eventCategories)
    .leftJoin(
      schema.eventCategoryNoms,
      e.eq(schema.eventCategoryNoms.eventCategoryId, schema.eventCategories.id)
    )
    .leftJoin(
      schema.poolPicks,
      e.eq(schema.poolPicks.eventCategoryNomId, schema.eventCategoryNoms.id)
    )
    .leftJoin(
      schema.profiles,
      e.eq(schema.profiles.id, schema.poolPicks.userId)
    )
    .where(
      e.and(
        e.eq(schema.eventCategories.eventId, params.event_id as string),
        e.eq(schema.eventCategoryNoms.isWinner, true),
        e.eq(schema.poolPicks.poolId, pool_id)
      )
    )
    .then((result) => {
      const mergedObj = {};

      for (const obj of result) {
        const categoryId = obj.event_category.id;
        if (categoryId in mergedObj) {
          mergedObj[categoryId].event_category_nom = obj.event_category_nom;
          mergedObj[categoryId].picks.push(obj.profile.username);
        } else {
          mergedObj[categoryId] = {
            id: categoryId,
            name: obj.event_category.name,
            event_category_nom: obj.event_category_nom,
            picks: [obj.profile.username]
          };
        }
      }

      return Object.values(mergedObj);
    });

  return typedjson({ picks, category_noms: event_category_noms_with_picks }, { headers: response.headers });
}

function Nom({
  id,
  primary_text,
  secondary_text,
  picks
}: {
  id: string;
  primary_text: string;
  secondary_text?: string | null;
  picks: string[];
}) {
  return (
    <div
      key={id}
      className="flex flex-row align-middle items-center p-4 rounded-sm"
    >
      <div>
        <h3 className="text-primary text-lg">{primary_text}</h3>
        <p className="text-secondary">{secondary_text}</p>
      </div>
      <div className="ml-auto text-right">{picks.join(', ')}</div>
    </div>
  );
}

export default function Component() {
  const { picks, category_noms } = useTypedLoaderData<typeof loader>();
  const { pool_id, event_id } = useParams();

  return (
    <div>
      <h1 className="text-2xl p-4">
        <Link
          to={`/pools/${event_id}/${pool_id}`}
          prefetch="render"
          className="flex flex-row gap-2 items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-primary"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z"
              clipRule="evenodd"
            />
          </svg>
          Scoreboard
        </Link>
      </h1>
      <div className="p-4">
        {picks.map((pick, i) => {
          return (
            <div key={pick.username}>
              {i === 0 ? '🏆' : null} {pick.username} – {pick.picks}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col">
        {category_noms.map((category) => {
          return (
            <div key={category.id}>
              <h2 className="text-xl p-4 bg-neutral sticky top-0 z-0">
                {category.name}
              </h2>
              <div className="flex flex-col">
                <Nom
                  key={category.event_category_nom.id}
                  {...category.event_category_nom}
                  picks={category.picks}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
