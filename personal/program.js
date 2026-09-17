export const PROGRAM = [
  {
    id: "day1",
    scheduleDay: 1,
    shortName: "Lower A",
    name: "Day 1 · Lower A",
    subtitle: "Squat + kettlebell control + jumping",
    exercises: [
      { id: "incline-walk", name: "Incline walk or bike", section: "Warm-up", sets: 1, target: "2 min", kind: "time", defaultSeconds: 120, restSec: 0 },
      { id: "ankle-rock", name: "Knee-to-wall ankle rock", section: "Warm-up", sets: 1, target: "8 / side", kind: "reps", defaultReps: 8, perSide: true, restSec: 0 },
      { id: "hip-switch", name: "90/90 hip switch", section: "Warm-up", sets: 1, target: "6 / side", kind: "reps", defaultReps: 6, perSide: true, restSec: 0 },
      { id: "prying-goblet", name: "KB prying goblet squat", section: "Warm-up", sets: 2, target: "5 reps", kind: "weighted", defaultReps: 5, restSec: 30, progression: "Use an easy bell and prioritize depth/control." },
      { id: "broad-jump", name: "Low box jump or standing broad jump", section: "Power", sets: 3, target: "3 reps", kind: "reps", defaultReps: 3, restSec: 60, progression: "Keep every rep crisp; stop before jump quality drops." },
      { id: "back-squat", name: "Back squat", section: "Strength", sets: 3, target: "5 reps", kind: "weighted", defaultReps: 5, defaultWeight: 65, restSec: 180, techniqueUrl: "https://www.strengthlog.com/beginner-powerlifting-program/", progression: "If all reps are clean and the last set is RPE 8 or easier, add 5 lb next time." },
      { id: "sl-kb-rdl", name: "KB single-leg RDL", section: "Accessory", sets: 3, target: "8 / side", kind: "weighted", defaultReps: 8, defaultWeight: 20, perSide: true, restSec: 75, progression: "When all sets are controlled at the top of the rep range, use the next bell." },
      { id: "kb-reverse-lunge", name: "KB reverse lunge", section: "Accessory", sets: 2, target: "8 / side", kind: "weighted", defaultReps: 8, defaultWeight: 15, perSide: true, restSec: 60, progression: "Keep the front foot planted and control the descent." },
      { id: "suitcase-carry", name: "KB suitcase carry", section: "Carry", sets: 2, target: "20–30 m / side", kind: "distance", defaultDistance: 25, perSide: true, restSec: 45, progression: "Stay tall; do not lean away from the kettlebell." },
      { id: "cooldown-90-90", name: "90/90 + ankle mobility", section: "Cooldown", sets: 1, target: "2–3 min", kind: "time", defaultSeconds: 150, restSec: 0 }
    ]
  },
  {
    id: "day2",
    scheduleDay: 2,
    shortName: "Upper A",
    name: "Day 2 · Upper A",
    subtitle: "Bench + back + shoulder control",
    exercises: [
      { id: "row-warmup", name: "Easy row", section: "Warm-up", sets: 1, target: "2 min", kind: "time", defaultSeconds: 120, restSec: 0 },
      { id: "open-books", name: "Open-book thoracic rotation", section: "Warm-up", sets: 1, target: "6 / side", kind: "reps", defaultReps: 6, perSide: true, restSec: 0 },
      { id: "band-pullapart", name: "Band pull-apart", section: "Warm-up", sets: 1, target: "15 reps", kind: "reps", defaultReps: 15, restSec: 0 },
      { id: "kb-halo", name: "Light KB halo", section: "Warm-up", sets: 1, target: "5 each direction", kind: "reps", defaultReps: 5, perSide: true, restSec: 0 },
      { id: "scap-pushup", name: "Scapular push-up", section: "Warm-up", sets: 1, target: "8 reps", kind: "reps", defaultReps: 8, restSec: 0 },
      { id: "bench", name: "Bench press", section: "Strength", sets: 3, target: "5 reps", kind: "weighted", defaultReps: 5, defaultWeight: 45, restSec: 180, techniqueUrl: "https://www.strengthlog.com/bench-press/", progression: "If all reps are clean and the last set is RPE 8 or easier, add 2.5 lb total when microplates are available; otherwise repeat before adding 5 lb." },
      { id: "chest-supported-row", name: "Chest-supported DB row", section: "Accessory", sets: 3, target: "8 reps", kind: "weighted", defaultReps: 8, defaultWeight: 20, restSec: 90, techniqueUrl: "https://www.strengthlog.com/chest-supported-dumbbell-row/" },
      { id: "half-kneeling-kb-press", name: "Half-kneeling single-arm KB press", section: "Accessory", sets: 2, target: "8 / side", kind: "weighted", defaultReps: 8, defaultWeight: 15, perSide: true, restSec: 60, techniqueUrl: "https://www.strengthlog.com/kettlebell-press/" },
      { id: "lat-pulldown", name: "Lat pulldown or assisted pull-up", section: "Accessory", sets: 2, target: "8–10 reps", kind: "weighted", defaultReps: 8, defaultWeight: 40, restSec: 75, techniqueUrl: "https://www.strengthlog.com/lat-pulldown-with-pronated-grip/" },
      { id: "face-pull", name: "Face pull", section: "Accessory", sets: 2, target: "12–15 reps", kind: "weighted", defaultReps: 12, defaultWeight: 20, restSec: 60, techniqueUrl: "https://www.strengthlog.com/face-pull/" }
    ]
  },
  {
    id: "day3",
    scheduleDay: 4,
    shortName: "Lower B",
    name: "Day 3 · Lower B",
    subtitle: "Deadlift + power + agility",
    exercises: [
      { id: "walk-bike", name: "Walk or bike", section: "Warm-up", sets: 1, target: "2 min", kind: "time", defaultSeconds: 120, restSec: 0 },
      { id: "glute-bridge", name: "Glute bridge", section: "Warm-up", sets: 1, target: "10 reps", kind: "reps", defaultReps: 10, restSec: 0 },
      { id: "hip-hinge", name: "Hip hinge drill", section: "Warm-up", sets: 1, target: "8 reps", kind: "reps", defaultReps: 8, restSec: 0 },
      { id: "adductor-rockback", name: "Adductor rock-back", section: "Warm-up", sets: 1, target: "6 / side", kind: "reps", defaultReps: 6, perSide: true, restSec: 0 },
      { id: "light-kb-deadlift", name: "Light KB deadlift", section: "Warm-up", sets: 1, target: "8 reps", kind: "weighted", defaultReps: 8, defaultWeight: 20, restSec: 0 },
      { id: "lateral-shuffle", name: "Lateral shuffle → controlled stop", section: "Agility", sets: 3, target: "~10 sec", kind: "time", defaultSeconds: 10, restSec: 45, progression: "Weeks 1–4: controlled stops. Weeks 5–8: stronger deceleration. Weeks 9–11: controlled 5-10-5 at ~70–85%." },
      { id: "deadlift", name: "Conventional deadlift", section: "Strength", sets: 3, target: "4 reps", kind: "weighted", defaultReps: 4, defaultWeight: 85, restSec: 180, techniqueUrl: "https://www.strengthlog.com/deadlift/", progression: "If all reps are clean and the last set is RPE 8 or easier, add 5 lb next time." },
      { id: "goblet-squat", name: "KB goblet squat", section: "Accessory", sets: 3, target: "8 reps", kind: "weighted", defaultReps: 8, defaultWeight: 25, restSec: 75, techniqueUrl: "https://www.strengthlog.com/goblet-squat/" },
      { id: "kb-swing", name: "Two-hand KB swing", section: "Power", sets: 3, target: "10 reps", kind: "weighted", defaultReps: 10, defaultWeight: 25, restSec: 60, techniqueUrl: "https://www.strengthlog.com/kettlebell-swing/" },
      { id: "dead-bug", name: "Dead bug", section: "Core", sets: 2, target: "6–8 / side", kind: "reps", defaultReps: 6, perSide: true, restSec: 45 },
      { id: "lower-cooldown", name: "90/90 + ankle mobility", section: "Cooldown", sets: 1, target: "2–3 min", kind: "time", defaultSeconds: 150, restSec: 0 }
    ]
  },
  {
    id: "day4",
    scheduleDay: 6,
    shortName: "Upper B",
    name: "Day 4 · Upper B",
    subtitle: "Overhead strength + pulling + bench volume",
    exercises: [
      { id: "row-warmup-b", name: "Easy row", section: "Warm-up", sets: 1, target: "2 min", kind: "time", defaultSeconds: 120, restSec: 0 },
      { id: "wall-slide", name: "Wall slide", section: "Warm-up", sets: 1, target: "8 reps", kind: "reps", defaultReps: 8, restSec: 0 },
      { id: "kb-halo-b", name: "Light KB halo", section: "Warm-up", sets: 1, target: "5 each direction", kind: "reps", defaultReps: 5, perSide: true, restSec: 0 },
      { id: "band-pullapart-b", name: "Band pull-apart", section: "Warm-up", sets: 1, target: "15 reps", kind: "reps", defaultReps: 15, restSec: 0 },
      { id: "tgu-warmup", name: "Turkish get-up", section: "Warm-up", sets: 1, target: "1 / side, unloaded or very light", kind: "weighted", defaultReps: 1, defaultWeight: 0, perSide: true, restSec: 45, techniqueUrl: "https://www.strengthlog.com/turkish-get-up/" },
      { id: "sa-kb-ohp", name: "Single-arm KB overhead press", section: "Strength", sets: 3, target: "6–8 / side", kind: "weighted", defaultReps: 6, defaultWeight: 15, perSide: true, restSec: 90, techniqueUrl: "https://www.strengthlog.com/kettlebell-press/", progression: "If overhead pressing reproduces radiating neck/arm symptoms, stop that movement and use a more comfortable press variation after appropriate assessment." },
      { id: "assisted-pullup", name: "Assisted pull-up or lat pulldown", section: "Strength", sets: 3, target: "6–8 reps", kind: "weighted", defaultReps: 6, defaultWeight: 40, restSec: 90, techniqueUrl: "https://www.strengthlog.com/lat-pulldown-with-pronated-grip/" },
      { id: "paused-bench", name: "Paused bench press", section: "Accessory", sets: 2, target: "6–8 reps", kind: "weighted", defaultReps: 6, defaultWeight: 45, restSec: 90, techniqueUrl: "https://www.strengthlog.com/bench-press/" },
      { id: "sa-kb-row", name: "Single-arm KB row", section: "Accessory", sets: 2, target: "10 / side", kind: "weighted", defaultReps: 10, defaultWeight: 20, perSide: true, restSec: 60 },
      { id: "bottoms-up-carry", name: "Bottoms-up KB carry", section: "Carry", sets: 2, target: "15–20 m / side", kind: "distance", defaultDistance: 20, perSide: true, restSec: 60 }
    ]
  }
];

export function getScheduledDay(date = new Date()) {
  const weekday = date.getDay();
  return PROGRAM.find((day) => day.scheduleDay === weekday) || PROGRAM[0];
}

export function getProgramDay(id) {
  return PROGRAM.find((day) => day.id === id) || PROGRAM[0];
}
