interface GuestbookEntry {
  name: string;
  city: string;
}

interface GuestbookValidationSuccess {
  ok: true;
  value: GuestbookEntry;
}

interface GuestbookValidationFailure {
  ok: false;
  message: string;
}

declare function validateGuestbookEntry(input: unknown): GuestbookValidationSuccess | GuestbookValidationFailure;
