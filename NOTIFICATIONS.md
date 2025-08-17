# Notification System

This document describes the notification system implemented for the daily report tool.

## Overview

The notification system automatically tracks missed daily reports and creates notifications for users. It excludes Saturdays from working days and follows a specific timeline for converting missed reports to leaves.

## How It Works

### Timeline Rules

1. **Today**: Users can submit reports for today
2. **Yesterday**: Users can submit reports for yesterday (if it's not Saturday)
3. **Two Working Days Ago**: If a report is still missing, it gets converted to a leave

### Saturday Exclusion

- Saturdays are automatically excluded from working day calculations
- If yesterday was Saturday, the system will check the previous Friday instead
- If two days ago was Saturday, the system will go back to the previous Friday

### Notification Types

1. **Missed Report** (`missed_report`): 
   - Triggered when yesterday's report is missing
   - Message: "Missed report for [DATE]. If not submitted today, it will be marked as leave."
   - Color: Yellow

2. **Converted to Leave** (`converted_to_leave`):
   - Triggered when a report from two working days ago is still missing
   - Message: "Report for [DATE] has been converted to leave. Submit today to avoid more leaves."
   - Color: Red

## Technical Implementation

### Components

- **`NotificationService`**: Core business logic for checking missed reports and creating notifications
- **`NotificationPanel`**: UI component for displaying notifications with mark-as-seen functionality
- **`useNotifications`**: Custom hook for managing notification state and operations

### API Endpoints

- **`/api/notifications`**: CRUD operations for notifications
- **`/api/notifications/test`**: Admin endpoint for testing and debugging

### Database Schema

Notifications are stored in a `notifications` collection with the following structure:

```typescript
interface Notification {
  _id: ObjectId;
  userId: string | ObjectId;
  message: string;
  type: 'missed_report' | 'converted_to_leave';
  date: string; // YYYY-MM-DD format
  isSeen: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage

### For Users

1. **Viewing Notifications**: Click the bell icon in the dashboard header
2. **Marking as Seen**: Click the checkmark icon on individual notifications
3. **Mark All as Seen**: Use the "Mark all as seen" button when there are unread notifications

### For Admins

1. **Monitor Notifications**: Visit `/admin/notifications` to see all system notifications
2. **Debug Issues**: Use the test endpoint to verify the system is working correctly

## Automatic Checks

The system automatically checks for missed reports:

- When the dashboard loads
- When the page becomes visible (after being hidden)
- After a report is submitted
- Every hour when the page is active

## Example Scenarios

### Scenario 1: Normal Week
- **Monday**: User submits report ✅
- **Tuesday**: User forgets to submit report ❌
- **Wednesday**: User gets notification about Tuesday's missed report
- **Thursday**: If Tuesday's report is still missing, it gets converted to leave

### Scenario 2: Weekend
- **Friday**: User submits report ✅
- **Saturday**: No reports expected (weekend)
- **Sunday**: No reports expected (weekend)
- **Monday**: User gets notification about Friday's report (if it was missing)

### Scenario 3: Report Submitted Late
- **Monday**: User forgets to submit report ❌
- **Tuesday**: User gets notification about Monday's missed report
- **Tuesday**: User submits Monday's report ✅
- **Wednesday**: No notifications (Monday's report was submitted)

## Testing

To test the notification system:

1. Create a user account
2. Skip submitting reports for a few days
3. Check the notifications panel
4. Verify notifications appear with correct messages and types
5. Test marking notifications as seen

## Troubleshooting

### Common Issues

1. **Notifications not appearing**: Check if the user has the correct ID and if the database is accessible
2. **Wrong dates**: Verify the system is using the correct timezone
3. **Saturday logic**: Ensure the Saturday exclusion is working correctly

### Debug Steps

1. Check the browser console for errors
2. Use the `/api/notifications/test` endpoint to verify data
3. Check the admin notifications page for system status
4. Verify the notification service is being called correctly

## Future Enhancements

- Email notifications
- Push notifications
- Customizable notification preferences
- Notification history and analytics
- Bulk notification management for admins
