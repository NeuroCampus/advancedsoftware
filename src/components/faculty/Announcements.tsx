
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface AnnouncementsProps {
  role: string;
}

const Announcements = ({ role }: AnnouncementsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{role.charAt(0).toUpperCase() + role.slice(1)} Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Announcements component placeholder for {role}</p>
      </CardContent>
    </Card>
  );
};

export default Announcements;
