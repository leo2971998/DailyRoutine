import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with plugins that are used across the app in one place
// to avoid missing extensions when importing directly.
dayjs.extend(relativeTime);

export default dayjs;
