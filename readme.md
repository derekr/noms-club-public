# noms.club

My toxic trait is rebuilding a site for my family, friends and I to run an oscars pool. This last go-around I built it in 2 days some of which was live during the event 😅 and it's my favorite iteration so far.

I had a few goals:

- Make it fast
- Make it fun
- Make it functional

This meant using a lot of off the shelf tooling and mobile first design.

## about

This is a public version of this project to serve as a code sample for anyone interested. I haven't committed any secrets in the other repo, and it wouldn't really matter, but opted for a clean history and opportunity to augment with decision making notes.

Currently this project is in a use-as-is state. I need to do some more work to get supabase migrations in a place where you can spin up your own project to run this against.

## stack

- [vercel](https://vercel.com)
- [supabase](https://supabase.com) (postgres and auth)
- [remix](https://remix.run)
- [drizzle-orm](https://github.com/drizzle-team/drizzle-orm)
- [tailwind](http://tailwindcss.com)
- [daisyui](https://daisyui.com)
- [sentry](http://sentry.io)

## pacakges

### scripts

This is just a quarantine zone for generating some SQL statements so I could popullate the database with oscars nominations. The HTML was grabbed from the official [Oscars noms announcement page](https://www.oscars.org/oscars/ceremonies/2023). I typically will manually copy and paste in to a google sheet or database, but wanted to mess with Denos scripting a little bit, and make sure the data was as close to the source as possible.

When running the script it would print out SQL statements I could run in the supabase DB console.

### www

A package for the [remix](remix.run) project. I'm using [drizzle-orm](https://github.com/drizzle-team/drizzle-orm), [tailwind](https://tailwindcss.com) and [daisyUI](http://daisyui.com) with a dash of [class-variance-authority](https://cva.style/docs).

```
npm run dev
```

## hosting

The database is obviously hosted on [supabase](http://supabase.com) and the remix application is deloyed to [vercel](https://vercel.com).

## take aways

### keep it scrappy

I'm a little nervous sharing this code because it's not a representation of how I might approach a project in a real world setting/job with a longer deadline and more concrete expectations and roadmap. I don't want to clean it up for a few reasons, I have other things to do while looking for a job and I think it's OK to produce sloppy code that works when hacking on a personal project.

What it does showcase is that I can work scrappily when needed and can ruthlessly deprioritize scope while still shipping a useful tool that brings joy to people.

### using drizzle instead of supabase-js (or something else)

At first I was using the supabase-js client, but quickly found it to introduce too much latency in to the data layer. I felt like I was forced to make multiple queries to fulfill the main route's data reuirements which meant multiple http round trips. I swapped it out for drizzle-orm pretty quickly and it immediately noticed pages loading more quickly and I felt free to produce fewer, and more nuanced queries as well. It really does feel like you're just using SQL for the most part with the added benfit of JS tooling like Prettier and TypeScript.

I normally would pick Prisma, but I had been wanting to try out drizzle and tbh the overhead of managing a Prisma setup is feeling overhwelming lately; especially for small weekend projects/hacks.

In this particular case I didn't use drizzle-kit's migration tooling and opted to manage the schema directly in a production supabase project and run the drizzle instrospection to generate a new drizzle schema. That said I think using the drizzle schema first approach will feel right at home for me and orher Prisma users and maybe even less of a context switch since it's just TypeScript.

### vercel edge config

This is awesome. I don't think it's a deal maker/breaker, but a really nice tool to have right there for simple config. In the case of this project I used it to toggle when voting for nominations was closed.

It was a little confuing to wrap my head around at first, but quickly got the hang of it after some trial and error. In the simplest use case you're just editing JSON in a code editor field in the Vercel dashboard and then can read keys from that JSOn in your app.

### daisyui

It's dope! I liked being able to use tailwind when needed, but mostly relied on daisyui classes and some CVA for managing styling between states. TBH CVA isn't really needed, but I just like the API and typically reach for it by default in most projects using tailwind.

The only funny thing is the UI ended up feeling very much like Material UI. Not a bad thing, but I wasn't clocking that when going through their examples and docs. It''s not 1:1, but building noms.club out as a mobile first experience it felt really apparent after the fact.

### supabase auth

Really slick feature. It's nice having auth and everything else rolled in to one platform that does a good job of holistically gluing it all together around a solid product like Postgres.

That said the auth story for remix feels a little clunky. I think it's a necessary stop gap, but I was looking at clerk the other day and their remix integration feels ideal. This is mostly because I wanted to have server side auth which supabase wasn't initially designed with in mind, but has been added in a good enough fashion for now.

I didn't want to store passwords and used the magic email link flow which was difficult to set up reliabily at first. The docs and UI around the domain settings for this feature weren't clear enough for me and I had to do a bit of tail and error testing this flow trying to figure it out.

### data modeling

I had the thought of being able to use this project as a jumping off point for a general tool for managing voting pools. With this in mind I named and modeled things separate from the specific use case of an Oscars pool event.

Another pro of using supabase is I was able to do all the modeling with their table editor. This mostly came in handy when my son was sleeping on my arm and I couldn't use it to type effectively, but I could use my free hand to build out the entire schema using the GUI!
