# Admin Pages and Components Refactor

## Summary
This PR refactors the admin-related pages and components to ensure only canonical admin pages exist, remove duplicates, and improve UI/UX consistency.

## Changes Made

### Removed Files
- Orphan admin pages not included in routing
- Duplicate components with similar functionality
- Re-export pages that add no value

### Moved Files
- Consolidated communication components to main admin directory
- Moved relevant components to appropriate canonical pages

### Updated Files
- Updated import paths after moves
- Integrated approval logic into Users page
- Added profile management to Settings page
- Enhanced Analytics with reporting features
- Improved Notifications with system alerts

## Checklist

### Code Quality
- [ ] Build passes (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] No TypeScript errors

### Functionality
- [ ] All canonical admin pages work correctly
- [ ] Routing is intact
- [ ] No broken imports
- [ ] Components render properly

### UI/UX
- [ ] Visual check - layouts look correct
- [ ] Responsive design verified on mobile/tablet
- [ ] Accessibility check with Lighthouse/axe
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works

### Performance
- [ ] Bundle size not significantly increased
- [ ] No new performance regressions
- [ ] Lazy loading preserved where applicable

### Testing
- [ ] Unit tests updated for moved components
- [ ] Integration tests pass
- [ ] E2E tests updated if needed

## Breaking Changes
- Removed non-canonical admin routes
- Consolidated approval functionality into Users page
- Moved profile settings to Settings page

## Migration Notes
- Update any bookmarks to removed admin routes
- Approval workflows now accessed via Users page tabs
- Profile management moved to Settings

## Screenshots
<!-- Add before/after screenshots of key pages -->