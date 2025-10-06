import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const AdminDocuments = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
      } else {
        setAppointments(data);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Uploaded Appointment Documents</h1>
      <div className="space-y-4">
        {appointments.map((appt) => (
          <div key={appt.id} className="p-4 border rounded bg-white shadow-md">
            <p><strong>Name:</strong> {appt.name}</p>
            <p><strong>Email:</strong> {appt.email}</p>
            <p><strong>Date:</strong> {new Date(appt.created_at).toLocaleString()}</p>

            {appt.valid_id_url ? (
              <a
                href={appt.valid_id_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Valid ID
              </a>
            ) : (
              <p className="text-red-500">No ID uploaded</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDocuments;
