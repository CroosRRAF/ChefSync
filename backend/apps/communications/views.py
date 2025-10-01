import uuid

from apps.admin_management.models import AdminActivityLog
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Communication,
    CommunicationCategory,
    CommunicationCategoryRelation,
    CommunicationResponse,
    CommunicationTag,
    CommunicationTagRelation,
    CommunicationTemplate,
)
from .serializers import (
    CommunicationCategorySerializer,
    CommunicationListSerializer,
    CommunicationResponseSerializer,
    CommunicationSerializer,
    CommunicationTagSerializer,
    CommunicationTemplateSerializer,
)


class CommunicationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing communications"""

    queryset = Communication.objects.all()
    serializer_class = CommunicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return CommunicationListSerializer
        return CommunicationSerializer

    def list(self, request, *args, **kwargs):
        """Override list to return all communications for admin users"""
        queryset = self.filter_queryset(self.get_queryset())

        # For admin users, return all results without pagination
        if request.user and request.user.role == "admin":
            serializer = self.get_serializer(queryset, many=True)
            return Response(
                {
                    "count": queryset.count(),
                    "next": None,
                    "previous": None,
                    "results": serializer.data,
                }
            )

        # For regular users, use pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        """Filter communications based on query parameters"""
        queryset = self.queryset.select_related("user", "assigned_to").prefetch_related(
            "tag_relations__tag", "responses"
        )

        # For admin users, don't apply pagination
        if self.request.user and self.request.user.role == "admin":
            self.pagination_class = None

        # Get query parameters
        status = self.request.query_params.get("status")
        priority = self.request.query_params.get("priority")
        communication_type = self.request.query_params.get("type")
        is_read = self.request.query_params.get("is_read")
        search = self.request.query_params.get("search")
        assigned_to = self.request.query_params.get("assigned_to")
        category = self.request.query_params.get("category")
        tag = self.request.query_params.get("tag")

        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
        if priority:
            queryset = queryset.filter(priority=priority)
        if communication_type:
            queryset = queryset.filter(communication_type=communication_type)
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")
        if assigned_to:
            if assigned_to == "unassigned":
                queryset = queryset.filter(assigned_to__isnull=True)
            else:
                queryset = queryset.filter(assigned_to_id=assigned_to)
        if category:
            queryset = queryset.filter(category_relations__category_id=category)
        if tag:
            queryset = queryset.filter(tag_relations__tag_id=tag)

        # Search filter
        if search:
            queryset = queryset.filter(
                Q(reference_number__icontains=search)
                | Q(subject__icontains=search)
                | Q(message__icontains=search)
                | Q(user__name__icontains=search)
                | Q(user__email__icontains=search)
            )

        return queryset.distinct()

        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
        if priority:
            queryset = queryset.filter(priority=priority)
        if communication_type:
            queryset = queryset.filter(communication_type=communication_type)
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")
        if assigned_to:
            if assigned_to == "unassigned":
                queryset = queryset.filter(assigned_to__isnull=True)
            else:
                queryset = queryset.filter(assigned_to_id=assigned_to)
        if category:
            queryset = queryset.filter(category_relations__category_id=category)
        if tag:
            queryset = queryset.filter(tag_relations__tag_id=tag)

        # Search filter
        if search:
            queryset = queryset.filter(
                Q(reference_number__icontains=search)
                | Q(subject__icontains=search)
                | Q(message__icontains=search)
                | Q(user__name__icontains=search)
                | Q(user__email__icontains=search)
            )

        return queryset.distinct()

    def perform_create(self, serializer):
        # Generate unique reference number
        reference_number = f"COM-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(user=self.request.user, reference_number=reference_number)

        # Log activity
        AdminActivityLog.objects.create(
            admin=self.request.user,
            action="create",
            resource_type="communication",
            resource_id=reference_number,
            description=f"Created new communication {reference_number}",
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT"),
        )

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        """Assign communication to a user"""
        communication = self.get_object()
        assignee_id = request.data.get("assignee_id")

        try:
            from django.contrib.auth import get_user_model

            User = get_user_model()
            ssignee = User.objects.get(user_id=assignee_id)
            communication.assign_to(assignee)

            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action="assign",
                resource_type="communication",
                resource_id=communication.reference_number,
                description=f"Assigned communication {communication.reference_number} to {assignee.email}",
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT"),
            )

            return Response({"message": f"Communication assigned to {assignee.name}"})

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Resolve communication"""
        communication = self.get_object()
        resolution_notes = request.data.get("resolution_notes")

        if not resolution_notes:
            return Response(
                {"error": "Resolution notes are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        communication.resolve(resolution_notes)

        # Log activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="resolve",
            resource_type="communication",
            resource_id=communication.reference_number,
            description=f"Resolved communication {communication.reference_number}",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )

        return Response({"message": "Communication resolved successfully"})

    @action(detail=True, methods=["post"])
    def add_tags(self, request, pk=None):
        """Add tags to communication"""
        communication = self.get_object()
        tag_ids = request.data.get("tag_ids", [])

        if not tag_ids:
            return Response(
                {"error": "tag_ids list is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        added_tags = []
        for tag_id in tag_ids:
            try:
                tag = CommunicationTag.objects.get(id=tag_id)
                CommunicationTagRelation.objects.get_or_create(
                    communication=communication,
                    tag=tag,
                    defaults={"added_by": request.user},
                )
                added_tags.append(tag.name)
            except CommunicationTag.DoesNotExist:
                continue

        if added_tags:
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action="update",
                resource_type="communication",
                resource_id=communication.reference_number,
                description=f'Added tags to communication {communication.reference_number}: {", ".join(added_tags)}',
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT"),
            )

        return Response({"message": f'Added tags: {", ".join(added_tags)}'})

    @action(detail=True, methods=["post"])
    def add_categories(self, request, pk=None):
        """Add categories to communication"""
        communication = self.get_object()
        category_ids = request.data.get("category_ids", [])

        if not category_ids:
            return Response(
                {"error": "category_ids list is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        added_categories = []
        for category_id in category_ids:
            try:
                category = CommunicationCategory.objects.get(id=category_id)
                CommunicationCategoryRelation.objects.get_or_create(
                    communication=communication,
                    category=category,
                    defaults={"added_by": request.user},
                )
                added_categories.append(category.name)
            except CommunicationCategory.DoesNotExist:
                continue

        if added_categories:
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action="update",
                resource_type="communication",
                resource_id=communication.reference_number,
                description=f'Added categories to communication {communication.reference_number}: {", ".join(added_categories)}',
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT"),
            )

        return Response({"message": f'Added categories: {", ".join(added_categories)}'})

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get communication statistics"""
        from django.db.models import Avg

        queryset = self.get_queryset()

        total = queryset.count()
        unread = queryset.filter(is_read=False).count()
        unassigned = queryset.filter(assigned_to__isnull=True).count()
        resolved = queryset.filter(status="resolved").count()
        pending = queryset.filter(status="pending").count()
        in_progress = queryset.filter(status="in_progress").count()
        closed = queryset.filter(status="closed").count()

        by_type = queryset.values("communication_type").annotate(count=Count("id"))
        by_priority = queryset.values("priority").annotate(count=Count("id"))
        by_status = queryset.values("status").annotate(count=Count("id"))

        # Calculate average rating
        average_rating = (
            queryset.filter(rating__isnull=False).aggregate(Avg("rating"))[
                "rating__avg"
            ]
            or 0
        )

        return Response(
            {
                "total": total,
                "unread": unread,
                "unassigned": unassigned,
                "pending": pending,
                "in_progress": in_progress,
                "resolved": resolved,
                "closed": closed,
                "average_rating": round(average_rating, 2),
                "by_type": list(by_type),
                "by_priority": list(by_priority),
                "by_status": list(by_status),
            }
        )

    @action(detail=False, methods=["get"])
    def sentiment_analysis(self, request):
        """Get sentiment analysis of communications"""
        from datetime import timedelta

        period = request.GET.get("period", "30d")
        days = int(period.replace("d", ""))

        start_date = timezone.now() - timedelta(days=days)
        queryset = self.get_queryset().filter(created_at__gte=start_date)

        # Basic sentiment based on ratings and keywords
        positive_count = (
            queryset.filter(
                Q(rating__gte=4)
                | Q(message__icontains="thank")
                | Q(message__icontains="great")
            )
            .distinct()
            .count()
        )

        negative_count = (
            queryset.filter(Q(rating__lte=2) | Q(communication_type="complaint"))
            .distinct()
            .count()
        )

        total = queryset.count()
        neutral_count = max(0, total - positive_count - negative_count)

        # Extract trending topics from subjects
        trending_topics = list(
            queryset.exclude(subject__isnull=True)
            .exclude(subject="")
            .values_list("subject", flat=True)[:10]
        )

        return Response(
            {
                "positive": positive_count,
                "negative": negative_count,
                "neutral": neutral_count,
                "total": total,
                "period_days": days,
                "trending_topics": trending_topics,
            }
        )

    @action(detail=False, methods=["get"])
    def campaign_stats(self, request):
        """Get email campaign statistics"""
        # TODO: Integrate with email service (SendGrid, Mailgun, etc.)
        # For now, return basic stats from communications

        queryset = self.get_queryset().filter(
            communication_type__in=["promotional", "alert", "feedback"]
        )

        total_campaigns = queryset.count()
        active_campaigns = queryset.filter(
            status__in=["pending", "in_progress"]
        ).count()

        # Placeholder for email tracking metrics
        stats = {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_sent": total_campaigns,
            "delivered": int(total_campaigns * 0.95),
            "opened": int(total_campaigns * 0.45),
            "clicked": int(total_campaigns * 0.12),
            "conversion_rate": 12.5,
        }

        return Response(stats)

    @action(detail=False, methods=["get"])
    def delivery_stats(self, request):
        """Get communication delivery statistics"""
        from datetime import timedelta

        period = request.GET.get("period", "30d")
        days = int(period.replace("d", ""))

        start_date = timezone.now() - timedelta(days=days)
        queryset = self.get_queryset().filter(created_at__gte=start_date)

        total_sent = queryset.count()

        # Placeholder stats - TODO: Integrate with actual email/SMS service
        stats = {
            "total_sent": total_sent,
            "delivered": int(total_sent * 0.95),
            "opened": int(total_sent * 0.45),
            "clicked": int(total_sent * 0.12),
            "failed": int(total_sent * 0.05),
            "pending": queryset.filter(status="pending").count(),
            "period_days": days,
        }

        return Response(stats)

    @action(detail=False, methods=["get"])
    def notifications(self, request):
        """Get communication notifications"""
        # Return system communications that are notification type
        queryset = (
            self.get_queryset()
            .filter(
                Q(communication_type="notification") | Q(communication_type="alert")
            )
            .order_by("-created_at")[:50]
        )

        serializer = CommunicationListSerializer(queryset, many=True)
        return Response({"results": serializer.data, "count": queryset.count()})

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Duplicate a communication"""
        communication = self.get_object()

        # Create a duplicate
        duplicate = Communication.objects.create(
            user=communication.user,
            subject=f"[COPY] {communication.subject}",
            message=communication.message,
            communication_type=communication.communication_type,
            priority=communication.priority,
            status="pending",
            reference_number=f"COM-{uuid.uuid4().hex[:8].upper()}",
        )

        # Copy tags and categories
        for tag_rel in communication.tag_relations.all():
            CommunicationTagRelation.objects.create(
                communication=duplicate, tag=tag_rel.tag, added_by=request.user
            )

        for cat_rel in communication.category_relations.all():
            CommunicationCategoryRelation.objects.create(
                communication=duplicate,
                category=cat_rel.category,
                added_by=request.user,
            )

        # Log activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="duplicate",
            resource_type="communication",
            resource_id=duplicate.reference_number,
            description=f"Duplicated communication {communication.reference_number} to {duplicate.reference_number}",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )

        serializer = self.get_serializer(duplicate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def send(self, request):
        """Send a new communication to users"""
        from django.contrib.auth import get_user_model

        User = get_user_model()

        user_ids = request.data.get("user_ids", [])
        subject = request.data.get("subject")
        message = request.data.get("message")
        communication_type = request.data.get("type", "notification")
        priority = request.data.get("priority", "medium")

        if not subject or not message:
            return Response(
                {"error": "Subject and message are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user_ids:
            return Response(
                {"error": "At least one user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_communications = []
        for user_id in user_ids:
            try:
                user = User.objects.get(user_id=user_id)
                comm = Communication.objects.create(
                    user=user,
                    subject=subject,
                    message=message,
                    communication_type=communication_type,
                    priority=priority,
                    reference_number=f"COM-{uuid.uuid4().hex[:8].upper()}",
                    assigned_to=request.user,
                )
                created_communications.append(comm)
            except User.DoesNotExist:
                continue

        # Log activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="send",
            resource_type="communication",
            resource_id="bulk",
            description=f"Sent {len(created_communications)} communications",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )

        return Response(
            {
                "message": f"Successfully sent {len(created_communications)} communications",
                "count": len(created_communications),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def send_detail(self, request, pk=None):
        """Send a specific communication to additional users"""
        from django.contrib.auth import get_user_model

        User = get_user_model()
        communication = self.get_object()

        user_ids = request.data.get("user_ids", [])

        if not user_ids:
            return Response(
                {"error": "At least one user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_communications = []
        for user_id in user_ids:
            try:
                user = User.objects.get(user_id=user_id)
                comm = Communication.objects.create(
                    user=user,
                    subject=communication.subject,
                    message=communication.message,
                    communication_type=communication.communication_type,
                    priority=communication.priority,
                    reference_number=f"COM-{uuid.uuid4().hex[:8].upper()}",
                    assigned_to=request.user,
                )
                created_communications.append(comm)
            except User.DoesNotExist:
                continue

        # Log activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="send",
            resource_type="communication",
            resource_id=communication.reference_number,
            description=f"Resent communication {communication.reference_number} to {len(created_communications)} users",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )

        return Response(
            {
                "message": f"Successfully sent to {len(created_communications)} users",
                "count": len(created_communications),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"])
    def bulk_update(self, request):
        """Bulk update communications"""
        communication_ids = request.data.get("communication_ids", [])
        update_data = request.data.get("update_data", {})

        if not communication_ids:
            return Response(
                {"error": "communication_ids list is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not update_data:
            return Response(
                {"error": "update_data is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_count = 0
        for comm_id in communication_ids:
            try:
                comm = Communication.objects.get(id=comm_id)
                for field, value in update_data.items():
                    if hasattr(comm, field) and field not in [
                        "id",
                        "reference_number",
                        "created_at",
                    ]:
                        setattr(comm, field, value)
                comm.save()
                updated_count += 1
            except Communication.DoesNotExist:
                continue

        # Log activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="bulk_update",
            resource_type="communication",
            resource_id="bulk",
            description=f"Bulk updated {updated_count} communications",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )

        return Response(
            {
                "message": f"Successfully updated {updated_count} communications",
                "count": updated_count,
            }
        )

    @action(detail=False, methods=["post"])
    def send_email(self, request):
        """Send email to specific users or all users"""
        from django.conf import settings
        from django.contrib.auth import get_user_model
        from django.core.mail import send_mail

        User = get_user_model()

        user_ids = request.data.get("user_ids", [])
        send_to_all = request.data.get("send_to_all", False)
        subject = request.data.get("subject")
        message = request.data.get("message")
        html_message = request.data.get("html_message")

        if not subject or not message:
            return Response(
                {"error": "Subject and message are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get recipients
        if send_to_all:
            recipients = User.objects.filter(is_active=True)
        elif user_ids:
            recipients = User.objects.filter(user_id__in=user_ids, is_active=True)
        else:
            return Response(
                {"error": "Either user_ids or send_to_all must be provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sent_count = 0
        failed_count = 0

        for user in recipients:
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_message,
                    fail_silently=False,
                )
                sent_count += 1

                # Create communication record
                Communication.objects.create(
                    user=user,
                    subject=subject,
                    message=message,
                    communication_type="email",
                    reference_number=f"COM-{uuid.uuid4().hex[:8].upper()}",
                    assigned_to=request.user,
                )
            except Exception as e:
                failed_count += 1
                continue

        # Log activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action="send_email",
            resource_type="communication",
            resource_id="email_bulk",
            description=f"Sent {sent_count} emails, {failed_count} failed",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )

        return Response(
            {
                "message": f"Successfully sent {sent_count} emails",
                "sent": sent_count,
                "failed": failed_count,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"])
    def responses(self, request, pk=None):
        """Get all responses for a communication"""
        communication = self.get_object()
        responses = communication.responses.all().order_by("-created_at")

        serializer = CommunicationResponseSerializer(responses, many=True)
        return Response({"results": serializer.data, "count": responses.count()})


class CommunicationResponseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing communication responses"""

    queryset = CommunicationResponse.objects.all()
    serializer_class = CommunicationResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(responder=self.request.user)

        # Mark communication as read
        communication = serializer.validated_data["communication"]
        communication.mark_as_read()

        # Log activity
        AdminActivityLog.objects.create(
            admin=self.request.user,
            action="create",
            resource_type="communication_response",
            resource_id=str(communication.reference_number),
            description=f"Added response to communication {communication.reference_number}",
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT"),
        )


class CommunicationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing communication templates"""

    queryset = CommunicationTemplate.objects.all()
    serializer_class = CommunicationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

        # Log activity
        template = serializer.instance
        AdminActivityLog.objects.create(
            admin=self.request.user,
            action="create",
            resource_type="communication_template",
            resource_id=str(template.id),
            description=f"Created communication template: {template.name}",
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT"),
        )

    @action(detail=True, methods=["post"])
    def apply_template(self, request, pk=None):
        """Apply template to create a new communication"""
        template = self.get_object()
        communication_id = request.data.get("communication_id")

        try:
            communication = Communication.objects.get(id=communication_id)

            # Create response using template
            response = CommunicationResponse.objects.create(
                communication=communication,
                responder=request.user,
                message=template.content,  # You might want to process variables here
                is_internal=False,
            )

            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action="create",
                resource_type="communication_response",
                resource_id=str(communication.reference_number),
                description=f"Applied template {template.name} to communication {communication.reference_number}",
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT"),
            )

            serializer = CommunicationResponseSerializer(response)
            return Response(serializer.data)

        except Communication.DoesNotExist:
            return Response(
                {"error": "Communication not found"}, status=status.HTTP_404_NOT_FOUND
            )


class CommunicationCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing communication categories"""

    queryset = CommunicationCategory.objects.all()
    serializer_class = CommunicationCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

        # Log activity
        category = serializer.instance
        AdminActivityLog.objects.create(
            admin=self.request.user,
            action="create",
            resource_type="communication_category",
            resource_id=str(category.id),
            description=f"Created communication category: {category.name}",
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT"),
        )


class CommunicationTagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing communication tags"""

    queryset = CommunicationTag.objects.all()
    serializer_class = CommunicationTagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

        # Log activity
        tag = serializer.instance
        AdminActivityLog.objects.create(
            admin=self.request.user,
            action="create",
            resource_type="communication_tag",
            resource_id=str(tag.id),
            description=f"Created communication tag: {tag.name}",
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT"),
        )
