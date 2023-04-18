import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import lodash from "https://cdn.skypack.dev/lodash";

const html = await Deno.readTextFile("./data/noms.html");

const $ = cheerio.load(html);

const event_id = "92012127-50dd-404d-9425-4b9dfc716bf5";

const result = [];
for (const el of $("#root .view-grouping").toArray()) {
  const $el = $(el);
  const category = $el.find("h2").text().trim();

  const cat_noms = $el.find("h4").map((i, el) => {
    const $nom = $(el)
    const $nomRow = $nom.parent().parent()
    // console.log($nomRow)
    const primary_text = `${$nom.text().trim()}`
    const secondary_text = `${$nomRow.find('span').text().trim()}`;

    return { category, primary_text, secondary_text, event_id };
  }).get();

  for (const nom of cat_noms) {
    result.push(nom);
  }

}
// console.log(result);
const cats = [...new Set(result.map((r) => r.category))];
// console.log(noms)
// console.log(`
// insert into event_categories (name, event_id) values ${cats
//     .map((c) => `('${c}','${event_id}')`)
//     .join(", ")} on conflict (name, event_id) do nothing;
// `);

console.log(`
insert into event_category_noms (event_category_id, primary_text, secondary_text, event_id) values ${result
    .map((r) => {
      return `((select id from event_categories where name = '${r.category}' and event_id = '${r.event_id}'), '${r.primary_text.replace(/'/g, "\''")}', '${r.secondary_text.replace(/'/g, "\''")}', '${r.event_id}')`;
    })
    .join(",")} on conflict (event_category_id, primary_text) do nothing;
    `);

// console.log(`
// select * from event_categories where name in (${noms.map((n) => `'${n.category}'`).join(', ')}`);
