
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const mockData = {
  currentSemester: [
    {
      subject: "Mathematics",
      test1: 85,
      test2: 78,
      assignments: 90,
      total: 84,
    },
    {
      subject: "Physics",
      test1: 75,
      test2: 82,
      assignments: 88,
      total: 82,
    },
    // Add more subjects...
  ],
  previousSemesters: [
    {
      semester: 1,
      gpa: 3.8,
      subjects: [
        {
          subject: "Introduction to Programming",
          grade: "A",
          points: 4.0,
        },
        {
          subject: "Basic Mathematics",
          grade: "A-",
          points: 3.7,
        },
      ],
    },
    // Add more semesters...
  ],
};

const InternalMarks = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Internal Assessment</CardTitle>
          <CardDescription>
            View your internal marks and semester performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current Semester</TabsTrigger>
              <TabsTrigger value="previous">Previous Semesters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="mt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                  <div>Subject</div>
                  <div className="text-center">Test 1</div>
                  <div className="text-center">Test 2</div>
                  <div className="text-center">Assignments</div>
                  <div className="text-center">Total</div>
                </div>
                {mockData.currentSemester.map((subject, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div>{subject.subject}</div>
                    <div className="text-center">{subject.test1}</div>
                    <div className="text-center">{subject.test2}</div>
                    <div className="text-center">{subject.assignments}</div>
                    <div className="text-center font-medium">{subject.total}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="previous" className="mt-4">
              <div className="space-y-6">
                {mockData.previousSemesters.map((semester, index) => (
                  <div key={index} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Semester {semester.semester}</h3>
                      <div className="text-sm">
                        GPA: <span className="font-medium">{semester.gpa}</span>
                      </div>
                    </div>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-3 p-4 font-medium border-b">
                        <div>Subject</div>
                        <div className="text-center">Grade</div>
                        <div className="text-center">Points</div>
                      </div>
                      {semester.subjects.map((subject, subIndex) => (
                        <div
                          key={subIndex}
                          className="grid grid-cols-3 p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div>{subject.subject}</div>
                          <div className="text-center">{subject.grade}</div>
                          <div className="text-center">{subject.points}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InternalMarks;
