// Shared mock data store - in production, this would be your database
export interface User {
     id: string;
     name: string;
     email: string;
     password: string;
     role: string;
     department: string;
     phone: string;
     profileImage?: string;
     createdAt: string;
}

export interface Report {
     id: string;
     userId: string;
     date: string;
     content: string;
     createdAt: string;
     updatedAt: string;
}

// Mock users database
export const users: User[] = [
     {
          id: "1",
          name: "Elvik Sharma",
          email: "elvik@fishtailinfosolutions.com",
          password: "password123",
          role: "user",
          department: "Development",
          phone: "+1234567890",
          profileImage: "",
          createdAt: "2024-01-01T00:00:00Z",
     },
     {
          id: "2",
          name: "Aashish Gupta",
          email: "aashish@fishtailinfosolutions.com",
          password: "aashish123",
          role: "user",
          department: "Development",
          phone: "+1234567891",
          profileImage: "",
          createdAt: "2024-01-01T00:00:00Z",
     },
     {
          id: "3",
          name: "Rajan Rauniyar",
          email: "rajan@admin.com",
          password: "rajan123",
          role: "superadmin",
          department: "Administration",
          phone: "+1234567892",
          profileImage: "",
          createdAt: "2024-01-01T00:00:00Z",
     },
     {
          id: "4",
          name: "Rahul Rauniyar",
          email: "rahul@admin.com",
          password: "rahul123",
          role: "superadmin",
          department: "Administration",
          phone: "+1234567892",
          profileImage: "",
          createdAt: "2024-01-01T00:00:00Z",
     },
     {
          id: "5",
          name: "Tilasmi Subedi",
          email: "tilasmi@fishtailinfosolutions.com",
          password: "tilasmi123",
          role: "user",
          department: "Content",
          phone: "+1234567891",
          profileImage: "",
          createdAt: "2024-01-01T00:00:00Z",
     },
];

// Mock reports database
export const reports: Report[] = [

];

// Helper functions
export function getUserById(id: string): User | undefined {
     return users.find((user) => user.id === id);
}

export function getReportsByUserId(
     userId: string
): Report[] {
     return reports
          .filter((report) => report.userId === userId)
          .sort(
               (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
          );
}

export function getAllReportsWithUserData() {
     return reports
          .map((report) => {
               const user = getUserById(report.userId);
               return {
                    ...report,
                    userName: user?.name || "Unknown User",
                    userEmail:
                         user?.email || "Unknown Email",
                    department:
                         user?.department ||
                         "Unknown Department",
               };
          })
          .sort(
               (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
          );
}
