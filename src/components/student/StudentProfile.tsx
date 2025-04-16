
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface StudentProfileProps {
  user: any;
}

const StudentProfile = ({ user }: StudentProfileProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Student Profile component placeholder</p>
        <p>Username: {user?.username || "N/A"}</p>
      </CardContent>
    </Card>
  );
};

export default StudentProfile;
