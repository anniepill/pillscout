/**
 * The CSV line reader the room-manifest reader uses.
 *
 * One reader, shared, rather than a second one: a second CSV reader is a
 * second set of quoting bugs, and manifest notes columns carry commas and
 * doubled quotes.
 *
 * Splits one CSV line into its fields. A field may be wrapped in double
 * quotes, inside which a comma is literal and a doubled quote ("") is one
 * quote character. No trimming is done, and an empty line yields [''].
 */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}
