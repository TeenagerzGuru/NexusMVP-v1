/** fetch wrapper that always attempts JSON parse and surfaces non-JSON error bodies. */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ data: T; ok: boolean; status: number }> {
  const response = await fetch(url, init);
  const text = await response.text();

  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new Error(
      response.ok
        ? "Invalid server response"
        : `Server error (${response.status}): ${text.slice(0, 120) || "Unknown error"}`,
    );
  }

  return { data, ok: response.ok, status: response.status };
}
