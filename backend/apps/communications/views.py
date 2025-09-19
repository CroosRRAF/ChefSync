from django.db.models import Q, Count
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Communication,
    CommunicationResponse,
    CommunicationTemplate,
    CommunicationCategory,
    CommunicationTag,
    CommunicationCategoryRelation,
    CommunicationTagRelation
)
from .serializers import (
    CommunicationSerializer,
    CommunicationListSerializer,
    CommunicationResponseSerializer,
    CommunicationTemplateSerializer,
    CommunicationCategorySerializer,
    CommunicationTagSerializer,
)
from apps.admin_management.models import AdminActivityLog
import uuid


class CommunicationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing communications"""
    queryset = Communication.objects.all()
    serializer_class = CommunicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return CommunicationListSerializer
        return CommunicationSerializer

    def get_queryset(self):
        """Filter communications based on query parameters"""
        queryset = self.queryset.select_related('user', 'assigned_to')
        
        # Get query parameters
        status = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        communication_type = self.request.query_params.get('type')
        is_read = self.request.query_params.get('is_read')
        search = self.request.query_params.get('search')
        assigned_to = self.request.query_params.get('assigned_to')
        category = self.request.query_params.get('category')
        tag = self.request.query_params.get('tag')
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
        if priority:
            queryset = queryset.filter(priority=priority)
        if communication_type:
            queryset = queryset.filter(communication_type=communication_type)
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        if assigned_to:
            if assigned_to == 'unassigned':
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
                Q(reference_number__icontains=search) |
                Q(subject__icontains=search) |
                Q(message__icontains=search) |
                Q(user__name__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        return queryset.distinct()

    def perform_create(self, serializer):
        # Generate unique reference number
        reference_number = f"COM-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(
            user=self.request.user,
            reference_number=reference_number
        )
        
        # Log activity
        AdminActivityLog.objects.create(
            admin=self.request.user,
            action='create',
            resource_type='communication',
            resource_id=reference_number,
            description=f'Created new communication {reference_number}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
        )

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign communication to a user"""
        communication = self.get_object()
        assignee_id = request.data.get('assignee_id')
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            assignee = User.objects.get(id=assignee_id)
            
            communication.assign_to(assignee)
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='assign',
                resource_type='communication',
                resource_id=communication.reference_number,
                description=f'Assigned communication {communication.reference_number} to {assignee.email}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            return Response({'message': f'Communication assigned to {assignee.name}'})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve communication"""
        communication = self.get_object()
        resolution_notes = request.data.get('resolution_notes')
        
        if not resolution_notes:
            return Response(
                {'error': 'Resolution notes are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        communication.resolve(resolution_notes)
        
        # Log activity
        AdminActivityLog.objects.create(
            admin=request.user,
            action='resolve',
            resource_type='communication',
            resource_id=communication.reference_number,
            description=f'Resolved communication {communication.reference_number}',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
        )
        
        return Response({'message': 'Communication resolved successfully'})

    @action(detail=True, methods=['post'])
    def add_tags(self, request, pk=None):
        """Add tags to communication"""
        communication = self.get_object()
        tag_ids = request.data.get('tag_ids', [])
        
        if not tag_ids:
            return Response(
                {'error': 'tag_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        added_tags = []
        for tag_id in tag_ids:
            try:
                tag = CommunicationTag.objects.get(id=tag_id)
                CommunicationTagRelation.objects.get_or_create(
                    communication=communication,
                    tag=tag,
                    defaults={'added_by': request.user}
                )
                added_tags.append(tag.name)
            except CommunicationTag.DoesNotExist:
                continue
        
        if added_tags:
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='update',
                resource_type='communication',
                resource_id=communication.reference_number,
                description=f'Added tags to communication {communication.reference_number}: {", ".join(added_tags)}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
        
        return Response({'message': f'Added tags: {", ".join(added_tags)}'})

    @action(detail=True, methods=['post'])
    def add_categories(self, request, pk=None):
        """Add categories to communication"""
        communication = self.get_object()
        category_ids = request.data.get('category_ids', [])
        
        if not category_ids:
            return Response(
                {'error': 'category_ids list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        added_categories = []
        for category_id in category_ids:
            try:
                category = CommunicationCategory.objects.get(id=category_id)
                CommunicationCategoryRelation.objects.get_or_create(
                    communication=communication,
                    category=category,
                    defaults={'added_by': request.user}
                )
                added_categories.append(category.name)
            except CommunicationCategory.DoesNotExist:
                continue
        
        if added_categories:
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='update',
                resource_type='communication',
                resource_id=communication.reference_number,
                description=f'Added categories to communication {communication.reference_number}: {", ".join(added_categories)}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
        
        return Response({'message': f'Added categories: {", ".join(added_categories)}'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get communication statistics"""
        total = Communication.objects.count()
        unread = Communication.objects.filter(is_read=False).count()
        unassigned = Communication.objects.filter(assigned_to__isnull=True).count()
        resolved = Communication.objects.filter(status='resolved').count()
        
        by_type = Communication.objects.values(
            'communication_type'
        ).annotate(count=Count('id'))
        
        by_priority = Communication.objects.values(
            'priority'
        ).annotate(count=Count('id'))
        
        by_status = Communication.objects.values(
            'status'
        ).annotate(count=Count('id'))
        
        return Response({
            'total': total,
            'unread': unread,
            'unassigned': unassigned,
            'resolved': resolved,
            'by_type': by_type,
            'by_priority': by_priority,
            'by_status': by_status,
        })


class CommunicationResponseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing communication responses"""
    queryset = CommunicationResponse.objects.all()
    serializer_class = CommunicationResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(responder=self.request.user)
        
        # Mark communication as read
        communication = serializer.validated_data['communication']
        communication.mark_as_read()
        
        # Log activity
        AdminActivityLog.objects.create(
            admin=self.request.user,
            action='create',
            resource_type='communication_response',
            resource_id=str(communication.reference_number),
            description=f'Added response to communication {communication.reference_number}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
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
            action='create',
            resource_type='communication_template',
            resource_id=str(template.id),
            description=f'Created communication template: {template.name}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
        )

    @action(detail=True, methods=['post'])
    def apply_template(self, request, pk=None):
        """Apply template to create a new communication"""
        template = self.get_object()
        communication_id = request.data.get('communication_id')
        
        try:
            communication = Communication.objects.get(id=communication_id)
            
            # Create response using template
            response = CommunicationResponse.objects.create(
                communication=communication,
                responder=request.user,
                message=template.content,  # You might want to process variables here
                is_internal=False
            )
            
            # Log activity
            AdminActivityLog.objects.create(
                admin=request.user,
                action='create',
                resource_type='communication_response',
                resource_id=str(communication.reference_number),
                description=f'Applied template {template.name} to communication {communication.reference_number}',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
            )
            
            serializer = CommunicationResponseSerializer(response)
            return Response(serializer.data)
            
        except Communication.DoesNotExist:
            return Response(
                {'error': 'Communication not found'},
                status=status.HTTP_404_NOT_FOUND
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
            action='create',
            resource_type='communication_category',
            resource_id=str(category.id),
            description=f'Created communication category: {category.name}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
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
            action='create',
            resource_type='communication_tag',
            resource_id=str(tag.id),
            description=f'Created communication tag: {tag.name}',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT'),
        )