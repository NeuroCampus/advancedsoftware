
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AnnouncementsProps {
  role: string;
}

const Announcements = ({ role }: AnnouncementsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{role} Announcements component placeholder</p>
      </CardContent>
    </Card>
  );
};

export default Announcements;
