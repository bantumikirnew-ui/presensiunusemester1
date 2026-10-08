import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

// Reusable SVG Icons
const Icons = {
  User: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      ></path>
    </svg>
  ),
  Book: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 14l9-5-9-5-9 5 9 5z"
      ></path>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
      ></path>
    </svg>
  ),
  Check: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 13l4 4L19 7"
      ></path>
    </svg>
  ),
  XCircle: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  ),
  Clock: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  ),
  Dashboard: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      ></path>
    </svg>
  ),
  Cloud: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
      ></path>
    </svg>
  ),
};

const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : {};
const app =
  Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

export default function AbsensiApp() {
  const [activeTab, setActiveTab] = useState("mahasiswa");
  const [records, setRecords] = useState([]);
  const [toast, setToast] = useState(null);
  const [masterStudents, setMasterStudents] = useState([]);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    // Listen to Realtime Attendance Records
    const recordsRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "attendance_records"
    );
    const unsubRecords = onSnapshot(
      recordsRef,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Urutkan dari yang terbaru
        data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRecords(data);
      },
      (error) => console.error("Error fetching records:", error)
    );

    // Listen to Master Students List
    const studentDocRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "master_students",
      "student_list"
    );
    const unsubStudents = onSnapshot(
      studentDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setMasterStudents(docSnap.data().students || []);
        }
      },
      (error) => console.error("Error fetching students:", error)
    );

    return () => {
      unsubRecords();
      unsubStudents();
    };
  }, [user]);

  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const subjects = [
    "Bahasa Inggris",
    "Dasar Ilmu Tanah",
    "Dasar Perlindungan Tanaman",
    "Pancasila",
  ];

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const FormMahasiswa = () => {
    const [name, setName] = useState("");
    const [nim, setNim] = useState("");
    const [subject, setSubject] = useState(subjects[0]);
    const [pertemuan, setPertemuan] = useState("1");
    const [tanggal, setTanggal] = useState(
      new Date().toISOString().split("T")[0]
    );
    const [status, setStatus] = useState("Hadir");

    const handleStudentSelect = (e) => {
      const selectedNim = e.target.value;
      if (!selectedNim) {
        setName("");
        setNim("");
        return;
      }
      const student = masterStudents.find((s) => s.nim === selectedNim);
      if (student) {
        setNim(student.nim);
        setName(student.name);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!name || !nim) {
        showToast("Mohon lengkapi Nama dan NIM!", "error");
        return;
      }

      setIsSubmitting(true);

      const formattedDate = new Date(tanggal).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const newRecord = {
        name,
        nim,
        subject,
        pertemuan,
        tanggal: formattedDate,
        status,
        timestamp: new Date().toLocaleString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: Date.now(),
      };

      if (db && user) {
        try {
          await addDoc(
            collection(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "attendance_records"
            ),
            newRecord
          );
          showToast("Absensi berhasil disubmit ke Cloud!");
          setName("");
          setNim("");
          setStatus("Hadir");
        } catch (error) {
          console.error("Error adding document: ", error);
          showToast("Gagal menyimpan absensi.", "error");
        }
      } else {
        // Fallback jika tidak terhubung database
        setRecords([{ id: Date.now(), ...newRecord }, ...records]);
        showToast("Absensi berhasil disubmit (Lokal)!");
        setName("");
        setNim("");
        setStatus("Hadir");
      }
      setIsSubmitting(false);
    };

    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-gray-100">
        <div className="bg-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icons.User />
            Portal Absensi
          </h2>
          <p className="text-indigo-100 mt-1 text-sm">
            Silakan isi daftar hadir Anda hari ini.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {masterStudents.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Nama Mahasiswa
              </label>
              <div className="relative">
                <select
                  value={nim}
                  onChange={handleStudentSelect}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all bg-white"
                >
                  <option value="">-- Pilih Nama Anda --</option>
                  {masterStudents.map((mhs, idx) => (
                    <option key={idx} value={mhs.nim}>
                      {mhs.name} - {mhs.nim}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3.5 text-gray-400 pointer-events-none">
                  <Icons.User />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan Nama"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIM
                </label>
                <input
                  type="number"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="Masukkan NIM"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mata Kuliah
            </label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all bg-white"
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3.5 text-gray-400 pointer-events-none">
                <Icons.Book />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pertemuan Ke-
              </label>
              <select
                value={pertemuan}
                onChange={(e) => setPertemuan(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all bg-white"
              >
                {[...Array(16)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Pertemuan {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Kehadiran
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["Hadir", "Izin", "Sakit"].map((opt) => (
                <label
                  key={opt}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer border-2 transition-all
                    ${
                      status === opt
                        ? opt === "Hadir"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : opt === "Izin"
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                          : "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt}
                    checked={status === opt}
                    onChange={(e) => setStatus(e.target.value)}
                    className="sr-only"
                  />
                  <span className="font-semibold">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex justify-center items-center gap-2 ${
              isSubmitting
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg"
            }`}
          >
            <Icons.Check />
            {isSubmitting ? "Menyimpan ke Cloud..." : "Submit Absensi"}
          </button>
        </form>
      </div>
    );
  };

  const DashboardAdmin = () => {
    const stats = {
      total: records.length,
      hadir: records.filter((r) => r.status === "Hadir").length,
      izin: records.filter((r) => r.status === "Izin").length,
      sakit: records.filter((r) => r.status === "Sakit").length,
    };

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!window.XLSX) {
        showToast(
          "Library pembaca Excel sedang disiapkan, tunggu 1-2 detik.",
          "error"
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const wb = window.XLSX.read(data, { type: "array" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];

          const jsonData = window.XLSX.utils.sheet_to_json(ws);

          // Mengambil kolom yang mengandung kata "nama" dan "nim" atau "npm"
          const parsedStudents = jsonData
            .map((row) => {
              const keys = Object.keys(row);
              const nameKey = keys.find((k) =>
                String(k).toLowerCase().includes("nama")
              );
              const nimKey = keys.find(
                (k) =>
                  String(k).toLowerCase().includes("nim") ||
                  String(k).toLowerCase().includes("npm")
              );

              if (nameKey && nimKey) {
                return { name: String(row[nameKey]), nim: String(row[nimKey]) };
              }
              return null;
            })
            .filter(Boolean);

          if (parsedStudents.length > 0) {
            if (db && user) {
              const docRef = doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "master_students",
                "student_list"
              );
              setDoc(docRef, { students: parsedStudents })
                .then(() => {
                  showToast(
                    `Berhasil menyimpan ${parsedStudents.length} data mahasiswa ke Cloud!`
                  );
                })
                .catch((error) => {
                  console.error("Error saving students:", error);
                  showToast("Gagal menyimpan data master ke Cloud.", "error");
                });
            } else {
              setMasterStudents(parsedStudents);
              showToast(
                `Berhasil memuat ${parsedStudents.length} data mahasiswa (Lokal)!`
              );
            }
          } else {
            showToast(
              'Gagal membaca data. Pastikan Excel punya kolom judul "Nama" dan "NIM"',
              "error"
            );
          }
        } catch (error) {
          showToast("Terjadi kesalahan saat memproses file.", "error");
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = null; // Reset input agar bisa upload file yang sama berkali-kali
    };

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 bg-indigo-50/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <Icons.Book />
                Database Master Mahasiswa
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {masterStudents.length > 0
                  ? `✔️ ${masterStudents.length} Mahasiswa (DATA MHS SM 1 AGB UNU) berhasil dimuat.`
                  : "Upload file DATA MHS SM 1 AGB UNU.xlsx di sini agar absensi lebih mudah."}
              </p>
            </div>
            <label className="relative cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
              <Icons.Check />
              <span>Import Excel (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-gray-500 text-sm font-medium">Total Entry</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-green-50 p-5 rounded-2xl shadow-sm border border-green-100 flex flex-col justify-center">
            <p className="text-green-600 text-sm font-medium">Hadir</p>
            <p className="text-3xl font-bold text-green-700 mt-1">
              {stats.hadir}
            </p>
          </div>
          <div className="bg-yellow-50 p-5 rounded-2xl shadow-sm border border-yellow-100 flex flex-col justify-center">
            <p className="text-yellow-600 text-sm font-medium">Izin</p>
            <p className="text-3xl font-bold text-yellow-700 mt-1">
              {stats.izin}
            </p>
          </div>
          <div className="bg-red-50 p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-center">
            <p className="text-red-600 text-sm font-medium">Sakit</p>
            <p className="text-3xl font-bold text-red-700 mt-1">
              {stats.sakit}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Icons.Dashboard />
              Rekapitulasi Kehadiran
            </h3>
          </div>

          <div className="overflow-x-auto">
            {records.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                <Icons.Clock />
                <p className="mt-2">Belum ada data absensi hari ini.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="p-4 text-sm font-semibold text-gray-600">
                      Waktu & Tanggal
                    </th>
                    <th className="p-4 text-sm font-semibold text-gray-600">
                      Mahasiswa
                    </th>
                    <th className="p-4 text-sm font-semibold text-gray-600">
                      Mata Kuliah & Pertemuan
                    </th>
                    <th className="p-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        <p className="font-semibold text-gray-800">
                          {record.tanggal}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.timestamp} WIB
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-800">
                          {record.name}
                        </p>
                        <p className="text-xs text-gray-500">{record.nim}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        <p className="font-semibold">{record.subject}</p>
                        <p className="text-xs text-gray-500">
                          Pertemuan ke-{record.pertemuan}
                        </p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full 
                          ${
                            record.status === "Hadir"
                              ? "bg-green-100 text-green-700"
                              : record.status === "Izin"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }
                        `}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-12">
      {/* Navbar/Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Icons.Book />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Sistem Absensi</h1>
            {user && (
              <span className="ml-2 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 shadow-sm">
                <Icons.Cloud />
                Cloud Aktif
              </span>
            )}
          </div>

          <nav className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab("mahasiswa")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "mahasiswa"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Portal Mahasiswa
            </button>
            <button
              onClick={() => setActiveTab("dosen")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "dosen"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Dashboard Dosen
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "mahasiswa" ? <FormMahasiswa /> : <DashboardAdmin />}
      </main>

      {/* Toast Notification Area */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 text-white
            ${
              toast.type === "error"
                ? "bg-red-600 border-red-700"
                : "bg-green-600 border-green-700"
            }`}
          >
            {toast.type === "error" ? <Icons.XCircle /> : <Icons.Check />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Basic Inline CSS for custom animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `,
        }}
      />
    </div>
  );
}
