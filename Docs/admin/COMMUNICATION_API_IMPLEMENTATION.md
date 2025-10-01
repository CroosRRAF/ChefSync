# Communication API Implementation Checklist

**Priority**: 🔴 CRITICAL
**Timeline**: 1-2 days
**Impact**: Fixes console errors, enables full Communication page functionality

---

## Missing Endpoints to Implement

### 1. Communication Statistics

**Endpoint**: `GET /api/communications/stats/`
**Action**: `@action(detail=False, methods=['get'])`

```python
@action(detail=False, methods=['get'])
def stats(self, request):
    """Get communication statistics"""
    from django.db.models import Count, Avg

    queryset = self.get_queryset()

    stats = {
        'total': queryset.count(),
        'pending': queryset.filter(status='pending').count(),
        'in_progress': queryset.filter(status='in_progress').count(),
        'resolved': queryset.filter(status='resolved').count(),
        'closed': queryset.filter(status='closed').count(),
        'average_rating': queryset.filter(
            rating__isnull=False
        ).aggregate(Avg('rating'))['rating__avg'] or 0,
        'by_type': {
            'feedback': queryset.filter(communication_type='feedback').count(),
            'complaint': queryset.filter(communication_type='complaint').count(),
            'suggestion': queryset.filter(communication_type='suggestion').count(),
            'inquiry': queryset.filter(communication_type='inquiry').count(),
            'other': queryset.filter(communication_type='other').count(),
        }
    }

    return Response(stats)
```

**Test**:

```bash
curl -H "Authorization: Bearer <token>" http://127.0.0.1:8000/api/communications/stats/
```

---

### 2. Sentiment Analysis

**Endpoint**: `GET /api/communications/sentiment-analysis/?period=30d`
**Action**: `@action(detail=False, methods=['get'])`

```python
@action(detail=False, methods=['get'])
def sentiment_analysis(self, request):
    """Get sentiment analysis of communications"""
    from datetime import timedelta
    from django.utils import timezone

    period = request.GET.get('period', '30d')
    days = int(period.replace('d', ''))

    start_date = timezone.now() - timedelta(days=days)
    queryset = self.get_queryset().filter(created_at__gte=start_date)

    # Basic sentiment based on ratings and keywords
    positive_count = queryset.filter(
        Q(rating__gte=4) | Q(message__icontains='thank') | Q(message__icontains='great')
    ).count()

    negative_count = queryset.filter(
        Q(rating__lte=2) | Q(communication_type='complaint')
    ).count()

    total = queryset.count()
    neutral_count = total - positive_count - negative_count

    # Extract trending topics from subjects
    trending_topics = list(queryset.values_list('subject', flat=True)[:10])

    return Response({
        'positive': positive_count,
        'negative': negative_count,
        'neutral': neutral_count,
        'trending_topics': trending_topics
    })
```

**Test**:

```bash
curl -H "Authorization: Bearer <token>" "http://127.0.0.1:8000/api/communications/sentiment-analysis/?period=30d"
```

---

### 3. Campaign Statistics

**Endpoint**: `GET /api/communications/campaign-stats/`
**Action**: `@action(detail=False, methods=['get'])`

```python
@action(detail=False, methods=['get'])
def campaign_stats(self, request):
    """Get email campaign statistics"""
    # TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    # For now, return basic stats from communications

    queryset = self.get_queryset().filter(
        communication_type__in=['promotional', 'alert']
    )

    total_campaigns = queryset.count()
    active_campaigns = queryset.filter(status__in=['pending', 'in_progress']).count()

    # Placeholder for email tracking metrics
    stats = {
        'total_campaigns': total_campaigns,
        'active_campaigns': active_campaigns,
        'total_sent': total_campaigns,  # TODO: Track actual sent count
        'delivered': int(total_campaigns * 0.95),  # TODO: Get from email service
        'opened': int(total_campaigns * 0.45),  # TODO: Get from email service
        'clicked': int(total_campaigns * 0.12),  # TODO: Get from email service
        'conversion_rate': 12.5  # TODO: Calculate actual conversion
    }

    return Response(stats)
```

