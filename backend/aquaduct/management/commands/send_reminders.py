# backend\aquaduct\management\commands\send_reminders.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from aquaduct.models import RefillSchedule, Notification, Jug

class Command(BaseCommand):
    help = 'Send refill reminders for due jugs'

    def handle(self, *args, **options):
        now = timezone.now()
        due_schedules = RefillSchedule.objects.filter(
            status=RefillSchedule.Status.ACTIVE,
            next_reminder_at__lte=now,
            jug__status=Jug.Status.ACTIVE,
            jug__reminder_active=True
        ).select_related('jug', 'jug__owner')

        for schedule in due_schedules:
            jug = schedule.jug
            user = jug.owner
            # Show which jug triggered a reminder
            self.stdout.write(f"Reminding for jug {jug.unique_id} (owner: {user.email})")

            # Create notification
            Notification.objects.create(
                user=user,
                title='Refill Reminder',
                message=f'Your jug {jug.unique_id} is due for a refill. Please order a refill.',
                notification_type=Notification.NotificationType.REMINDER,
                order=None
            )
            # Reschedule next reminder
            schedule.next_reminder_at = now + timedelta(days=schedule.frequency_days)
            schedule.save(update_fields=['next_reminder_at'])

        self.stdout.write(f'Sent {due_schedules.count()} refill reminders.')