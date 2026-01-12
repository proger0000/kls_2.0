export const formatDateLocal = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

export const formatTimeLocal = (date: Date) =>
  date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

export const formatDateTimeLocal = (date: Date) => {
  const datePart = formatDateLocal(date);
  const timePart = formatTimeLocal(date);
  return `${datePart} ${timePart}`;
};

export const toDateTimeLocalInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

export const fromDateTimeLocalInput = (value?: string) => {
  if (!value) return null;
  return new Date(value).toISOString();
};
