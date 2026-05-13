import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const socket = io(SOCKET_URL);


interface Notification {
  id: number;
  message: string;
  time: string;
}

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);

  // WebSocket listener
  useEffect(() => {
    socket.on('new_notification', (data: any) => {
      const now = new Date();
      console.log('Notificación recibida:', data);

      const newNotification: Notification = {
        id: Date.now(),
        message: data?.message || 'Nueva notificación',
        time: now.toLocaleTimeString(), // hora
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        return updated.slice(0, 5); // máximo 5
      });
    });

    return () => {
      socket.off('new_notification');
    };
  }, []);

  // Click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // ESC key
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  return (
    <li className="relative">
      
    </li>
  );
};

export default DropdownNotification;
