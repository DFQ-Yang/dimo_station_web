function check(raw) {
  const rawTrim = String(raw).trim();
  if (/^(?!https?:)[a-z][a-z0-9+.-]*:/i.test(rawTrim)) return 'BLOCK';
  let n = rawTrim;
  if (!/^https?:\/\//i.test(n)) n = 'https://' + n.replace(/^\/+/, '');
  let u;
  try { u = new URL(n); } catch (e) { return 'BLOCK'; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'BLOCK';
  if (/[:\s\\]/.test(u.hostname) || !u.hostname) return 'BLOCK';
  return 'PASS ' + u.toString();
}
['https://javascript:', 'javascript:alert(1)', 'data:text/html,xxx', 'www.baidu.com',
 'https://www.baidu.com', 'http://example.com/path?a=1', 'ftp://x.com', '///evil'].forEach(s =>
  console.log(JSON.stringify(s), '=>', check(s))
);
