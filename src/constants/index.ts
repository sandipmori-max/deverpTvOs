import { DrawerItemConfig } from '../components/types';

export const ERP_DRAWER_LIST: DrawerItemConfig[] = [
  { label: 'Home', route: 'Home', icon: 'home' },
  { label: 'My Attendance', route: 'MyAttendance', icon: 'calendar-month' },
  { label: 'Business Card', route: 'List', icon: 'assignment' },
  // { label: 'Tasks', route: 'Tasks', icon: 'calendar-month' },
  // { label: 'File Manager', route: 'File Manager', icon: 'folder' },
  { label: 'Notification', route: 'Alert', icon: 'notifications-active' },
  { label: 'Privacy Policy', route: 'Privacy Policy', icon: 'policy' },
];

export enum EPermissionTypes {
  CAMERA = 'camera',
}
