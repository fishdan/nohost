export function normalizeGuestbookText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

export function validateGuestbookEntry(input) {
  const name = normalizeGuestbookText(input?.name);
  const city = normalizeGuestbookText(input?.city);

  if (!name) return { ok: false, message: 'Please enter your name.' };
  if (!city) return { ok: false, message: 'Please enter your city.' };
  if (name.length > 80) return { ok: false, message: 'Please keep your name to 80 characters or fewer.' };
  if (city.length > 80) return { ok: false, message: 'Please keep your city to 80 characters or fewer.' };

  return { ok: true, value: { name, city } };
}
