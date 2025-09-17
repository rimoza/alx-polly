# Poll Analytics Dashboard - AI Development Rules

## 1. Component Architecture
- Use modular, single-responsibility components
- Implement React 19 features (use, Suspense boundaries)
- Leverage existing UI components from @/components/ui

## 2. Data Management
- Process analytics data server-side when possible
- Implement proper loading states with Suspense
- Cache analytics results for performance
- Use TypeScript interfaces for all data structures

## 3. Code Patterns
- Follow existing codebase conventions (Tailwind CSS, shadcn/ui)
- Use custom hooks for data fetching logic
- Implement error boundaries for resilient UX
- Keep components under 150 lines

## 4. Performance
- Lazy load chart components
- Aggregate data on the backend
- Use React.memo for expensive visualizations
- Implement virtualization for large datasets

## 5. Testing & Security
- Validate all user inputs
- Implement proper access controls
- Add loading skeletons for better UX
- Use environment variables for API endpoints