from rest_framework import serializers

from .models import (
    Communication,
    CommunicationAttachment,
    CommunicationCategory,
    CommunicationResponse,
    CommunicationTag,
    CommunicationTemplate,
    Contact,
    Notification,
)


class CommunicationTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationTag
        fields = "__all__"
        read_only_fields = ("created_at", "created_by")


class CommunicationCategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = CommunicationCategory
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CommunicationCategorySerializer(
                obj.subcategories.all(), many=True
            ).data
        return []


class CommunicationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationTemplate
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by")


class CommunicationAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationAttachment
        fields = "__all__"
        read_only_fields = ("created_at", "uploaded_by")


class CommunicationResponseSerializer(serializers.ModelSerializer):
    responder = serializers.SerializerMethodField()
    communication_id = serializers.ReadOnlyField(source="communication.id")
    response = serializers.CharField(source="message", read_only=True)

    class Meta:
        model = CommunicationResponse
        fields = (
            "id",
            "communication",
            "communication_id",
            "responder",
            "message",
            "response",
            "is_internal",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "responder", "response")

    def get_responder(self, obj):
        return (
            {"id": obj.responder.id, "name": obj.responder.name}
            if obj.responder
            else None
        )


class CommunicationSerializer(serializers.ModelSerializer):
    responses = CommunicationResponseSerializer(many=True, read_only=True)
    attachments = CommunicationAttachmentSerializer(many=True, read_only=True)
    tags = CommunicationTagSerializer(many=True, read_only=True, source="tag_relations")
    categories = CommunicationCategorySerializer(
        many=True, read_only=True, source="category_relations"
    )
    user_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Communication
        fields = "__all__"
        read_only_fields = (
            "reference_number",
            "created_at",
            "updated_at",
            "resolved_at",
            "read_at",
            "is_read",
        )

    def get_user_name(self, obj):
        return obj.user.name if obj.user else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to else None

    def get_user(self, obj):
        if obj.user:
            return {
                "id": obj.user.user_id,
                "name": obj.user.name,
                "email": obj.user.email,
                "role": obj.user.role,
            }
        return None


class CommunicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""

    user_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    response_count = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Communication
        fields = (
            "id",
            "reference_number",
            "subject",
            "communication_type",
            "status",
            "priority",
            "is_read",
            "user_name",
            "assigned_to_name",
            "user",
            "created_at",
            "updated_at",
            "tags",
            "response_count",
        )

    def get_user_name(self, obj):
        return obj.user.name if obj.user else None

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to else None

    def get_user(self, obj):
        if obj.user:
            return {
                "id": obj.user.user_id,
                "name": obj.user.name,
                "email": obj.user.email,
                "role": obj.user.role,
            }
        return None

    def get_tags(self, obj):
        return [
            {
                "id": relation.tag.id,
                "name": relation.tag.name,
                "color": relation.tag.color,
            }
            for relation in obj.tag_relations.select_related("tag")
        ]

    def get_response_count(self, obj):
        return obj.responses.count()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications"""

    user_name = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    is_unread = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "notification_id",
            "subject",
            "message",
            "time",
            "status",
            "user",
            "user_name",
            "time_ago",
            "is_unread",
        ]
        read_only_fields = ["notification_id", "time", "user"]

    def get_user_name(self, obj):
        return (
            obj.user.name
            if obj.user and obj.user.name
            else (obj.user.username if obj.user else "Unknown")
        )

    def get_time_ago(self, obj):
        from datetime import timedelta

        from django.utils import timezone

        now = timezone.now()
        diff = now - obj.time

        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes}m ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours}h ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days}d ago"
        else:
            return obj.time.strftime("%b %d, %Y")

    def get_is_unread(self, obj):
        return obj.status == "Unread"


class ContactSerializer(serializers.ModelSerializer):
    """Serializer for contact form submissions"""

    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            "contact_id",
            "name",
            "email",
            "phone",
            "subject",
            "message",
            "status",
            "user",
            "user_name",
            "admin_response",
            "response_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "contact_id",
            "created_at",
            "updated_at",
            "user",
            "user_name",
        ]

    def get_user_name(self, obj):
        """Get the user's name if associated"""
        return obj.user.name if obj.user and hasattr(obj.user, "name") else None

    def validate_name(self, value):
        """Validate name field"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Name must be at least 2 characters long."
            )
        return value.strip()

    def validate_email(self, value):
        """Validate email field"""
        if not value:
            raise serializers.ValidationError("Email is required.")
        return value.lower().strip()

    def validate_message(self, value):
        """Validate message field"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Message must be at least 10 characters long."
            )
        if len(value.strip()) > 1000:
            raise serializers.ValidationError(
                "Message must be less than 1000 characters."
            )
        return value.strip()

    def create(self, validated_data):
        """Create contact with optional user association"""
        # If user is authenticated, associate the contact with the user
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user

        return super().create(validated_data)
