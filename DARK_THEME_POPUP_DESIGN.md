# Dark Theme Food Detail Popup - Design Documentation

## Overview
Complete redesign of the food detail popup to match the beautiful dark theme design with a clean, modern two-column layout.

## Design Reference
Based on the provided screenshot with dark background and elegant UI elements.

## Layout Structure

### Modal Container
- **Width**: `max-w-5xl` (1280px max)
- **Height**: `max-h-[90vh]` (90% viewport height)
- **Background**: Black (`bg-black`)
- **Border Radius**: `rounded-2xl`
- **Border**: None (`border-0`)

### Two-Column Grid Layout
```
┌─────────────────────────────────────────┐
│  [Food Info & Image]  │  [Cook Selection] │
│      400px fixed      │    Flexible      │
└─────────────────────────────────────────┘
```

## Left Column - Food Information

### Content Sections
1. **Food Title** (3xl, bold, white)
2. **Description** (text-gray-400, leading-relaxed)
3. **Food Image** (aspect-[4/3], rounded-2xl)
4. **Stats Icons** (orange icons with white text):
   - ⏱️ Prep time
   - ⭐ Rating
   - 👨‍🍳 Cooks available

### Styling
- **Padding**: `p-8`
- **Text Color**: White for headings, gray-400 for description
- **Icon Color**: Orange-500
- **Layout**: Flex column

## Right Column - Cook Selection

### Background
- **Gradient**: `from-gray-900 to-black`
- **Padding**: `p-8`
- **Scrollable**: `overflow-y-auto` with custom scrollbar

### Header
- Orange chef hat icon
- "Available Cooks (N)" title
- White text, xl font

### Cook Cards

#### Card Container
- **Background**: `bg-gray-800`
- **Border**: `border border-gray-700`
- **Border Radius**: `rounded-2xl`
- **Padding**: `p-5`
- **Spacing**: `space-y-4` between cards

#### Cook Header
- **Left**: Avatar (16×16, orange-500, rounded-full) + Chef name
- **Right**: Star rating (orange-500 star + white text)

#### Size Selection Buttons
- **Layout**: Horizontal flex-wrap
- **Unselected**: 
  - Background: `bg-gray-700`
  - Text: `text-gray-300`
  - Border: `border-gray-600`
  - Hover: `bg-gray-600`
- **Selected**:
  - Background: `bg-orange-500`
  - Text: `text-white`
- **Content**: "Size - LKR XX.XX"
- **Padding**: `px-6 py-3`
- **Border Radius**: `rounded-lg`

#### Quantity & Add Section
- **Layout**: Flex horizontal with gap-4
- **Quantity Selector**:
  - Label: "Qty:" in white
  - Buttons: Gray-700 background, 10×10, rounded-lg
  - Display: White text, xl font, centered
  - Range: 1-10
- **Add Button**:
  - **Flex**: `flex-1` (takes remaining space)
  - **Background**: `bg-orange-500`
  - **Hover**: `bg-orange-600`
  - **Text**: White, semibold
  - **Padding**: `py-6`
  - **Border Radius**: `rounded-xl`
  - **Content**: "➕ Add (LKR XX.XX)"
  - **Height**: 60px (py-6)

## Color Palette

### Background Colors
- **Modal**: `#000000` (black)
- **Right Column**: Gradient `#111827` to `#000000` (gray-900 to black)
- **Cook Cards**: `#1F2937` (gray-800)
- **Buttons Unselected**: `#374151` (gray-700)

### Accent Colors
- **Primary Orange**: `#F97316` (orange-500)
- **Orange Hover**: `#EA580C` (orange-600)
- **Star Yellow**: `#F59E0B` (yellow-500)

### Text Colors
- **Primary Text**: `#FFFFFF` (white)
- **Secondary Text**: `#9CA3AF` (gray-400)
- **Tertiary Text**: `#D1D5DB` (gray-300)

## Typography

### Headings
- **Food Title**: `text-3xl font-bold text-white`
- **Section Title**: `text-xl font-semibold text-white`
- **Chef Name**: `text-xl font-semibold text-white`

### Body Text
- **Description**: `text-base text-gray-400`
- **Stats**: `text-base text-white`
- **Buttons**: `font-semibold`

