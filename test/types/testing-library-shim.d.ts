// IDE shim to satisfy TypeScript module resolution in editors
// Vitest can run without this; this is only to silence ts(2307) in the IDE.
// Prefer real package types when the IDE resolves node_modules correctly.
declare module '@testing-library/react' {
  const ReactTestingLibrary: any
  export = ReactTestingLibrary
}

declare module '@testing-library/user-event' {
  const userEvent: any
  export default userEvent
}
