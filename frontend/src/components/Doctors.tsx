import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from './UI/Card';
import type { DoctorProfile, ConsultationDB } from '../schemas/doctor';
import { 
  Star, 
  Calendar, 
  Clock, 
  CheckCircle, 
  X, 
  AlertTriangle,
  BadgeCent,
  Trash2
} from 'lucide-react';

export const Doctors: React.FC = () => {
  const { apiFetch } = useAuth();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [consultations, setConsultations] = useState<ConsultationDB[]>([]);
  
  // Modal states
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch doctors list and user consultations
  const loadData = async () => {
    try {
      const docsList: DoctorProfile[] = await apiFetch('/api/doctor/list');
      setDoctors(docsList);

      const consList: ConsultationDB[] = await apiFetch('/api/doctor/consultations');
      setConsultations(consList);
    } catch (e: any) {
      setError(e.message || "Failed to load data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBooking = (doc: DoctorProfile) => {
    setSelectedDoctor(doc);
    setSelectedSlot(doc.availability[0] || '');
    setError(null);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor) return;
    setBookingLoading(true);
    setError(null);
    try {
      const payload = {
        doctor_id: selectedDoctor.id,
        date_time: selectedSlot
      };
      await apiFetch('/api/doctor/book', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      setBookingSuccess(true);
      setTimeout(() => {
        setSelectedDoctor(null);
        setBookingSuccess(false);
        loadData(); // reload lists
      }, 2500);

    } catch (err: any) {
      setError(err.message || "Failed to book appointment.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this consultation?")) return;
    try {
      await apiFetch(`/api/doctor/consultations/${bookingId}`, {
        method: 'DELETE'
      });
      loadData(); // refresh list
    } catch (err: any) {
      alert(err.message || "Failed to cancel booking.");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-100">Nutritionists & Consultants</h2>
        <p className="text-slate-400 text-sm mt-1">Book 1-on-1 consultations with registered clinical dietitians and allergists.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Grid: Doctors list (left) + Scheduled Consultations (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Doctors Profiles List (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-200">Available Professionals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors.map((doc) => (
              <Card key={doc.id} className="flex flex-col justify-between border border-slate-900 bg-slate-900/10 hover:border-slate-800 transition-all duration-300">
                <div className="space-y-4">
                  {/* Doctor Details */}
                  <div className="flex gap-4">
                    <img 
                      src={doc.avatar} 
                      alt={doc.name} 
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-800 flex-shrink-0" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">{doc.name}</h4>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">{doc.specialty}</p>
                      
                      {/* Rating and Experience */}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-yellow-400 text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="font-bold">{doc.rating}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">{doc.experience} exp</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-900/60 pt-3">
                    {doc.bio}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <BadgeCent className="w-4 h-4 text-emerald-500" />
                      {doc.price} / session
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => handleOpenBooking(doc)}
                  className="w-full mt-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-all"
                >
                  Schedule Appointment
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Scheduled Consultations List (1 col) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-200">Scheduled Consultations</h3>
          
          {consultations.length > 0 ? (
            <div className="space-y-4">
              {consultations.map((booking) => (
                <Card key={booking.id} className="p-4 border border-slate-900 flex flex-col gap-3 relative group">
                  <div className="flex gap-3">
                    <img 
                      src={booking.doctor_avatar} 
                      alt={booking.doctor_name} 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-850" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{booking.doctor_name}</h4>
                      <p className="text-[10px] text-emerald-400 font-medium">{booking.doctor_specialty}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {booking.date_time}
                    </div>

                    <button 
                      onClick={() => handleCancelBooking(booking.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all opacity-80 group-hover:opacity-100"
                      title="Cancel Consultation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="glass p-8 rounded-3xl border border-slate-900 text-center flex flex-col items-center justify-center min-h-[200px]">
              <Calendar className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-slate-500 text-xs font-semibold">No bookings yet.</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[180px]">Select a dietitian on the left to schedule a session.</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Dialogue Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass w-full max-w-md rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Success state display */}
            {bookingSuccess ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                <CheckCircle className="w-16 h-16 text-emerald-400 animate-bounce" />
                <h3 className="text-xl font-bold text-slate-100">Consultation Scheduled!</h3>
                <p className="text-xs text-slate-400">Your session with {selectedDoctor.name} has been successfully booked.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-900 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Schedule Session</h3>
                    <p className="text-xs text-slate-400">Choose a consultation window</p>
                  </div>
                  <button 
                    onClick={() => setSelectedDoctor(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Doctor Card Profile Summary */}
                  <div className="flex gap-3 bg-slate-900/30 p-3 rounded-2xl border border-slate-900">
                    <img 
                      src={selectedDoctor.avatar} 
                      alt={selectedDoctor.name} 
                      className="w-10 h-10 rounded-xl object-cover" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs">{selectedDoctor.name}</h4>
                      <p className="text-[10px] text-emerald-400 font-medium">{selectedDoctor.specialty}</p>
                    </div>
                  </div>

                  {/* Choose availability slots */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Slots</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedDoctor.availability.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs text-left transition-all ${
                            selectedSlot === slot 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.03)]' 
                              : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {slot}
                          </div>
                          {selectedSlot === slot && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-900 flex justify-end gap-3 bg-slate-950/40">
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                  >
                    {bookingLoading ? 'Scheduling...' : 'Confirm Appointment'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
