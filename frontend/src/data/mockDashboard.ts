import { DashboardState } from '../api/types';

const baseState: DashboardState = {
  user: 'Wendy',
  greeting: 'Have a good day, Wendy',
  date: '2023-12-06T08:00:00',
  checklist: [
    {
      id: 'task-morning-walk',
      title: 'Morning walk by the lake',
      scheduled_for: '06:30 AM',
      completed: false,
      category: 'wellness'
    },
    {
      id: 'task-deep-work',
      title: 'Deep work: Product strategy',
      scheduled_for: '09:00 AM',
      completed: false,
      category: 'focus'
    },
    {
      id: 'task-design-review',
      title: 'Design review with Fitplan team',
      scheduled_for: '11:30 AM',
      completed: false,
      category: 'collaboration'
    },
    {
      id: 'task-evening-yoga',
      title: 'Sunset yoga flow',
      scheduled_for: '07:00 PM',
      completed: false,
      category: 'wellness'
    }
  ],
  habits: [
    {
      id: 'habit-water',
      title: 'Drink water',
      goal_per_day: 8,
      completed_today: 5,
      streak: 7,
      weekly_progress: [8, 8, 7, 6, 8, 5, 5]
    },
    {
      id: 'habit-reading',
      title: 'Read 15 minutes',
      goal_per_day: 1,
      completed_today: 0,
      streak: 3,
      weekly_progress: [1, 1, 1, 0, 1, 1, 0]
    },
    {
      id: 'habit-steps',
      title: '10k steps',
      goal_per_day: 1,
      completed_today: 0,
      streak: 5,
      weekly_progress: [1, 1, 1, 1, 1, 0, 0]
    }
  ],
  schedule: [
    {
      id: 'event-trip',
      title: 'Traveling to Switzerland',
      location: 'Zurich, Switzerland',
      start_time: '2023-12-09T05:10:00',
      end_time: '2023-12-09T11:40:00',
      cover_image: '/images/swiss-lake.svg',
      color_scheme: 'orange'
    },
    {
      id: 'event-family-camp',
      title: 'Camping at Ranca Upas',
      location: 'Bandung, Indonesia',
      start_time: '2023-12-11T08:00:00',
      end_time: '2023-12-11T11:00:00',
      cover_image: '/images/ranca-upas.svg',
      color_scheme: 'purple'
    },
    {
      id: 'event-milo-soccer',
      title: 'Milo Soccer Practice',
      location: 'Community Sports Center',
      start_time: '2023-12-06T16:00:00',
      end_time: '2023-12-06T17:30:00',
      cover_image: '/images/soccer.svg',
      color_scheme: 'teal'
    }
  ],
  progress: {
    tasks_completed: 0,
    tasks_total: 4,
    habits_completed: 1,
    habits_total: 3
  },
  group_progress: {
    group_name: 'Sunrise Striders',
    mission: 'Keep the sunrise streak alive with your closest friends.',
    challenge: {
      id: 'challenge-sunrise-circuit',
      title: '30-Day Sunrise Circuit',
      timeframe: 'Day 18 of 30',
      goal: 30,
      current: 18,
      unit: 'sessions'
    },
    leaderboard: [
      {
        id: 'wendy',
        name: 'Wendy',
        avatar_color: '#F97316',
        progress: 18,
        streak: 6
      },
      {
        id: 'nora',
        name: 'Nora',
        avatar_color: '#FDBA74',
        progress: 17,
        streak: 8
      },
      {
        id: 'theo',
        name: 'Theo',
        avatar_color: '#FBBF24',
        progress: 16,
        streak: 5
      },
      {
        id: 'mira',
        name: 'Mira',
        avatar_color: '#F97316',
        progress: 15,
        streak: 4
      }
    ],
    activity_feed: [
      {
        id: 'activity-nora-run',
        member_id: 'nora',
        summary: 'Nora logged a sunrise trail run along the coastal ridge.',
        timestamp: '2023-12-06T07:10:00',
        highlight: 'New personal best pace!',
        reactions: [
          { id: 'cheer', emoji: '🎉', label: 'Cheer', count: 4 },
          { id: 'power', emoji: '💪', label: 'Power Up', count: 2 }
        ]
      },
      {
        id: 'activity-theo-playlist',
        member_id: 'theo',
        summary: "Theo shared a 20-minute power-up playlist for tomorrow's circuit.",
        timestamp: '2023-12-06T08:45:00',
        reactions: [{ id: 'spark', emoji: '⚡', label: 'Spark', count: 3 }]
      },
      {
        id: 'activity-mira-checkin',
        member_id: 'mira',
        summary: 'Mira completed a focused breathwork reset before the design sprint.',
        timestamp: '2023-12-06T09:15:00',
        reactions: [
          { id: 'cheer', emoji: '🎉', label: 'Cheer', count: 2 },
          { id: 'spark', emoji: '⚡', label: 'Spark', count: 1 }
        ]
      }
    ],
    reaction_options: [
      { id: 'cheer', emoji: '🎉', label: 'Cheer' },
      { id: 'power', emoji: '💪', label: 'Power Up' },
      { id: 'spark', emoji: '⚡', label: 'Spark' }
    ]
  },
  daily_log: {
    date: '2023-12-06',
    focus: 'Savor the warm wins and micro-celebrations that light up today.',
    entries: [
      {
        id: 'log-sunrise-tea',
        timestamp: '2023-12-06T06:15:00',
        content: 'Sunrise stretch with jasmine tea on the balcony. The sky looked like apricot sorbet.',
        source: 'manual',
        mood: { id: 'radiant', label: 'Radiant', emoji: '🌞' },
        details: 'Recorded a quick time-lapse for our shared highlight reel.'
      },
      {
        id: 'log-morning-walk',
        timestamp: '2023-12-06T07:35:00',
        content: "✅ Completed 'Morning walk by the lake'. Breezy and golden.",
        source: 'checklist',
        related_task_id: 'task-morning-walk',
        mood: { id: 'steady', label: 'Steady', emoji: '🌤️' },
        details: 'Stopped by the bakery for cinnamon sourdough — sharing a slice later!'
      },
      {
        id: 'log-deep-work',
        timestamp: '2023-12-06T11:55:00',
        content: 'Focused sprint on product strategy. Drafted the playful launch storyboard.',
        source: 'manual',
        mood: { id: 'reflective', label: 'Reflective', emoji: '🌙' },
        details: 'Used the forest rain playlist — bookmarking it for tomorrow.'
      },
      {
        id: 'log-fitplan-celebration',
        timestamp: '2023-12-06T13:40:00',
        content: "✅ Completed 'Design review with Fitplan team'. Everyone loved the warm gradients!",
        source: 'checklist',
        related_task_id: 'task-design-review',
        mood: { id: 'radiant', label: 'Radiant', emoji: '🌞' }
      },
      {
        id: 'log-evening-preview',
        timestamp: '2023-12-06T21:15:00',
        content: "Evening wind-down: sketched tomorrow's cozy dinner table setup.",
        source: 'manual',
        mood: { id: 'steady', label: 'Steady', emoji: '🌤️' },
        details: 'Thinking candles, soft jazz, and ginger pear mocktails.'
      }
    ]
  }
};

export const mockDashboard: DashboardState = JSON.parse(JSON.stringify(baseState));

