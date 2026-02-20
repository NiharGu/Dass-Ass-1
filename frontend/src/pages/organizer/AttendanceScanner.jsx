import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function AttendanceScanner() {
    const { id: eventId } = useParams();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [tab, setTab] = useState('scanner');
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => { fetchDashboard(); }, [eventId]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/attendance/${eventId}/dashboard`);
            setDashboard(res.data);
        } catch (err) { toast.error('Failed to load attendance data'); }
        finally { setLoading(false); }
    };

    const processQRData = async (data) => {
        try {
            const parsed = JSON.parse(data);
            const res = await API.post('/attendance/scan', {
                ticketId: parsed.ticketId,
                eventId
            });
            setScanResult({ success: true, data: res.data });
            toast.success(res.data.message);
            fetchDashboard();
        } catch (err) {
            const msg = err.response?.data?.message || 'Scan failed';
            setScanResult({ success: false, message: msg });
            toast.error(msg);
        }
    };

    // Camera scanning
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setScanning(true);

            // Use BarcodeDetector API if available, else fallback
            if ('BarcodeDetector' in window) {
                const detector = new BarcodeDetector({ formats: ['qr_code'] });
                const scanLoop = async () => {
                    if (!videoRef.current || !scanning) return;
                    try {
                        const barcodes = await detector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            stopCamera();
                            processQRData(barcodes[0].rawValue);
                            return;
                        }
                    } catch { }
                    requestAnimationFrame(scanLoop);
                };
                requestAnimationFrame(scanLoop);
            }
        } catch (err) {
            toast.error('Camera access denied. Use file upload instead.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setScanning(false);
    };

    // File upload scanning
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Use canvas to read QR from image
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            if ('BarcodeDetector' in window) {
                try {
                    const detector = new BarcodeDetector({ formats: ['qr_code'] });
                    const barcodes = await detector.detect(canvas);
                    if (barcodes.length > 0) {
                        processQRData(barcodes[0].rawValue);
                    } else {
                        toast.error('No QR code found in image');
                    }
                } catch {
                    toast.error('Failed to scan image. Try manual entry.');
                }
            } else {
                toast.error('QR scanning not supported in this browser. Use manual entry.');
            }
        };
        img.src = URL.createObjectURL(file);
        e.target.value = '';
    };

    // Manual ticket ID entry
    const [manualTicket, setManualTicket] = useState('');
    const handleManualScan = async () => {
        if (!manualTicket.trim()) return;
        try {
            const res = await API.post('/attendance/scan', {
                ticketId: manualTicket.trim(),
                eventId
            });
            setScanResult({ success: true, data: res.data });
            toast.success(res.data.message);
            setManualTicket('');
            fetchDashboard();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid ticket');
        }
    };

    const handleManualOverride = async (registrationId) => {
        try {
            await API.post('/attendance/manual', { registrationId, eventId });
            toast.success('Manual attendance marked');
            fetchDashboard();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const handleExport = async () => {
        try {
            const res = await API.get(`/attendance/${eventId}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-${eventId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('CSV downloaded');
        } catch { toast.error('Export failed'); }
    };

    if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Attendance Scanner</h1>
                    {dashboard && <p className="text-gray-400 text-sm">{dashboard.eventName}</p>}
                </div>
                {dashboard && (
                    <div className="flex gap-3 items-center">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{dashboard.scanned}</p>
                            <p className="text-xs text-gray-400">Scanned</p>
                        </div>
                        <div className="text-gray-600">/</div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{dashboard.total}</p>
                            <p className="text-xs text-gray-400">Total</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-6">
                {['scanner', 'scanned', 'not-scanned'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-2 rounded-md text-sm font-medium cursor-pointer transition ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                            }`}>
                        {t === 'scanner' ? 'Scanner' : t === 'scanned' ? `Scanned (${dashboard?.scanned || 0})` : `Not Scanned (${dashboard?.notScanned || 0})`}
                    </button>
                ))}
            </div>

            {/* Scanner Tab */}
            {tab === 'scanner' && (
                <div className="space-y-4">
                    {/* Camera Scanner */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-white font-medium mb-3">Camera Scanner</h3>
                        <div className="relative bg-gray-800 rounded-xl overflow-hidden mb-3" style={{ maxHeight: '300px' }}>
                            <video ref={videoRef} className="w-full" style={{ maxHeight: '300px', objectFit: 'cover' }} />
                            {!scanning && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-gray-500 text-sm">Camera not active</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {!scanning ? (
                                <button onClick={startCamera} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm cursor-pointer transition">
                                    Start Camera
                                </button>
                            ) : (
                                <button onClick={stopCamera} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm cursor-pointer transition">
                                    Stop Camera
                                </button>
                            )}
                            <button onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm cursor-pointer transition">
                                Upload QR Image
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </div>
                    </div>

                    {/* Manual Ticket Entry */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-white font-medium mb-3">Manual Ticket Entry</h3>
                        <div className="flex gap-2">
                            <input type="text" value={manualTicket} onChange={e => setManualTicket(e.target.value)}
                                placeholder="Enter Ticket ID" onKeyDown={e => e.key === 'Enter' && handleManualScan()}
                                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                            <button onClick={handleManualScan} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm cursor-pointer transition">
                                Verify
                            </button>
                        </div>
                    </div>

                    {/* Last Scan Result */}
                    {scanResult && (
                        <div className={`border rounded-2xl p-4 ${scanResult.success ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                            {scanResult.success ? (
                                <div>
                                    <p className="text-green-400 font-medium">✓ {scanResult.data.message}</p>
                                    <p className="text-gray-300 text-sm mt-1">
                                        {scanResult.data.participant?.name} — {scanResult.data.participant?.email}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-red-400 font-medium">✗ {scanResult.message}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Scanned Tab */}
            {tab === 'scanned' && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <h3 className="text-white font-medium">Scanned Participants</h3>
                        <button onClick={handleExport} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg cursor-pointer transition">
                            Export CSV
                        </button>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-800 text-gray-400 text-left">
                            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Scanned At</th>
                            <th className="px-4 py-3">Method</th>
                        </tr></thead>
                        <tbody>
                            {dashboard?.attendances?.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No scans yet</td></tr>
                            ) : dashboard?.attendances?.map((a, i) => (
                                <tr key={i} className="border-b border-gray-800">
                                    <td className="px-4 py-3 text-white">{a.participantName}</td>
                                    <td className="px-4 py-3 text-gray-300">{a.email}</td>
                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{a.ticketId?.substring(0, 8)}...</td>
                                    <td className="px-4 py-3 text-gray-400">{new Date(a.scannedAt).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.method === 'qr' ? 'bg-blue-900 text-blue-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                            {a.method}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Not Scanned Tab */}
            {tab === 'not-scanned' && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-800 text-gray-400 text-left">
                            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Action</th>
                        </tr></thead>
                        <tbody>
                            {dashboard?.notScannedList?.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Everyone has been scanned!</td></tr>
                            ) : dashboard?.notScannedList?.map((p, i) => (
                                <tr key={i} className="border-b border-gray-800">
                                    <td className="px-4 py-3 text-white">{p.participantName}</td>
                                    <td className="px-4 py-3 text-gray-300">{p.email}</td>
                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.ticketId?.substring(0, 8)}...</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleManualOverride(p.registrationId)}
                                            className="px-3 py-1 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 text-xs rounded-lg cursor-pointer transition">
                                            Manual Check-in
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
