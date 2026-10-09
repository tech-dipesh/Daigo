export type RouteParams<T extends Record<string, string> = { id: string }> = { params: Promise<T> }
// export type RouteParams = { params: Promise<{ id: string }> }