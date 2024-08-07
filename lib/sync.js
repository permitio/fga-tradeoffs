const { Permit } = require("permitio");
const fs = require("fs").promises;

const { Diagnosis, Practitioner, Visit } = require("../data/data.json");

const permit = new Permit({
  token: process.env.PERMIT_API_KEY,
  pdp: process.env.PERMIT_PDP,
});

const clearAllInstances = async () => {
  const tuples = await permit.api.relationshipTuples.list();
  for (let { subject, object, relation } of tuples) {
    await permit.api.relationshipTuples.delete({
      subject,
      object,
      relation,
    });
  }
  const instances = await permit.api.resourceInstances.list();
  for (let { resource_id, key } of instances) {
    await permit.api.resourceInstances.delete(`${resource_id}:${key}`);
  }
  const conditionSets = await permit.api.conditionSetRules.list({
    resourceSetKey: "allowed_visit",
  });
  if (conditionSets.length) {
    await permit.api.conditionSetRules.delete({
      resource_set: "allowed_visit",
      user_set: "user",
      permission: "visit:read",
      is_role: true,
    });
  }
};

const syncUser = async () => {
  await permit.api.users.sync({
    key: "fga_user",
    email: "fga@user.app",
  });
  await permit.api.users.assignRole({
    user: "fga_user",
    role: "user",
    tenant: "default",
  });
};

const flatSync = async () => {
  await Promise.all(
    Diagnosis.map((diagnosis) =>
      permit.api.resourceInstances.create({
        key: diagnosis.id,
        tenant: "default",
        resource: "Diagnosis".toLowerCase(),
        attributes: { ...diagnosis },
      })
    )
  );

  await Promise.all(
    Practitioner.map((Practitioner) =>
      permit.api.resourceInstances.create({
        key: Practitioner.practitioner_id,
        tenant: "default",
        resource: "Practitioner".toLowerCase(),
        attributes: { ...Practitioner },
      })
    )
  );
};

const graphSync = async () => {
  await permit.api.resourceInstances.create({
    resource: "bool_mark",
    key: "1",
    tenant: "default",
  });
  await permit.api.users.assignRole({
    user: "fga_user",
    role: "allowed_user",
    tenant: "default",
    resource_instance: "bool_mark:1",
  });
  for (let diagnosis of Diagnosis) {
    await permit.api.resourceInstances.create({
      resource: "diagnosis",
      key: diagnosis.id,
      tenant: "default",
      attributes: { ...diagnosis },
    });
    if (!diagnosis.concealment) {
      await permit.api.relationshipTuples.create({
        object: "diagnosis:" + diagnosis.id,
        subject: "bool_mark:1",
        relation: "non_concealed_diagnosis",
      });
    }
  }
  for (let practitioner of Practitioner) {
    await permit.api.resourceInstances.create({
      resource: "practitioner",
      key: practitioner.practitioner_id,
      tenant: "default",
      attributes: { ...practitioner },
    });
    if (practitioner.is_advertised) {
      await permit.api.relationshipTuples.create({
        object: "practitioner:" + practitioner.practitioner_id,
        subject: "bool_mark:1",
        relation: "advertised_practitioner",
      });
    }
  }
  for (let visit of Visit) {
    await permit.api.resourceInstances.create({
      resource: "Visit".toLowerCase(),
      key: visit.appointment_id,
      tenant: "default",
      attributes: { ...visit },
    });
    await permit.api.relationshipTuples.create({
      subject: "practitioner:" + visit.practitioner_id,
      object: `visit:${visit.appointment_id}`,
      relation: "owner",
    });
    for (let diagnosis of visit.diagnosis) {
      await permit.api.relationshipTuples.create({
        subject: "diagnosis:" + diagnosis,
        object: `visit:${visit.appointment_id}`,
        relation: "part",
      });
    }
    if (!visit.concealed) {
      await permit.api.relationshipTuples.create({
        object: `visit:${visit.appointment_id}`,
        subject: "bool_mark:1",
        relation: "non_concealed_visit",
      });
    }
  }
};

const syncRego = async (type) => {
  const regoCode = await fs.readFile(`./policies/${type}.rego`, "utf-8");
  const headers = new Headers();
  headers.append("Content-Type", "text/plain");
  headers.append("Authorization", `Bearer ${process.env.PERMIT_API_KEY}`);
  const requestOptions = {
    method: "PUT",
    headers,
    body: regoCode,
    redirect: "follow",
  };
  await fetch(
    `${process.env.OPA_URL}/v1/policies/custom/root.rego`,
    requestOptions
  );
};

const allowedVisitConditionSet = async () => {
  await permit.api.conditionSetRules.create({
    user_set: "user",
    resource_set: "allowed_visit",
    permission: "visit:read",
    is_role: true,
  });
};

module.exports = {
  clearAllInstances,
  syncUser,
  flatSync,
  graphSync,
  syncRego,
  allowedVisitConditionSet
};
