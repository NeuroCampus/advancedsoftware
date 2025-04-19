import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
}

const NotificationsManagement = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: "System Update", message: "The system will undergo maintenance at 3 PM.", date: "2025-04-19" },
    { id: 2, title: "Holiday Notice", message: "The college will be closed for holidays on 25th April.", date: "2025-04-18" }
  ]);
  
  const [newNotification, setNewNotification] = useState({ title: "", message: "" });

  // Add notification handler
  const addNotification = () => {
    if (newNotification.title && newNotification.message) {
      const newNotif = {
        id: notifications.length + 1,
        title: newNotification.title,
        message: newNotification.message,
        date: new Date().toLocaleDateString()
      };
      setNotifications([...notifications, newNotif]);
      setNewNotification({ title: "", message: "" }); // Clear input fields
    }
  };

  // Delete notification handler
  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add New Notification Form */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-4">Add New Notification</h3>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Notification Title"
              value={newNotification.title}
              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
            <textarea
              placeholder="Notification Message"
              value={newNotification.message}
              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 text-sm"
            />
            <button
              onClick={addNotification}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Notification
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm mt-6">
          <table className="min-w-full text-xs divide-y divide-gray-200">
            <thead className="bg-gray-100 text-gray-700 uppercase font-medium">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Message</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {notifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{notification.title}</td>
                  <td className="px-4 py-3">{notification.message}</td>
                  <td className="px-4 py-3">{notification.date}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                    No notifications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsManagement;