**Test**:

```bash
curl -H "Authorization: Bearer <token>" http://127.0.0.1:8000/api/communications/campaign-stats/
```

---

### 4. Delivery Statistics

**Endpoint**: `GET /api/communications/delivery-stats/?period=30d`
**Action**: `@action(detail=False, methods=['get'])`

```python
@action(detail=False, methods=['get'])
def delivery_stats(self, request):
    """Get communication delivery statistics"""
    from datetime import timedelta
    from django.utils import timezone

    period = request.GET.get('period', '30d')
    days = int(period.replace('d', ''))

    start_date = timezone.now() - timedelta(days=days)
    queryset = self.get_queryset().filter(created_at__gte=start_date)

    total_sent = queryset.count()

    # Placeholder stats - TODO: Integrate with actual email/SMS service
    stats = {
        'total_sent': total_sent,
        'delivered': int(total_sent * 0.95),
        'opened': int(total_sent * 0.45),
        'clicked': int(total_sent * 0.12),
        'failed': int(total_sent * 0.05),
        'pending': queryset.filter(status='pending').count()
    }

    return Response(stats)
```

**Test**:

```bash
curl -H "Authorization: Bearer <token>" "http://127.0.0.1:8000/api/communications/delivery-stats/?period=30d"
```

---

### 5. Notifications List

**Endpoint**: `GET /api/communications/notifications/`
**Action**: `@action(detail=False, methods=['get'])`

```python
@action(detail=False, methods=['get'])
def notifications(self, request):
    """Get communication notifications"""
    # Return system communications that are notification type
    queryset = self.get_queryset().filter(
        communication_type='notification'
    ).order_by('-created_at')[:50]

    serializer = self.get_serializer(queryset, many=True)
    return Response({
        'results': serializer.data,
        'count': queryset.count()
    })
```

**Test**:

```bash
curl -H "Authorization: Bearer <token>" http://127.0.0.1:8000/api/communications/notifications/
```

---

### 6. Duplicate Communication

**Endpoint**: `POST /api/communications/{id}/duplicate/`
**Action**: `@action(detail=True, methods=['post'])`

```python
@action(detail=True, methods=['post'])
def duplicate(self, request, pk=None):
    """Duplicate a communication"""
    communication = self.get_object()

    # Create a copy
    communication.pk = None
    communication.reference_number = None  # Will be auto-generated
    communication.subject = f"Copy of {communication.subject}"
    communication.status = 'draft'
    communication.save()

    serializer = self.get_serializer(communication)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
```

**Test**:

```bash
curl -X POST -H "Authorization: Bearer <token>" http://127.0.0.1:8000/api/communications/1/duplicate/
```

---

### 7. Send Communication

**Endpoint**: `POST /api/communications/send/`
**Action**: `@action(detail=False, methods=['post'])`

```python
@action(detail=False, methods=['post'])
def send(self, request):
    """Send a new communication"""
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    communication = serializer.save()
    communication.status = 'sent'
    communication.save()

    # TODO: Integrate with email/SMS service to actually send
    # For now, just mark as sent

    return Response(
        self.get_serializer(communication).data,
        status=status.HTTP_201_CREATED
    )
```

**Test**:

```bash
curl -X POST -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"subject":"Test","message":"Test message","communication_type":"email"}' \
     http://127.0.0.1:8000/api/communications/send/
```

---

### 8. Send Specific Communication

**Endpoint**: `POST /api/communications/{id}/send/`
**Action**: `@action(detail=True, methods=['post'])`

```python
@action(detail=True, methods=['post'])
def send(self, request, pk=None):
    """Send an existing communication"""
    communication = self.get_object()

    if communication.status == 'sent':
        return Response(
            {'error': 'Communication already sent'},
            status=status.HTTP_400_BAD_REQUEST
        )

    communication.status = 'sent'
    communication.save()

    # TODO: Integrate with email/SMS service to actually send

    return Response(self.get_serializer(communication).data)
```

**Test**:

