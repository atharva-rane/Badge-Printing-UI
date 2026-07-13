import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Dashboard Layout
import DashboardLayout from "./components/dashboard/layout/DashboardLayout";

// Dashboard Home
import Dashboard from "./components/dashboard/modules/Dashboard";

// Masters
import UtsavMaster from "./components/dashboard/modules/masters/UtsavMaster";
import SevaMaster from "./components/dashboard/modules/masters/SevaMaster";
import SevaCoordinatorMaster from "./components/dashboard/modules/masters/SevaCoordinatorMaster";
import ShiftMaster from "./components/dashboard/modules/masters/ShiftMaster";
import CenterMaster from "./components/dashboard/modules/masters/CenterMaster";

// Upload
import UploadRawData from "./components/dashboard/modules/upload/UploadRawData";

// Volunteer
import SevaAllocation from "./components/dashboard/modules/volunteer/SevaAllocation";
import BadgeGeneration from "./components/dashboard/modules/volunteer/BadgeGeneration";
import MarkAttendance from "./components/dashboard/modules/volunteer/MarkAttendance";

// Mails
import AlertMails from "./components/dashboard/modules/mails/AlertMails";

// Reports
import AttendanceReport from "./components/dashboard/modules/reports/AttendanceReport";

// Settings
import Settings from "./components/dashboard/modules/settings/Settings";

// Profile
import UserProfile from "./components/userProfile/UserProfile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTE */}
        <Route path="/" element={<Login />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route path="home" element={<DashboardLayout />}>
            {/* HOME */}
            <Route index element={<Dashboard />} />

            {/* MASTERS */}
            <Route path="utsav-master" element={<UtsavMaster />} />
            <Route path="seva-master" element={<SevaMaster />} />
            <Route
              path="seva-coordinator-master"
              element={<SevaCoordinatorMaster />}
            />
            <Route path="shift-master" element={<ShiftMaster />} />
            <Route path="center-master" element={<CenterMaster />} />

            {/* UPLOAD */}
            <Route path="upload-raw-data" element={<UploadRawData />} />

            {/* VOLUNTEER */}
            <Route path="seva-allocation" element={<SevaAllocation />} />
            <Route path="badge-generation" element={<BadgeGeneration />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />

            {/* MAILS */}
            <Route path="alert-mails" element={<AlertMails />} />

            {/* REPORTS */}
            <Route path="attendance-report" element={<AttendanceReport />} />

            {/* SETTINGS */}
            <Route path="settings" element={<Settings />} />

            {/* PROFILE */}
            <Route path="user-profile" element={<UserProfile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
