import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Users, UserCheck, UserPlus } from "lucide-react";

const ProctorManagement = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Proctor Assignment</h1>
        <div className="flex gap-2">
          <Button variant="outline">Auto Assign</Button>
          <Button className="bg-blue-600 text-white">Assign Manually</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proctor Assignment Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm text-gray-500">Total Faculty</p>
            <p className="text-2xl font-semibold">24</p>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm text-gray-500">Assigned Proctors</p>
            <p className="text-2xl font-semibold">22</p>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm text-gray-500">Students per Proctor (Avg)</p>
            <p className="text-2xl font-semibold">15</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="faculty" className="w-full">
        <TabsList>
          <TabsTrigger value="faculty">By Faculty</TabsTrigger>
          <TabsTrigger value="semester">By Semester</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned Students</TabsTrigger>
        </TabsList>

        <ScrollArea className="mt-4 max-h-[600px]">
          {[1, 2, 3].map((num) => (
            <Card key={num} className="mb-4">
              <CardHeader>
                <CardTitle>Dr. Faculty Name {num}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 font-medium border-b pb-2">
                  <span>Student Name</span>
                  <span>USN</span>
                  <span>Semester</span>
                  <span>Section</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  List of assigned students will appear here
                </p>
                <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                  <span>{13 + num} Students</span>
                  <Button variant="ghost" className="text-blue-600">View All</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default ProctorManagement;
