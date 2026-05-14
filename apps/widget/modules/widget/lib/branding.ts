export const formatViviaOrganizationName = (name?: string | null) => {
  const cleanName = name?.trim();

  if (!cleanName) {
    return "Vivia - Support";
  }

  if (/^vivia\s*-/i.test(cleanName)) {
    return cleanName;
  }

  return `Vivia - ${cleanName}`;
};
