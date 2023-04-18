import { type ActionArgs, type LoaderArgs } from "@remix-run/node";
import { sb } from "~/infra";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";
import { Form, Link, useParams } from "@remix-run/react";
import { useRef } from "react";
import { cva } from "class-variance-authority";
import { db, schema, e } from "~/infra";
import { get } from "@vercel/edge-config";

const checkBtn = cva(["btn btn-circle"], {
  variants: {
    checked: {
      checked: ["bg-accent disabled:bg-accent disabled:text-neutral"],
      unchecked: ["bg-neutral disabled:bg-neutral"],
    },
  },
  defaultVariants: {
    checked: "unchecked",
  },
});

export async function action({ request }: ActionArgs) {
  const response = new Response();
  const sbClient = sb(request, response);
  const {
    data: { session },
  } = await sbClient.auth.getSession();

  if (!session) {
    throw new Error("Not logged in");
  }

  const pick = Object.fromEntries(await request.formData());
  const upsert = {
    userId: session.user.id as string,
    poolId: pick.pool_id as string,
    eventCategoryNomId: pick.nom_id as string,
    eventCategoryId: pick.category_id as string,
  };

  await db
    .insert(schema.poolPicks)
    .values(upsert)
    .onConflictDoUpdate({
      target: [
        schema.poolPicks.userId,
        schema.poolPicks.poolId,
        schema.poolPicks.eventCategoryId,
      ],
      set: { eventCategoryNomId: upsert.eventCategoryNomId },
    });

  // const { data, error } = await sbClient
  //   .from("pool_picks")
  //   .upsert(upsert, { onConflict: "user_id,pool_id,event_category_id" })
  //   .single();

  return typedjson({}, { headers: response.headers });
}

export async function loader({ request, params }: LoaderArgs) {
  const response = new Response();
  const sbClient = sb(request, response);
  const {
    data: { session },
    error: user_error,
  } = await sbClient.auth.getSession();

  if (!session) {
    return redirect("/login", { headers: response.headers });
  }

  const voting_enabled = await get("voting_enabled");

  const [poolResult, categoryResults, picksResult] = await Promise.all([
    db
      .select({
        id: schema.pools.id,
        name: schema.pools.name,
        event_id: schema.pools.eventId,
      })
      .from(schema.pools)
      .where(e.eq(schema.pools.id, params.pool_id as string))
      .limit(1)
      .then((r) => r[0]),
    db
      .select({
        event_category: {
          id: schema.eventCategories.id,
          name: schema.eventCategories.name,
        },
        event_category_nom: {
          id: schema.eventCategoryNoms.id,
          primary_text: schema.eventCategoryNoms.primaryText,
          secondary_text: schema.eventCategoryNoms.secondaryText,
        },
      })
      .from(schema.eventCategories)
      .leftJoin(
        schema.eventCategoryNoms,
        e.eq(
          schema.eventCategoryNoms.eventCategoryId,
          schema.eventCategories.id
        )
      )
      .where(e.eq(schema.eventCategories.eventId, params.event_id as string))
      .then((result) => {
        const mergedObj = {};

        for (const obj of result) {
          const categoryId = obj.event_category.id;
          if (categoryId in mergedObj) {
            mergedObj[categoryId].event_category_noms.push(
              obj.event_category_nom
            );
          } else {
            mergedObj[categoryId] = {
              id: categoryId,
              name: obj.event_category.name,
              event_category_noms: [obj.event_category_nom],
            };
          }
        }

        return Object.values(mergedObj);
      }),
    db
      .select({
        event_category_nom_id: schema.poolPicks.eventCategoryNomId,
      })
      .from(schema.poolPicks)
      .where(
        e.and(
          e.eq(schema.poolPicks.userId, session.user.id),
          e.eq(schema.poolPicks.poolId, params.pool_id as string)
        )
      ),
  ]);

  if (!poolResult || !categoryResults || !picksResult) {
    throw new Error("Could not load noms");
  }

  return typedjson(
    {
      pool: poolResult,
      category_noms: categoryResults,
      pool_picks: picksResult.map((p) => p.event_category_nom_id),
      stats: {
        picked: picksResult.length,
        total: categoryResults.length,
      },
      voting_enabled,
    },
    { headers: response.headers }
  );
}

function Nom({
  id,
  primary_text,
  secondary_text,
  form_id,
  is_picked,
  voting_enabled,
}: {
  id: string;
  primary_text: string;
  secondary_text?: string | null;
  form_id: string;
  is_picked: boolean;
  voting_enabled: boolean;
}) {
  const pickBtnRef = useRef<HTMLButtonElement>(null);

  function handleClick() {
    const isTextSelected = window?.getSelection().toString();
    if (isTextSelected) return;
    !voting_enabled
      ? window.alert("Wowwwwww… Enjoy the show…")
      : pickBtnRef.current?.click();
  }

  return (
    <div
      key={id}
      onClick={handleClick}
      className="cursor-pointer flex flex-row align-middle items-center p-4 hover:bg-primary-focus rounded-sm"
    >
      <div>
        <h3 className="text-primary text-lg">{primary_text}</h3>
        <p className="text-secondary">{secondary_text}</p>
      </div>
      <button
        type="submit"
        form={voting_enabled ? `${form_id}` : ""}
        name="nom_id"
        value={id}
        className={`${checkBtn({
          checked: is_picked ? "checked" : "unchecked",
        })} ml-auto`}
        ref={pickBtnRef}
        {...(voting_enabled ? {} : { disabled: true })}
      >
        <span className="sr-only">{is_picked ? "Picked" : "Pick"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </button>
    </div>
  );
}

export default function Component() {
  const { pool, category_noms, pool_picks, stats, voting_enabled } =
    useTypedLoaderData<typeof loader>();

  const { pool_id } = useParams();
  return (
    <div>
      <div className="flex flex-row align-middle items-center p-4">
        <h1 className="text-2xl">
          <Link
            to="/pools"
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
            {pool.name}
          </Link>
        </h1>
        <Link
          prefetch="render"
          to={`/scoreboard/${pool.event_id}/${pool.id}`}
          className="ml-auto flex flex-row align-middle items-center"
        >
          <span>Scoreboard</span>
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
        </Link>
      </div>
      <div className="bg-info text-info-content p-4 flex flex-row items-center gap-1 text-sm sticky top-0 z-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
            clipRule="evenodd"
          />
        </svg>

        <span>
          {!voting_enabled && "[voting closed]"} You've picked {stats.picked} of{" "}
          {stats.total} noms
        </span>
      </div>
      {/* TODO: PLAYERS */}
      <div className="flex flex-col">
        {category_noms.map((category) => {
          if (!Array.isArray(category.event_category_noms)) return null;
          const category_form_id = `category_pick_${category.id}`;
          return (
            <div key={category.id}>
              <h2 className="text-xl p-4 bg-neutral sticky top-[54px] z-0">
                {category.name}
              </h2>
              <div className="flex flex-col">
                {category.event_category_noms?.map((nom) => {
                  return (
                    <Nom
                      key={nom.id}
                      {...nom}
                      form_id={category_form_id}
                      is_picked={pool_picks.includes(nom.id)}
                      voting_enabled={voting_enabled}
                    />
                  );
                })}
              </div>
              <Form hidden id={category_form_id} method="post">
                <input type="hidden" name="category_id" value={category.id} />
                <input type="hidden" name="pool_id" value={pool_id} />
              </Form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
