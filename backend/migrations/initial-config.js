// TODO: Trouver comment avoir le type "knex"
function log(message) {
  const prepend = "[initial-config] ";
  console.log(prepend + message);
}

export async function up(knex) {
  const config = {
    settings: {
      language: "fr-FR",
      name: "StarbreakersNet API",
      color: "#bd0000",
      public_registration: true,
      public_registration_verify_email: true,
    },
    policy: {
      name: "Registered",
      icon: "badge",
      description:
        "Contrôle quelles sont les données API disponibles pour les utilisateurs enregistrés.",
    },
    role: {
      name: "User",
      icon: "supervised_user_circle",
      description: "Utilisateurs de StarbreakersNet",
    },
  };

  let userPolicy = await knex("directus_policies").where("name", config.policy.name).first();

  if (userPolicy) {
    await knex("directus_policies").where("id", userPolicy.id).update({
      icon: config.policy.icon,
      description: config.policy.description,
    });
    log("Policy " + config.policy.name + " updated with id " + userPolicy.id);
  } else {
    [userPolicy] = await knex("directus_policies")
      .insert({
        id: knex.fn.uuid(),
        name: config.policy.name,
        icon: config.policy.icon,
        description: config.policy.description,
      })
      .returning("*");
    log("Policy " + config.policy.name + " created with id " + userPolicy.id);
  }

  let userRole = await knex("directus_roles").where("name", config.role.name).first();

  if (userRole) {
    await knex("directus_roles").where("id", userRole.id).update({
      icon: config.role.icon,
      description: config.role.description,
    });
    log("Role " + config.role.name + " updated with id " + userRole.id);
  } else {
    [userRole] = await knex("directus_roles")
      .insert({
        id: knex.fn.uuid(),
        name: config.role.name,
        icon: config.role.icon,
        description: config.role.description,
      })
      .returning("*");
    log("Role " + config.role.name + " created with id " + userRole.id);
  }

  let defaultRoleAccess = await knex("directus_access")
    .where({ role: userRole.id, policy: userPolicy.id })
    .first();

  if (!defaultRoleAccess) {
    await knex("directus_access").insert({
      id: knex.fn.uuid(),
      role: userRole.id,
      policy: userPolicy.id,
    });
    log("Access for role " + config.role.name + " added with policy " + config.policy.name + " and role " + config.role.name + "created");
  }

  let defaultSettings = await knex("directus_settings").first();

  if (defaultSettings) {
    await knex("directus_settings").update({
      default_language: config.settings.language,
      project_name: config.settings.name,
      project_color: config.settings.color,
      public_registration: config.settings.public_registration,
      public_registration_verify_email: config.settings.public_registration_verify_email,
      public_registration_role: userRole.id,
    });
    log("Settings updated");
  } else {
    await knex("directus_settings").insert({
      default_language: "fr-FR",
      project_name: "StarbreakersNet API",
      project_color: "#bd0000",
      public_registration: true,
      public_registration_verify_email: true,
      public_registration_role: userRole.id,
    });
    log("Settings created");
  }

  const actions = ["create", "read", "update", "delete"];

  for (const action of actions) {
    const existingPermission = await knex("directus_permissions")
      .where({
        collection: "directus_users",
        action: action,
      })
      .first();

    if (existingPermission) {
      let fields = "*"

      if (action === "create") {
        fields = "first_name,last_name,email,password,avatar,location,description,language"
      }

      await knex("directus_permissions").where("id", existingPermission.id).update({
        fields: fields,
      });
      log("Permission for " + action + " on directus_users updated");
    } else {
      let policyId;

      if (action === "create") {
        const publicPolicy = await knex("directus_policies")
          .where({ name: "$t:public_label" })
          .first();
        policyId = publicPolicy.id;
      } else {
        policyId = userPolicy.id;
      }

      await knex("directus_permissions").insert({
        collection: "directus_users",
        action: action,
        fields: "first_name,last_name,email,password,avatar,location,description,language",
        policy: policyId,
      });
      log("Permission for " + action + " on directus_users created");
    }
  }
}

export async function down(knex) {}
