from rest_framework import serializers
from .models import (
    Communication,
    CommunicationResponse,
    CommunicationAttachment,
    CommunicationTemplate,
    CommunicationCategory,
    CommunicationTag,
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
    responder = serializers.SerializerMethodField()
    communication_id = serializers.ReadOnlyField(source='communication.id')
    response = serializers.CharField(source='message', read_only=True)
    
    class Meta:
        model = CommunicationResponse
        fields = ('id', 'communication_id', 'responder', 'response', 'created_at', 'updated_at', 'is_resolution', 'metadata')
        read_only_fields = ('created_at', 'updated_at', 'responder')
    
    def get_responder(self, obj):
        return {
            'id': obj.responder.id,
            'name': obj.responder.name
        } if obj.responder else None


class CommunicationSerializer(serializers.ModelSerializer):
    responses = CommunicationResponseSerializer(many=True, read_only=True)
    attachments = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Communication
        fields = '__all__'
        read_only_fields = (
            'reference_number', 'created_at', 'updated_at',
            'resolved_at', 'read_at', 'is_read'
        )
    
    def get_user(self, obj):
        if obj.user and hasattr(obj.user, 'user_id') and hasattr(obj.user, 'name') and hasattr(obj.user, 'email'):
            return {
                'id': obj.user.user_id,
                'name': obj.user.name,
                'email': obj.user.email
            }
        return None
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to and hasattr(obj.assigned_to, 'name') else None
    
    def get_attachments(self, obj):
        return [attachment.file.url for attachment in obj.attachments.all() if attachment.file]
    
    def get_tags(self, obj):
        return [{
            'id': relation.tag.id,
            'name': relation.tag.name,
            'color': relation.tag.color
        } for relation in obj.tag_relations.select_related('tag') if relation.tag and hasattr(relation.tag, 'id') and hasattr(relation.tag, 'name') and hasattr(relation.tag, 'color')]
    
    def get_categories(self, obj):
        return [{
            'id': relation.category.id,
            'name': relation.category.name,
            'description': relation.category.description
        } for relation in obj.category_relations.select_related('category') if relation.category and hasattr(relation.category, 'id') and hasattr(relation.category, 'name')]


class CommunicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    user = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    response_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Communication
        fields = (
            'id', 'reference_number', 'subject', 'communication_type',
            'status', 'priority', 'is_read', 'user',
            'assigned_to_name', 'created_at', 'updated_at',
            'tags', 'response_count'
        )
    
    def get_user(self, obj):
        if obj.user and hasattr(obj.user, 'user_id') and hasattr(obj.user, 'name') and hasattr(obj.user, 'email'):
            return {
                'id': obj.user.user_id,
                'name': obj.user.name,
                'email': obj.user.email
            }
        return None
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to and hasattr(obj.assigned_to, 'name') else None
    
    def get_tags(self, obj):
        return [{
            'id': relation.tag.id,
            'name': relation.tag.name,
            'color': relation.tag.color
        } for relation in obj.tag_relations.select_related('tag') if relation.tag and hasattr(relation.tag, 'id') and hasattr(relation.tag, 'name') and hasattr(relation.tag, 'color')]
    
    def get_response_count(self, obj):
        return obj.responses.count()