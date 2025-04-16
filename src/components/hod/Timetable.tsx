
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TimetableProps {
  role: string;
}

const Timetable = ({ role }: TimetableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetable</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{role} Timetable component placeholder</p>
      </CardContent>
    </Card>
  );
};

export default Timetable;
