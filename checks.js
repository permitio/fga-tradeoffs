const { Permit } = require("permitio");

const { Visit } = require("./data.json");

const permit = new Permit({
  token: process.env.PERMIT_API_KEY,
  pdp: process.env.PERMIT_PDP,
});

// This function perform bulk check for each resource in the visit object
// The data of the related objects (Diagnosis, Practitioner) is stored in OPA in advance
const bulkFlatCheck = async () => {
  const user = "maccabi_user";
  const action = "read";
  const filterList = await Promise.all(
    Visit.map((visit) => {
      return permit.bulkCheck([
        {
          user,
          action,
          resource: {
            type: "Visit".toLowerCase(),
            attributes: { ...visit },
          },
        },
        ...visit.diagnosis.map((diagnosis) => ({
          user,
          action,
          resource: {
            type: "Diagnosis".toLowerCase(),
            key: diagnosis,
          },
        })),
        {
          user,
          action,
          resource: {
            type: "Practitioner".toLowerCase(),
            key: visit.practitioner_id,
            tenant: "default",
          },
        },
      ]);
    })
  );
  return filterList.map((check) => !check.some((filter) => filter === false));
};

// This function is using the ReBAC graph to filter the allowed visit
// The function gets only the visit IDs and the all the data is stored in OPA in advance as a graph
const graphFilterCheck = async () => {
  const permissions = await permit.getUserPermissions(
    "maccabi_user",
    ["default"],
    Visit.map(({ appointment_id }) => `visit:${appointment_id}`)
  );

  return Visit.map(
    ({ appointment_id }) =>
      permissions[`visit:${appointment_id}`].roles.length === 3
  );
};

// This function is doing a single check on the visit object
// The policy for this data is using the custom rego policy
// You can find the policy in the `custom.rego` file
const customRegoSingleCheck = async () => {
  const filteredIndex = await Promise.all(
    Visit.map(({ concealed, diagnosis, practitioner_id }) =>
      permit.check("maccabi_user", "read", {
        type: "Visit".toLowerCase(),
        tenant: "default",
        attributes: {
          concealed,
          diagnosis,
          practitioner_id,
          appointment_id: "",
        },
      })
    )
  );
  return filteredIndex;
};

module.exports = {
  bulkFlatCheck,
  graphFilterCheck,
  customRegoSingleCheck,
};
