const publicDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "rediffmail.com"]
const domainOf = (email: string) => email.split("@")[1]?.toLowerCase() ?? ""
/*
  free mail domains dont count as a circle
  else every gmail user is one big circle lol
*/
export function sameCircle(riderEmail: string, driverEmail: string) {
  const domain = domainOf(riderEmail)
  return domain !== "" && !publicDomains.includes(domain) && domain === domainOf(driverEmail)
}
