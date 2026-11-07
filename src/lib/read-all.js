// Supabase caps individual responses; keep owner and admin lists complete.
export async function readAll(makeQuery) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await makeQuery().range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
