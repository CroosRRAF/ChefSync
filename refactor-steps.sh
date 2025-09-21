#!/bin/bash

# Admin Refactor Steps
# Run in feature branch: git checkout -b refactor/admin-cleanup

echo "Starting admin refactor..."

# Create backup branch
git checkout -b refactor/admin-cleanup-backup
git checkout refactor/admin-cleanup

# Remove orphan pages and components
echo "Removing orphan files..."
git rm frontend/src/pages/admin/Communications.tsx
git rm frontend/src/components/admin/Communications.tsx
git rm frontend/src/pages/admin/CookApprovals.tsx
git rm frontend/src/components/admin/CookApprovals.tsx
git rm frontend/src/pages/admin/DeliveryAgentApprovals.tsx
git rm frontend/src/components/admin/DeliveryAgentApprovals.tsx
git rm frontend/src/pages/admin/Profile.tsx
git rm frontend/src/components/admin/Profile.tsx
git rm frontend/src/pages/admin/Reports.tsx
git rm frontend/src/components/admin/Reports.tsx
git rm frontend/src/pages/admin/UnifiedApprovals.tsx
git rm frontend/src/components/admin/UnifiedApprovals.tsx
git rm frontend/src/pages/admin/UserApproval.tsx
git rm frontend/src/components/admin/UserApproval.tsx
git rm frontend/src/pages/admin/communications/ComplaintManagement.tsx
git rm frontend/src/pages/admin/communications/EmailTemplates.tsx
git rm frontend/src/pages/admin/communications/FeedbackManagement.tsx
git rm frontend/src/pages/admin/communications/SystemAlerts.tsx

# Move components
echo "Moving components..."
git mv frontend/src/components/admin/communications/EmailTemplates.tsx frontend/src/components/admin/EmailTemplates.tsx
git mv frontend/src/components/admin/communications/SystemAlerts.tsx frontend/src/components/admin/SystemAlerts.tsx

# Update imports (using sed)
echo "Updating imports..."
sed -i "s|@/components/admin/communications/ComplaintManagement|@/components/admin/ComplaintManagement|g" frontend/src/pages/admin/Complaints.tsx
sed -i "s|@/components/admin/communications/FeedbackManagement|@/components/admin/FeedbackManagement|g" frontend/src/pages/admin/Complaints.tsx

# Move remaining communications components
git mv frontend/src/components/admin/communications/ComplaintManagement.tsx frontend/src/components/admin/ComplaintManagement.tsx
git mv frontend/src/components/admin/communications/FeedbackManagement.tsx frontend/src/components/admin/FeedbackManagement.tsx

# Remove empty communications dir
rmdir frontend/src/components/admin/communications
rmdir frontend/src/pages/admin/communications

# Update index.ts if needed
# Assuming index.ts exports the moved components

# Run lint and tests
echo "Running checks..."
npm run lint
npm run test

# Build check
npm run build

echo "Refactor complete. Review changes and commit."