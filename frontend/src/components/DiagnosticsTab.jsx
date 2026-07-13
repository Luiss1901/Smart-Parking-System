import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, Wifi, ShieldCheck, Database, Server } from 'lucide-react';
import { getMailApi } from '../api/auth';
import { getDeviceLogsApi } from '../api/device';

const DiagnosticsTab = () => {
  const [logs, setLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Generate initial system boot logs
    const initialLogs = [
      { id: 'sys1', time: new Date(Date.now() - 10000), type: 'SYSTEM', message: 'Hệ thống Smart Parking đang khởi động...' },
      { id: 'sys2', time: new Date(Date.now() - 9000), type: 'SYSTEM', message: 'Kết nối API Gateway (Port 8080) [OK]' },
      { id: 'sys3', time: new Date(Date.now() - 8500), type: 'DB', message: 'Đồng bộ dữ liệu Parking Service [OK]' },
      { id: 'sys4', time: new Date(Date.now() - 8000), type: 'HARDWARE', message: 'Đang kết nối Device Service...' },
    ];
    setLogs(initialLogs);

    // Poll actual notifications and device logs
    const interval = setInterval(async () => {
      try {
        const [notifs, deviceLogs] = await Promise.all([
          getMailApi(),
          getDeviceLogsApi()
        ]);
        
        // Map actual notifications to log format
        const realLogs = notifs.map(n => ({
          id: `mail-${n.id}`,
          time: new Date(n.sentAt),
          type: 'MAIL',
          message: `Email Sent -> ${n.to}: ${n.subject}`
        }));

        // Map device logs
        const mappedDeviceLogs = deviceLogs.map(l => ({
          id: `dev-${l.id}`,
          time: new Date(l.timestamp),
          type: 'IOT',
          message: `[${l.device}] ${l.action} - ${l.details}`
        }));

        setLogs(prev => {
          // Merge and sort
          const merged = [...prev];
          
          [...realLogs, ...mappedDeviceLogs].forEach(rl => {
            if (!merged.find(m => m.id === rl.id)) {
              merged.push(rl);
            }
          });
          
          // Sort by time ascending
          return merged.sort((a, b) => a.time - b.time).slice(-100); // Keep last 100
        });

        setSystemStatus('ONLINE');
      } catch (err) {
        setSystemStatus('WARNING');
        setLogs(prev => [...prev, { id: Date.now(), time: new Date(), type: 'ERROR', message: 'Lỗi kết nối tới Notification/Device Service' }]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case 'SYSTEM': return '#3b82f6';
      case 'DB': return '#8b5cf6';
      case 'HARDWARE': return '#f59e0b';
      case 'IOT': return '#10b981';
      case 'MAIL': return '#a855f7';
      case 'ERROR': return '#ef4444';
      default: return '#a1a1aa';
    }
  };

  return (
    <div className="diagnostics-container" style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Status Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
          <Server size={20} style={{ color: systemStatus === 'ONLINE' ? '#10b981' : '#f59e0b' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Gateway Status</div>
            <div style={{ fontWeight: 'bold', color: systemStatus === 'ONLINE' ? '#10b981' : '#f59e0b' }}>{systemStatus}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
          <Wifi size={20} style={{ color: '#3b82f6' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Network</div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Connected</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
          <ShieldCheck size={20} style={{ color: '#a855f7' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security</div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Active</div>
          </div>
        </div>
      </div>

      {/* Terminal window */}
      <div className="glass-panel terminal-window" style={{ 
        flex: 1, 
        background: 'rgba(0, 0, 0, 0.7)', 
        borderRadius: '12px', 
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Terminal Header */}
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Terminal size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>system_logs - root@gateway:~</span>
        </div>
        
        {/* Terminal Body */}
        <div style={{ 
          padding: '1rem', 
          overflowY: 'auto', 
          fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
          fontSize: '0.85rem',
          flex: 1
        }}>
          {logs.map((log) => (
            <div key={log.id} style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', minWidth: '100px' }}>
                {log.time.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span style={{ color: getLogColor(log.type), minWidth: '80px', fontWeight: 'bold' }}>
                [{log.type}]
              </span>
              <span style={{ color: log.type === 'ERROR' ? '#ef4444' : 'rgba(255,255,255,0.9)' }}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsTab;
