// IDE shim to satisfy TypeScript module resolution in editors
// Vitest can run without this; this is only to silence ts(2307) in the IDE.
// Prefer real package types when the IDE resolves node_modules correctly.
declare module '@testing-library/react' {
  export const render: unknown
  export const screen: unknown
  export const waitFor: unknown
  export const fireEvent: unknown
  const defaultExport: unknown
  export default defaultExport
}

declare module '@testing-library/user-event' {
  const userEvent: unknown
  export default userEvent
}
