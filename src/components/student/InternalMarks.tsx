import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Bar } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useState } from "react";
import { Filter } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SubjectMarks {
  test_number: number;
  mark: number;
  max_mark: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    [subject: string]: SubjectMarks[];
  };
}

const InternalMarks = () => {
  const [marksData, setMarksData] = useState<ApiResponse["data"]>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    // Simulated fetch — replace with real API call
    const fetchData = async () => {
      const res: ApiResponse = {
        success: true,
        data: {
          Math: [
            { test_number: 1, mark: 85, max_mark: 100 },
            { test_number: 2, mark: 88, max_mark: 100 },
          ],
          Physics: [
            { test_number: 1, mark: 78, max_mark: 100 },
            { test_number: 2, mark: 82, max_mark: 100 },
          ],
          Chemistry: [
            { test_number: 1, mark: 91, max_mark: 100 },
            { test_number: 2, mark: 89, max_mark: 100 },
          ],
        },
      };

      setMarksData(res.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const allSubjects = Object.keys(marksData);
  const filteredSubjects = allSubjects.filter(
    (subject) =>
      (selectedSubjects.length === 0 || selectedSubjects.includes(subject)) &&
      subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = {
    labels: filteredSubjects,
    datasets: [1, 2].map((testNum) => ({
      label: `Test ${testNum}`,
      data: filteredSubjects.map(
        (subj) =>
          marksData[subj].find((t) => t.test_number === testNum)?.mark ?? 0
      ),
      backgroundColor: testNum === 1 ? "#3b82f6" : "#06b6d4",
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
    },
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Internal Marks</h2>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Filter Row */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-72"
        />
        <Button variant="outline" onClick={() => setShowFilter(true)}>
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-300 overflow-hidden">
        <div className="grid grid-cols-4 p-3 bg-gray-100 font-medium text-gray-700 text-sm border-b">
          <div>Subject</div>
          <div className="text-center">Test 1</div>
          <div className="text-center">Test 2</div>
          <div className="text-center">Average</div>
        </div>
        {filteredSubjects.map((subject, index) => {
          const tests = marksData[subject];
          const t1 = tests.find((t) => t.test_number === 1)?.mark ?? "-";
          const t2 = tests.find((t) => t.test_number === 2)?.mark ?? "-";
          const avg = ((+t1 || 0) + (+t2 || 0)) / 2;

          return (
            <div
              key={index}
              className="grid grid-cols-4 p-3 text-sm text-gray-800 border-b hover:bg-gray-50"
            >
              <div>{subject}</div>
              <div className="text-center">{t1}</div>
              <div className="text-center">{t2}</div>
              <div className="text-center font-semibold">
                {isNaN(avg) ? "-" : avg.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Dialog */}
      <Dialog open={showFilter} onOpenChange={setShowFilter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter by Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allSubjects.map((subject) => (
              <div key={subject} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedSubjects.includes(subject)}
                  onCheckedChange={() =>
                    setSelectedSubjects((prev) =>
                      prev.includes(subject)
                        ? prev.filter((s) => s !== subject)
                        : [...prev, subject]
                    )
                  }
                />
                <span className="text-sm">{subject}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 space-x-2">
            <Button onClick={() => setShowFilter(false)}>Apply</Button>
            <Button variant="secondary" onClick={() => {
              setSelectedSubjects([]);
              setSearchQuery("");
              setShowFilter(false);
            }}>
              Clear Filter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalMarks;