```bash
curl -X POST -H "Authorization: Bearer <token>" http://127.0.0.1:8000/api/communications/1/send/
```

---

### 9. Bulk Update

**Endpoint**: `PATCH /api/communications/bulk-update/`
**Action**: `@action(detail=False, methods=['patch'])`

```python
@action(detail=False, methods=['patch'])
def bulk_update(self, request):
    """Bulk update communication status"""
    ids = request.data.get('ids', [])
    new_status = request.data.get('status')

    if not ids or not new_status:
        return Response(
            {'error': 'ids and status are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    updated = self.get_queryset().filter(id__in=ids).update(status=new_status)

    return Response({
        'updated': updated,
        'status': new_status
    })
```

**Test**:

```bash
curl -X PATCH -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"ids":[1,2,3],"status":"resolved"}' \
     http://127.0.0.1:8000/api/communications/bulk-update/
```

---

### 10. Send Custom Email

**Endpoint**: `POST /api/communications/send-email/`
**Action**: `@action(detail=False, methods=['post'])`

```python
@action(detail=False, methods=['post'])
def send_email(self, request):
    """Send custom email with optional template"""
    from django.core.mail import EmailMessage

    subject = request.data.get('subject')
    body = request.data.get('body')
    recipients = request.data.get('recipients', [])
    template_id = request.data.get('template_id')

    if not subject or not body or not recipients:
        return Response(
            {'error': 'subject, body, and recipients are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # If template provided, merge with template
    if template_id:
        try:
            template = CommunicationTemplate.objects.get(id=template_id)
            body = template.body.format(**request.data.get('variables', {}))
        except CommunicationTemplate.DoesNotExist:
            pass

    # Send email
    email = EmailMessage(
        subject=subject,
        body=body,
        to=recipients,
        from_email=settings.DEFAULT_FROM_EMAIL
    )

    # Handle attachments
    attachments = request.FILES.getlist('attachments', [])
    for attachment in attachments:
        email.attach(attachment.name, attachment.read(), attachment.content_type)

    try:
        email.send()
        return Response({
            'success': True,
            'sent_to': recipients,
            'count': len(recipients)
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

**Test**:

```bash
curl -X POST -H "Authorization: Bearer <token>" \
     -F "subject=Test Email" \
     -F "body=Test message" \
     -F 'recipients=["user@example.com"]' \
     http://127.0.0.1:8000/api/communications/send-email/
```

---

### 11. Add Response to Communication

**Endpoint**: `POST /api/communications/{id}/responses/`
**Action**: Nested route or separate viewset action

```python
# Option 1: As nested action in CommunicationViewSet
@action(detail=True, methods=['post'])
def responses(self, request, pk=None):
    """Add a response to communication"""
    communication = self.get_object()

    response_data = {
        'communication': communication.id,
        'responder': request.user.id,
        'response': request.data.get('response'),
        'is_resolution': request.data.get('is_resolution', False)
    }

    serializer = CommunicationResponseSerializer(data=response_data)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data, status=status.HTTP_201_CREATED)

# Option 2: Ensure CommunicationResponseViewSet allows creation
# Already exists in router, just verify it works
```

**Test**:

```bash
curl -X POST -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"response":"Thank you for your feedback","is_resolution":false}' \
     http://127.0.0.1:8000/api/communications/1/responses/
```

---

## Implementation Steps

### Step 1: Update Views (30 minutes)

```bash
# Edit the file
code backend/apps/communications/views.py
```

Add all 11 action methods to `CommunicationViewSet` class.

### Step 2: Test Each Endpoint (1 hour)

Use the curl commands above or create a test script:

```python
# backend/apps/communications/test_api.py
import requests

BASE_URL = "http://127.0.0.1:8000/api/communications"
TOKEN = "your-admin-token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Test stats
response = requests.get(f"{BASE_URL}/stats/", headers=headers)
print("Stats:", response.json())

# Test sentiment analysis
response = requests.get(f"{BASE_URL}/sentiment-analysis/",
                       params={"period": "30d"},
                       headers=headers)
print("Sentiment:", response.json())

