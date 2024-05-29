import { Notification } from "@prisma/client";

export default class NotificationResource {
    collection(notifications: Notification[]): object[] {
        return notifications.map((notification) => {
            return this.transform(notification);
        });
    }

    get(notification: Notification): object {
        return this.transform(notification);
    }

    transform(notification: Notification): object {
        return {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            json: notification.json,
        };
    }
}
