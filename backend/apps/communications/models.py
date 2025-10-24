from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()


class Contact(models.Model):
    """Simple contact form model based on SQL schema"""

    contact_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    message = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    subject = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("new", "New"),
            ("read", "Read"),
            ("replied", "Replied"),
            ("resolved", "Resolved"),
        ],
        default="new",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Contact from {self.name} - {self.email}"

    def mark_as_read(self):
        """Mark contact as read"""
        if self.status == "new":
            self.status = "read"
            self.save()

    def mark_as_replied(self):
        """Mark contact as replied"""
        self.status = "replied"
        self.save()

    class Meta:
        db_table = "Contact"
        ordering = ["-created_at"]


class Notification(models.Model):
    """User notification model based on SQL schema"""

    STATUS_CHOICES = [
        ("Read", "Read"),
        ("Unread", "Unread"),
    ]

    notification_id = models.AutoField(primary_key=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    time = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Unread")
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"Notification for {self.user.name}: {self.subject}"

    class Meta:
        db_table = "Notification"
        ordering = ["-time"]


class Communication(models.Model):
    """Model for handling all types of communications"""

    COMMUNICATION_TYPE = [
        ("feedback", "Feedback"),
        ("complaint", "Complaint"),
        ("suggestion", "Suggestion"),
        ("inquiry", "Inquiry"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="communications"
    )
    communication_type = models.CharField(
        max_length=20, choices=COMMUNICATION_TYPE, default="feedback"
    )
    subject = models.CharField(max_length=255)
    message = models.TextField()
    reference_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="medium"
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_communications",
    )
    resolution_notes = models.TextField(blank=True)
    rating = models.IntegerField(null=True, blank=True, help_text="Rating from 1-5")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["communication_type", "status"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["reference_number"]),
            models.Index(fields=["priority", "status"]),
        ]

    def __str__(self):
        return f"{self.reference_number} - {self.subject}"

    def mark_as_read(self):
        """Mark communication as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()

    def assign_to(self, user):
        """Assign communication to a user"""
        self.assigned_to = user
        self.save()

    def resolve(self, resolution_notes):
        """Resolve the communication"""
        self.status = "resolved"
        self.resolution_notes = resolution_notes
        self.resolved_at = timezone.now()
        self.save()

    def update_status(self, new_status, admin_user, notes=None):
        """Update communication status and send notifications"""
        from django.utils import timezone

        old_status = self.status
        self.status = new_status

        # Update timestamps and assignments based on status
        if new_status == "in_progress" and old_status == "pending":
            self.assigned_to = admin_user
        elif new_status == "resolved":
            self.resolved_at = timezone.now()
            if notes:
                self.resolution_notes = notes
        elif new_status == "closed":
            if not self.resolved_at:
                self.resolved_at = timezone.now()

        self.save()

        # Send notification to user
        self._send_status_change_notification(old_status, new_status, admin_user, notes)

        return True

    def _send_status_change_notification(
        self, old_status, new_status, admin_user, notes=None
    ):
        """Send notification to user about status change"""
        try:
            from .services.communication_notification_service import (
                CommunicationNotificationService,
            )

            notification_service = CommunicationNotificationService()
            notification_service.send_status_change_notification(
                communication=self,
                old_status=old_status,
                new_status=new_status,
                admin_user=admin_user,
                notes=notes,
            )
        except Exception as e:
            # Log error but don't fail the status update
            print(f"Failed to send status change notification: {e}")
            pass


class CommunicationResponse(models.Model):
    """Model for tracking responses to communications"""

    communication = models.ForeignKey(
        Communication, on_delete=models.CASCADE, related_name="responses"
    )
    responder = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="communication_responses"
    )
    message = models.TextField()
    is_internal = models.BooleanField(default=False)  # For internal notes
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["communication", "created_at"]),
            models.Index(fields=["responder", "created_at"]),
        ]

    def __str__(self):
        return f"Response to {self.communication.reference_number}"


class CommunicationAttachment(models.Model):
    """Model for handling attachments in communications"""

    communication = models.ForeignKey(
        Communication, on_delete=models.CASCADE, related_name="attachments"
    )
    file = models.FileField(upload_to="communication_attachments/%Y/%m/")
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.IntegerField()  # Size in bytes
    uploaded_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="uploaded_attachments"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["communication", "created_at"]),
        ]

    def __str__(self):
        return f"{self.filename} - {self.communication.reference_number}"


class CommunicationTemplate(models.Model):
    """Model for storing response templates"""

    TEMPLATE_TYPE = [
        ("feedback", "Feedback Response"),
        ("complaint", "Complaint Response"),
        ("inquiry", "Inquiry Response"),
        ("general", "General Response"),
        ("resolution", "Resolution Response"),
        ("acknowledgment", "Acknowledgment"),
    ]

    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPE)
    subject = models.CharField(max_length=255)
    content = models.TextField()
    variables = models.JSONField(
        default=dict, help_text="Template variables in JSON format"
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_templates"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["template_type", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.template_type}"


class CommunicationCategory(models.Model):
    """Model for categorizing communications"""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subcategories",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Communication Categories"
        indexes = [
            models.Index(fields=["parent", "is_active"]),
        ]

    def __str__(self):
        return self.name


class CommunicationTag(models.Model):
    """Model for tagging communications"""

    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#007bff")
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_tags"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return self.name


# Through model for many-to-many relationship between Communication and Category
class CommunicationCategoryRelation(models.Model):
    """Through model for communication categories"""

    communication = models.ForeignKey(
        Communication, on_delete=models.CASCADE, related_name="category_relations"
    )
    category = models.ForeignKey(
        CommunicationCategory,
        on_delete=models.CASCADE,
        related_name="communication_relations",
    )
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("communication", "category")
        indexes = [
            models.Index(fields=["communication", "category"]),
        ]

    def __str__(self):
        return f"{self.communication.reference_number} - {self.category.name}"


# Through model for many-to-many relationship between Communication and Tag
class CommunicationTagRelation(models.Model):
    """Through model for communication tags"""

    communication = models.ForeignKey(
        Communication, on_delete=models.CASCADE, related_name="tag_relations"
    )
    tag = models.ForeignKey(
        CommunicationTag,
        on_delete=models.CASCADE,
        related_name="communication_relations",
    )
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("communication", "tag")
        indexes = [
            models.Index(fields=["communication", "tag"]),
        ]

    def __str__(self):
        return f"{self.communication.reference_number} - {self.tag.name}"
