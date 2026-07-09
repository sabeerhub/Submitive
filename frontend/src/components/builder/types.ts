import type { FormField } from "../../types/domain.js";

/** A field as edited in the builder, with a stable client-side key. */
export interface WorkingField extends FormField {
  clientId: string;
}

export function newClientId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `field-${Date.now()}-${Math.random()}`;
}
