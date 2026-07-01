export interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  avatar: string;
  bio: string;
  availability: string[];
  price: string;
}

export interface ConsultationDB {
  id: string;
  user_id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_avatar: string;
  date_time: string;
  status: string; // Scheduled, Completed, Cancelled
  created_at: string;
}
