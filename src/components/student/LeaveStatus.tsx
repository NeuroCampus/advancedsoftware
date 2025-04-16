
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

// Mock data - replace with actual API data
const mockLeaveRequests = [
  {
    id: 1,
    type: "Medical",
    from: "2024-04-01",
    days: 2,
    status: "Approved",
    approvedBy: "Dr. Smith",
    requestedOn: "2024-03-30",
  },
  {
    id: 2,
    type: "Personal",
    from: "2024-04-10",
    days: 1,
    status: "Pending",
    requestedOn: "2024-04-08",
  },
  {
    id: 3,
    type: "Event",
    from: "2024-03-15",
    days: 3,
    status: "Rejected",
    approvedBy: "Dr. Johnson",
    requestedOn: "2024-03-12",
    reason: "Insufficient documentation",
  },
];

const statusStyles = {
  Approved: "bg-green-500",
  Pending: "bg-yellow-500",
  Rejected: "bg-red-500",
};

const LeaveStatus = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Requests Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockLeaveRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-medium">{request.type} Leave</h3>
                  <p className="text-sm text-muted-foreground">
                    From: {request.from} • {request.days} day(s)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requested on: {request.requestedOn}
                  </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <Badge
                    variant="secondary"
                    className={`${statusStyles[request.status as keyof typeof statusStyles]} text-white`}
                  >
                    {request.status}
                  </Badge>
                  {request.approvedBy && (
                    <p className="text-sm">
                      {request.status === "Approved" ? "Approved" : "Rejected"} by:{" "}
                      {request.approvedBy}
                    </p>
                  )}
                </div>
              </div>
              {request.reason && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Reason: </span>
                    {request.reason}
                  </p>
                </div>
              )}
            </div>
          ))}

          {mockLeaveRequests.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No leave requests found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveStatus;
