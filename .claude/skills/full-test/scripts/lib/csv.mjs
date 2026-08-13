/**
 * RFC4180準拠のCSV読み書き
 *
 * 定型文の本文には改行・カンマ・引用符が入る。テスト仕様書はそれを
 * そのまま期待値として持つため、素朴な split(',') では壊れる。
 */

/** CSV文字列を行の配列（文字列の配列）へ変換する */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  /* 先頭のBOMは取り除く */
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }

    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }

  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/** ヘッダ行を持つCSVをオブジェクト配列へ変換する */
export function readCsvObjects(text) {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  if (rows.length === 0) return { header: [], records: [] };
  const header = rows[0].map((h) => h.trim());
  /*
   * 値はtrimしない。ClipTapは入力の前後空白を除去する仕様を持つため、
   * 「前後に空白がある入力」「除去後の期待値」をCSVで表現できる必要がある。
   * 読み込み側でtrimすると、その境界をテストできなくなる。
   * 代わりにID・列挙値の前後空白は validate.mjs が検出する。
   */
  const records = rows.slice(1).map((r, idx) => {
    const o = { __line: idx + 2 };
    header.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
  return { header, records };
}

function quote(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** オブジェクト配列をCSV文字列へ変換する */
export function writeCsvObjects(header, records) {
  const lines = [header.map(quote).join(',')];
  for (const r of records) lines.push(header.map((h) => quote(r[h])).join(','));
  return lines.join('\n') + '\n';
}
