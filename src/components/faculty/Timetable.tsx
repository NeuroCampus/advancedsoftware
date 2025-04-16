
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TimetableProps {
  role: string;
}

const Timetable = ({ role }: TimetableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{role.charAt(0).toUpperCase() + role.slice(1)} Timetable</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Timetable component placeholder for {role}</p>
      </CardContent>
    </Card>
  );
};

export default Timetable;