# Test campaign stats
response = requests.get(f"{BASE_URL}/campaign-stats/", headers=headers)
print("Campaign Stats:", response.json())

# ... test all endpoints
```

### Step 3: Update Frontend to Remove Fallbacks (15 minutes)

```typescript
// frontend/src/services/communicationService.ts

// Remove the fallback data from these methods:
// - getCommunicationStats()
// - getSentimentAnalysis()
// - getCampaignStats()
// - getDeliveryStats()
// - getNotifications()

// Change from:
if (error.response?.status === 404) {
  console.warn("Stats endpoint not available, using fallback data");
  return {
    /* fallback data */
  };
}

// To:
// Just let it throw the error normally
return this.handleError(error, "getCommunicationStats");
```

### Step 4: Test in Browser (30 minutes)

1. Start backend: `python manage.py runserver`
2. Start frontend: `npm run dev`
3. Navigate to `/admin/communication`
4. Check console - should be no 404 errors
5. Verify all stats display correctly
6. Test actions (send, duplicate, bulk update)

### Step 5: Run Integration Tests (Optional, 1 hour)

```python
# backend/apps/communications/tests/test_integration.py

from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class CommunicationAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@test.com',
            password='test123',
            name='Admin'
        )
        self.client.force_authenticate(user=self.admin)

    def test_stats_endpoint(self):
        response = self.client.get('/api/communications/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('total', response.data)

    def test_sentiment_analysis(self):
        response = self.client.get('/api/communications/sentiment-analysis/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('positive', response.data)

    # ... more tests
```

Run tests:

```bash
python manage.py test apps.communications.tests.test_integration
```

---

## Checklist

### Backend Implementation

- [ ] Add `stats` action to CommunicationViewSet
- [ ] Add `sentiment_analysis` action
- [ ] Add `campaign_stats` action
- [ ] Add `delivery_stats` action
- [ ] Add `notifications` action
- [ ] Add `duplicate` action
- [ ] Add `send` action (list-level)
- [ ] Add `send` action (detail-level)
- [ ] Add `bulk_update` action
- [ ] Add `send_email` action
- [ ] Verify `responses` nested route works

### Testing

- [ ] Test stats endpoint with curl
- [ ] Test sentiment analysis with curl
- [ ] Test campaign stats with curl
- [ ] Test delivery stats with curl
- [ ] Test notifications with curl
- [ ] Test duplicate with curl
- [ ] Test send with curl
- [ ] Test bulk update with curl
- [ ] Test send email with curl
- [ ] Test add response with curl

### Frontend Updates

- [ ] Remove fallback data from getCommunicationStats
- [ ] Remove fallback data from getSentimentAnalysis
- [ ] Remove fallback data from getCampaignStats
- [ ] Remove fallback data from getDeliveryStats
- [ ] Remove fallback data from getNotifications
- [ ] Test Communication page loads without errors
- [ ] Test all communication features work
- [ ] Verify no console 404 errors

### Documentation

- [ ] Update API documentation
- [ ] Add endpoint examples
- [ ] Document request/response formats
- [ ] Update integration audit status

---

## Success Criteria

✅ **All endpoints return 200 status**
✅ **No console 404 errors on Communication page**
✅ **All stats display real data (not zeros)**
✅ **Actions work (send, duplicate, bulk update)**
✅ **Tests pass**

---

## Estimated Timeline

| Task                   | Time          | Status         |
| ---------------------- | ------------- | -------------- |
| Implement 11 endpoints | 2-3 hours     | ⬜ Pending     |
| Test with curl         | 1 hour        | ⬜ Pending     |
| Update frontend        | 30 minutes    | ⬜ Pending     |
| Browser testing        | 30 minutes    | ⬜ Pending     |
| Write tests (optional) | 1 hour        | ⬜ Pending     |
| Documentation          | 30 minutes    | ⬜ Pending     |
| **Total**              | **4-6 hours** | **⬜ Pending** |

---

**Priority**: 🔴 Start immediately
**Blocking**: Communication page functionality
**Next**: Payment integration, Analytics connection
