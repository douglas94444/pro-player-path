import { sha256Hex } from "./crypto.ts";

export type CapiEvent = {
  eventName: string;
  eventId: string;
  eventTime: number;
  eventSourceUrl?: string | null;
  originalEventData?: { event_name: string; event_time: number };
  userData: Record<string, unknown>;
  customData: Record<string, unknown>;
};

export async function hashIdentifier(valor: string) {
  return sha256Hex(valor);
}

export async function sendCapi(event: CapiEvent) {
  const capiToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
  if (!capiToken) return;
  const pixelId = Deno.env.get("META_PIXEL_ID") ?? "3161156880941929";
  const testEventCode = Deno.env.get("META_TEST_EVENT_CODE");
  await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: capiToken,
      data: [
        {
          event_name: event.eventName,
          event_time: event.eventTime,
          event_id: event.eventId,
          action_source: "website",
          event_source_url: event.eventSourceUrl ?? undefined,
          data_processing_options: [],
          ...(event.originalEventData ? { original_event_data: event.originalEventData } : {}),
          user_data: event.userData,
          custom_data: event.customData,
        },
      ],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    }),
  }).catch(console.error);
}
