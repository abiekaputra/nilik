/** Module responsible for presenting inspection decisions consistently. */

import type { Decision } from "../lib/types";

export function DecisionBadge({ decision }: { decision: Decision }) {
  return (
    <span className={`decision decision--${decision.toLowerCase()}`}>
      {decision}
    </span>
  );
}