### Numbers
- **Quantity**: `text-xl font-semibold text-white`
- **Price**: `text-lg font-semibold`
- **Rating**: `text-lg font-semibold text-white`

## Components

### Close Button
- **Position**: `absolute top-6 right-6`
- **Size**: `h-10 w-10`
- **Background**: `bg-white/10` with backdrop-blur
- **Hover**: `bg-white/20`
- **Shape**: Rounded-full
- **Icon**: X (h-5 w-5)

### Avatar
- **Size**: 16×16 (64px)
- **Background**: Orange-500 gradient
- **Text**: 2 uppercase initials
- **Font**: Bold, xl

### Rating Display
- **Icon**: Orange star (filled)
- **Size**: h-5 w-5
- **Text**: Number with 1 decimal

### Size Buttons
- **Min Width**: Auto (content-based)
- **Height**: 48px (py-3)
- **Transition**: All 150ms

### Quantity Controls
- **Button Size**: 10×10 (40px)
- **Shape**: Rounded-lg
- **Icons**: Minus/Plus, h-4 w-4

### Add Button
- **Min Height**: 60px
- **Icon**: Plus, h-5 w-5
- **Text**: "Add (LKR XX.XX)"
- **Animation**: Smooth transitions

## Responsive Behavior

### Desktop (>768px)
- Two-column grid: `[400px 1fr]`
- Full features visible

### Tablet/Mobile (<768px)
- Single column stack
- Left column on top
- Right column below
- Full width

## Interactions

### Size Selection
1. User clicks size button
2. Button changes to orange-500 background
3. Other buttons remain gray
4. Quantity selector appears
5. Add button shows total price

### Quantity Adjustment
1. User clicks + or -
2. Number updates (1-10 range)
3. Add button price updates in real-time
4. Smooth transitions

### Add to Cart
1. User clicks Add button
2. Toast notification appears
3. Modal closes automatically
4. Cart updates

## Accessibility

- **ARIA**: `aria-describedby="food-detail-description"`
- **Keyboard**: All interactive elements focusable
- **Contrast**: WCAG AA compliant
- **Focus States**: Visible outlines on interactive elements

## Performance

- **Lazy Load**: Images loaded on demand
- **Smooth Scroll**: Custom scrollbar with GPU acceleration
- **Transitions**: Hardware-accelerated transforms
- **State Management**: React hooks with proper cleanup

## Files Modified
- `frontend/src/components/menu/EnhancedMenuPage.tsx`
  - Modal container: Lines 535-537
  - Left column: Lines 551-595
  - Right column: Lines 598-750
  - Cook cards: Lines 657-745

## Key Features

✅ **Dark Theme** - Modern black/gray color scheme
✅ **Two-Column Layout** - Efficient use of space
✅ **Compact Design** - Max-width 1280px
✅ **Beautiful Cards** - Elegant cook selection cards
✅ **Smooth Interactions** - Polished animations
✅ **Clear Hierarchy** - Easy to scan and understand
✅ **Real-time Updates** - Price calculation on quantity change
✅ **Mobile Responsive** - Adapts to all screen sizes

## Comparison: Before vs After

### Before (Large Hero Design)
- ❌ Full-width modal (7xl)
- ❌ 45% viewport hero image
- ❌ Expandable cook cards
- ❌ Multi-step selection
- ❌ White/light theme
- ❌ Complex layout

### After (Dark Theme Design)
- ✅ Compact modal (5xl)
- ✅ Sidebar food image
- ✅ Flat cook cards
- ✅ Direct selection
- ✅ Dark theme
- ✅ Simple, clean layout

## User Experience Improvements

1. **Faster Selection**: All options visible immediately
2. **Less Scrolling**: Compact horizontal button layout
3. **Clear Pricing**: Price shown on size buttons
4. **Quick Add**: One-click size selection + add
5. **Visual Hierarchy**: Dark theme reduces eye strain
6. **Professional Look**: Modern, premium appearance

## Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Testing Checklist
- [x] Modal opens correctly
- [x] Two-column layout renders
- [x] Food image displays
- [x] Stats show correctly
- [x] Cook cards render
- [x] Size buttons work
- [x] Quantity selector functions
- [x] Add button shows correct price
- [x] Toast notification appears
- [x] Modal closes on add
- [x] Dark theme applied
- [x] No linter errors
- [x] Responsive on mobile

