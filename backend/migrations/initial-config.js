export async function up(knex) {
  await knex("directus_settings").insert({
    default_language: "fr-FR",
    project_name: "StarbreakersNet API",
    project_color: "#bd0000",
  });
}
