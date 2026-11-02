// frontend/src/mock/subscriptions.js
export const subscriptions = [
  {
    id: "1",
    name: "Streamly",
    cost: 15.99,
    lastUsed: "2 days ago",
    status: "active",
    flag: null,
    suggestion: null,
    color: "#7b6cff",
    category: "Entertainment"
  },
  {
    id: "2",
    name: "TuneWave",
    cost: 10.99,
    lastUsed: "52 days ago",
    status: "active",
    flag: "overlap",
    suggestion: "Overlaps TuneBox. Cancel to save $132/yr.",
    color: "#34f0c8",
    category: "Music"
  },
  {
    id: "3",
    name: "PixelPro",
    cost: 22.50,
    lastUsed: "today",
    status: "active",
    flag: "trial_ending",
    suggestion: "Trial ends in 2 days. Pause or cancel?",
    color: "#ff9ad5",
    category: "Design"
  },
  {
    id: "4",
    name: "FitClub",
    cost: 39.00,
    lastUsed: "41 days ago",
    status: "active",
    flag: "unused",
    suggestion: "Last check-in over a month ago. Pause membership?",
    color: "#ffb86b",
    category: "Fitness"
  },
  {
    id: "5",
    name: "CloudDrive",
    cost: 9.99,
    lastUsed: "Yesterday",
    status: "active",
    flag: null,
    suggestion: null,
    color: "#6bb7ff",
    category: "Storage"
  },
  {
    id: "6",
    name: "NewsPlus",
    cost: 12.00,
    lastUsed: "3 weeks ago",
    status: "active",
    flag: "low_usage",
    suggestion: "Only 1 article read this month. Switch to free tier?",
    color: "#c4f06b",
    category: "News"
  }
];
