package permit.custom

import data.permit.generated.conditionset
import data.permit.generated.abac.utils.attributes
import future.keywords.every
import future.keywords.in


# You can find the official Rego tutorial at:
# https://www.openpolicyagent.org/docs/latest/policy-language/
# Example rule - you can replace this with something of your own
# allow {
# 	input.user.key == "test@permit.io"
# }
# Also, you can add more allow blocks here to get an OR effect
# allow {
#     # i.e if you add my_custom_rule here - the policy will allow
#     # if my_custom_rule is true, EVEN IF policies.allow is false.
#     my_custom_rule
# }

allow {
    input.resource.type == "visit"
    is_null(object.get(input.resource,"key",null))
    allowed_visit
    allowed_visit_diagnoses
    allowed_visit_practitioner
}

default allowed_visit_practitioner := false 

allowed_visit_practitioner {
    conditionset.resourceset_advertised_5fpractitioner with input.resource.type as "practitioner" with input.resource.key as attributes.resource.practitioner_id with input.resource.attributes as {}
}

default allowed_visit_diagnoses := false

allowed_visit_diagnoses {
    every diagnosis in attributes.resource.diagnosis {
        conditionset.resourceset_non_5fconsealed_5fdiagnosis with input.resource.type as "diagnosis" with input.resource.key as diagnosis
    }
}

default allowed_visit := false

allowed_visit {
    conditionset.resourceset_non_5fconsealed_5fvisit with input.resource.attributes.appointment_id as null
}