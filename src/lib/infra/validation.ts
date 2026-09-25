import { z } from "zod"

function humanizeField(path: (string | number)[]): string {
  const lastSegment = path[path.length - 1]

  if (typeof lastSegment !== "string") {
    return "value"
  }

  const spaced = lastSegment.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()

  return spaced
}

z.config({
  customError: (issue) => {
    const path = (issue.path ?? []) as (string | number)[];
    const field = humanizeField(path)

    if (issue.input === undefined) {
      return `Please enter a ${field}`
    }

    if (issue.code === "invalid_format") {
      return `Please enter a valid ${field}`
    }

    if (issue.code === "too_small") {
      return `${field} is too short`
    }

    if (issue.code === "too_big") {
      return `${field} is too long`
    }

    return `${field} is invalid`
  },
})
