from rest_framework import serializers
from .models import (
    Communication,
    CommunicationResponse,
    CommunicationAttachment,
    CommunicationTemplate,
    CommunicationCategory,
    CommunicationTag,
    Notification,
)


class CommunicationTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationTag
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by')


class CommunicationCategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunicationCategory
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
    
    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CommunicationCategorySerializer(obj.subcategories.all(), many=True).data
        return []


class CommunicationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')


class CommunicationAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationAttachment
        fields = '__all__'
        read_only_fields = ('created_at', 'uploaded_by')


class CommunicationResponseSerializer(serializers.ModelSerializer):
    responder_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunicationResponse
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'responder')
    
    def get_responder_name(self, obj):
        return obj.responder.name if obj.responder else None


class CommunicationSerializer(serializers.ModelSerializer):
    responses = CommunicationResponseSerializer(many=True, read_only=True)
    attachments = CommunicationAttachmentSerializer(many=True, read_only=True)
    tags = CommunicationTagSerializer(many=True, read_only=True, source='tag_relations')
    categories = CommunicationCategorySerializer(many=True, read_only=True, source='category_relations')
    user_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Communication
        fields = '__all__'
        read_only_fields = (
            'reference_number', 'created_at', 'updated_at',
            'resolved_at', 'read_at', 'is_read'
        )
    
    def get_user_name(self, obj):
        return obj.user.name if obj.user else None
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to else None


class CommunicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    user_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    response_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Communication
        fields = (
            'id', 'reference_number', 'subject', 'communication_type',
            'status', 'priority', 'is_read', 'user_name',
            'assigned_to_name', 'created_at', 'updated_at',
            'tags', 'response_count'
        )
    
    def get_user_name(self, obj):
        return obj.user.name if obj.user else None
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to else None
    
    def get_tags(self, obj):
        return [{
            'id': relation.tag.id,
            'name': relation.tag.name,
            'color': relation.tag.color
        } for relation in obj.tag_relations.select_related('tag')]
    
    def get_response_count(self, obj):
        return obj.responses.count()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications"""
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('notification_id', 'time')
    
    def get_user_name(self, obj):
        return obj.user.first_name or obj.user.username if obj.user else None