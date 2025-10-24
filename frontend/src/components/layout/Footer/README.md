# Footer Component

A comprehensive footer component for the ChefSync web application with multiple variants for different page types.

## Features

- **Multiple Variants:**

  - `default`: Full footer with company info, links, newsletter signup, and contact details
  - `minimal`: Simple footer for dashboard pages with basic copyright and links
  - `dashboard`: Enhanced footer for authenticated user dashboards

- **Responsive Design**: Adapts to different screen sizes
- **Newsletter Subscription**: Working newsletter signup form
- **Social Media Links**: Facebook, Twitter, Instagram, YouTube
- **Brand Integration**: Uses ChefSync logo and maintains brand consistency
- **Theme Support**: Works with light and dark themes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

```tsx
import Footer from '@/components/layout/Footer';

// Default footer (for public pages like Home, About, Contact)
<Footer />

// Minimal footer (for admin panels)
<Footer variant="minimal" />

// Dashboard footer (for user dashboards)
<Footer variant="dashboard" />

// With custom className
<Footer variant="default" className="custom-styles" />
```

## Props

| Prop        | Type                                    | Default     | Description            |
| ----------- | --------------------------------------- | ----------- | ---------------------- |
| `variant`   | `'default' \| 'minimal' \| 'dashboard'` | `'default'` | Footer style variant   |
| `className` | `string`                                | `''`        | Additional CSS classes |

## Styling

The footer uses Tailwind CSS classes and follows the ChefSync design system:

- Primary color: Orange (#FF8C42)
- Secondary color: Deep Blue (#2C3E50)
- Accent color: Green (#2ECC71)
- Background: Uses theme-aware background colors

## Implementation Notes

- Logo paths include fallback from PNG to SVG
- Newsletter form includes loading states and error handling
- Social media links open in new tabs
- Contact information can be easily updated
- Stats (trusted by chefs, rating) can be made dynamic
