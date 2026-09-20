# Changelog

## [1.1.0] - 2026-09-20

### Fixed

- Preserve a child's existing object or callback ref, including React 19 callback cleanup, when tracking its inside area.
- Classify native event targets using host containment or legacy native tags, and reject unsupported target shapes.

### Changed

- Active and ActiveBoundary require exactly one non-Fragment child that forwards its ref to the inside native view. Multiple children, Fragments, and non-element children are rejected.
- Export ActiveInjectedProps, ActiveBoundaryInjectedProps, and ActiveChildProps with native view ref types. The injected setter type accepts both boolean values and functional updates.
- Widen the React Native peer range from ^0.82.1 to >=0.82.1, admitting newer React Native releases.
- Declare the existing React Hooks requirement as React >=16.8.0.
