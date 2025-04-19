import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MdCheck, MdClose, MdCalendarToday } from "react-icons/md"; // Importing icons from react-icons

const LeaveManagement = () => {
  const leaves = [
    {
      faculty: "Dr. John Doe",
      dateRange: "2025-04-20 to 2025-04-22",
      status: "pending",
      reason: "Medical appointment",
    },
    // Add more leave entries as needed
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faculty Leave Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaves.map((leave, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-lg shadow-md flex justify-between items-start border-l-4 border-blue-500"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{leave.faculty}</h3>
                <div className="flex items-center space-x-2 text-gray-500">
                  <MdCalendarToday className="w-4 h-4" />
                  <span>{leave.dateRange}</span>
                </div>
                <p className="text-gray-500">{leave.status}</p>
                <p className="text-gray-500">{leave.reason}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => alert("Approve leave")}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center space-x-1"
                >
                  <MdCheck className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => alert("Reject leave")}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center space-x-1"
                >
                  <MdClose className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveManagement;
