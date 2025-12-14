import * as ct from "countries-and-timezones";

export function getCountryNameFromTimzezone(timezone?: string) {
  if (!timezone) {
    console.log("No timezone provided");
    return undefined;
  }

  const tz = ct.getTimezone(timezone);
  if (!tz || !tz.countries || tz.countries.length === 0) {
    return undefined;
  }

  const countryCode = tz.countries[0]!;
  const country = ct.getCountry(countryCode);

  return {
    code: countryCode,
    name: country?.name || undefined,
  };
}

export function getCountryFlagUrl(countryCode: string) {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}
