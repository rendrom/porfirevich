export function getQueryString(obj: Record<string, any>) {
  const str = '?' + Object.keys(obj).reduce((a, k) => {
    const param = encodeURIComponent(obj[k]);
    a.push(k + '=' + param);
    return a;
  }, [] as string[]).join('&');
  return str;
}
