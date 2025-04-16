
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";  // Add this import
import {
  Download,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

// Mock data - replace with actual API data
const mockCertificates = [
  {
    id: 1,
    name: "Course Completion Certificate",
    issueDate: "2024-03-15",
    status: "issued",
    downloadUrl: "#",
  },
  {
    id: 2,
    name: "Academic Achievement Certificate",
    issueDate: "2024-02-20",
    status: "issued",
    downloadUrl: "#",
  },
];

const mockRequests = [
  {
    id: 1,
    type: "Bonafide Certificate",
    requestDate: "2024-04-01",
    status: "pending",
  },
  {
    id: 2,
    type: "Transfer Certificate",
    requestDate: "2024-03-28",
    status: "rejected",
    reason: "Invalid supporting documents",
  },
];

const CertificatesManagement = () => {
  const [activeTab, setActiveTab] = useState("view");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificates Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">View Certificates</TabsTrigger>
            <TabsTrigger value="request">Request Certificate</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-6">
            {/* Issued Certificates */}
            <div className="space-y-4">
              <h3 className="font-medium mt-4">Issued Certificates</h3>
              <div className="grid gap-4">
                {mockCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Issued on: {cert.issueDate}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pending Requests */}
              <h3 className="font-medium mt-6">Certificate Requests</h3>
              <div className="grid gap-4">
                {mockRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {request.status === "pending" ? (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        ) : request.status === "rejected" ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium">{request.type}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested on: {request.requestDate}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          request.status === "pending"
                            ? "bg-yellow-500"
                            : request.status === "rejected"
                            ? "bg-red-500"
                            : "bg-green-500"
                        }
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </Badge>
                    </div>
                    {request.reason && (
                      <p className="mt-2 text-sm text-red-600">
                        Reason: {request.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="request" className="space-y-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificate-type">Certificate Type</Label>
                <select
                  id="certificate-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select certificate type</option>
                  <option value="bonafide">Bonafide Certificate</option>
                  <option value="transfer">Transfer Certificate</option>
                  <option value="completion">Course Completion</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  type="text"
                  id="purpose"
                  placeholder="State the purpose for requesting the certificate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supporting-doc">Supporting Documents</Label>
                <Input
                  type="file"
                  id="supporting-doc"
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Upload any relevant supporting documents (if required)
                </p>
              </div>

              <Button type="submit" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CertificatesManagement;
