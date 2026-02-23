import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

export default function AttendanceScanner() {
    const { id: eventId } = useParams();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [tab, setTab] = useState('scanner');
    const [manualTicket, setManualTicket] = useState('');
    const html5QrCodeRef = useRef(null);
    const scannerContainerId = 'qr-reader';

    useEffect(() => { fetchDashboard(); }, [eventId]);

    useEffect(() => {
        return () => {
            stopCamera();
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

    const startCamera = async () => {
        try {
            const html5QrCode = new Html5Qrcode(scannerContainerId);
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    stopCamera();
                    processQRData(decodedText);
                },
                () => { } // ignore errors during scanning
            );
            setScanning(true);
        } catch (err) {
            toast.error('Camera access denied or not available.');
        }
    };

    const stopCamera = async () => {
        try {
            if (html5QrCodeRef.current) {
                const state = html5QrCodeRef.current.getState();
                // State 2 = SCANNING, State 3 = PAUSED
                if (state === 2 || state === 3) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            }
        } catch (e) {
            // Ignore cleanup errors
        }
        setScanning(false);
    };

    // File upload scanning via html5-qrcode
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const html5QrCode = new Html5Qrcode('qr-file-reader');
            const result = await html5QrCode.scanFile(file, true);
            processQRData(result);
            html5QrCode.clear();
        } catch {
            toast.error('No QR code found in image. Try manual entry.');
        }
        e.target.value = '';
    };

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

    if (loading) return <div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" /></div>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black">Attendance</h1>
                    {dashboard && <p className="text-gray-500 text-sm">{dashboard.eventName}</p>}
                </div>
                {dashboard && (
                    <div className="flex gap-3 items-center">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-black">{dashboard.scanned}</p>
                            <p className="text-xs text-gray-500">Scanned</p>
                        </div>
                        <div className="text-gray-400">/</div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-black">{dashboard.total}</p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-50 border border-gray-200 border rounded p-1 mb-6">
                {['scanner', 'scanned', 'not-scanned'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-2 rounded text-sm font-medium cursor-pointer  ${tab === t ? 'bg-black text-white-important text-white shadow shadow -200' : 'text-gray-500 hover:text-white'
                            }`}>
                        {t === 'scanner' ? 'Scanner' : t === 'scanned' ? `Scanned (${dashboard?.scanned || 0})` : `Not Scanned (${dashboard?.notScanned || 0})`}
                    </button>
                ))}
            </div>

            {/* Scanner Tab */}
            {tab === 'scanner' && (
                <div className="space-y-4">
                    {/* Camera Scanner */}
                    <div className="bg-gray-50 border border-gray-200 border rounded p-6">
                        <h3 className="text-black font-medium text-sm mb-3">Camera Scanner</h3>
                        <div id={scannerContainerId} className="rounded overflow-hidden mb-3" style={{ maxHeight: '350px' }} />
                        {/* Hidden div for file scanning */}
                        <div id="qr-file-reader" style={{ display: 'none' }} />
                        <div className="flex gap-2">
                            {!scanning ? (
                                <button onClick={startCamera} className="px-4 py-2 bg-black text-white-important hover:bg-gray-900 text-white rounded text-sm cursor-pointer ">
                                    Start Camera
                                </button>
                            ) : (
                                <button onClick={stopCamera} className="px-4 py-2 bg-gray-200 text-black hover:bg-gray-300/70 rounded text-sm cursor-pointer ">
                                    Stop Camera
                                </button>
                            )}
                            <label className="px-4 py-2 bg-gray-100 hover:bg-gray-300 text-black rounded text-sm cursor-pointer ">
                                Upload QR Image
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Manual Ticket Entry */}
                    <div className="bg-gray-50 border border-gray-200 border rounded p-6">
                        <h3 className="text-black font-medium text-sm mb-3">Manual Ticket Entry</h3>
                        <div className="flex gap-2">
                            <input type="text" value={manualTicket} onChange={e => setManualTicket(e.target.value)}
                                placeholder="Enter Ticket ID" onKeyDown={e => e.key === 'Enter' && handleManualScan()}
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 border rounded text-black text-sm focus:outline-none focus:border-black font-mono" />
                            <button onClick={handleManualScan} className="px-4 py-2.5 bg-gray-100/40 text-black hover:bg-gray-300/60 rounded text-sm cursor-pointer ">
                                Verify
                            </button>
                        </div>
                    </div>

                    {/* Last Scan Result */}
                    {scanResult && (
                        <div className={`border rounded p-4 ${scanResult.success ? 'bg-gray-100/15 border-gray-300/40' : 'bg-gray-100/15 border-gray-300/40'}`}>
                            {scanResult.success ? (
                                <div>
                                    <p className="text-black font-medium">{scanResult.data.message}</p>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {scanResult.data.participant?.name} — {scanResult.data.participant?.email}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-black font-medium">{scanResult.message}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Scanned Tab */}
            {tab === 'scanned' && (
                <div className="bg-gray-50 border border-gray-200 border rounded overflow-hidden">
                    <div className="p-4 border-b border-gray-200 border flex justify-between items-center">
                        <h3 className="text-black font-medium text-sm">Scanned Participants</h3>
                        <button onClick={handleExport} className="px-3 py-1.5 bg-gray-100/40 text-black hover:bg-gray-300/60 text-sm rounded cursor-pointer ">
                            Export CSV
                        </button>
                    </div>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 border text-gray-500 text-left">
                            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Scanned At</th>
                            <th className="px-4 py-3">Method</th>
                        </tr></thead>
                        <tbody>
                            {dashboard?.attendances?.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No scans yet</td></tr>
                            ) : dashboard?.attendances?.map((a, i) => (
                                <tr key={i} className="border-b border-gray-200 border">
                                    <td className="px-4 py-3 text-black">{a.participantName}</td>
                                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{a.ticketId?.substring(0, 8)}...</td>
                                    <td className="px-4 py-3 text-gray-500">{new Date(a.scannedAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded ${a.method === 'qr' ? 'bg-gray-100/40 text-black font-medium' : 'bg-gray-100 text-black'}`}>
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
                <div className="bg-gray-50 border border-gray-200 border rounded overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 border text-gray-500 text-left">
                            <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Action</th>
                        </tr></thead>
                        <tbody>
                            {dashboard?.notScannedList?.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Everyone has been scanned!</td></tr>
                            ) : dashboard?.notScannedList?.map((p, i) => (
                                <tr key={i} className="border-b border-gray-200 border">
                                    <td className="px-4 py-3 text-black">{p.participantName}</td>
                                    <td className="px-4 py-3 text-gray-600">{p.email}</td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.ticketId?.substring(0, 8)}...</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleManualOverride(p.registrationId)}
                                            className="px-3 py-1 bg-gray-100/20 text-black hover:bg-gray-300/40 text-xs rounded cursor-pointer ">
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
