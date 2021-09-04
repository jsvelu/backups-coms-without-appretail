

import allianceutils.models
import allianceutils.rules
import rules

# Rules start here

rules.add_perm('delivery.is_transport_or_vin_team', allianceutils.rules.has_any_perms(('delivery.is_transport_team', 'delivery.is_vin_weight_team')))
