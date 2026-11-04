import assert from "node:assert/strict";
import { test } from "node:test";

import type { StrengthWorkout } from "../../types/workout.ts";

import { applySetEdits, validateCorrection } from "./edit-workout.ts";

const workout: StrengthWorkout = {
  id: "w",
  type: "strength",
  startedAt: 0,
  endedAt: 1,
  note: "gut",
  exercises: [
    {
      exerciseId: "bank",
      sets: [
        { id: "a", weightKg: 80, reps: 8, rpe: 8, isWarmup: false },
        { id: "b", weightKg: 800, reps: 8, rpe: null, isWarmup: false },
      ],
    },
    {
      exerciseId: "curl",
      sets: [{ id: "c", weightKg: 12, reps: 10, rpe: null, isWarmup: false }],
    },
  ],
};

test("Korrektur prüfen", () => {
  assert.equal(validateCorrection({ weightKg: 80, reps: 8 }), null);
  assert.equal(validateCorrection({ weightKg: 0, reps: 12 }), null);
  assert.match(validateCorrection({ weightKg: -1, reps: 8 }) ?? "", /Gewicht/);
  assert.match(
    validateCorrection({ weightKg: 80, reps: 0 }) ?? "",
    /Wiederholungen/,
  );
  assert.match(
    validateCorrection({ weightKg: 80, reps: 7.5 }) ?? "",
    /Wiederholungen/,
  );
});

test("Tippfehler korrigieren, Satz und leere Übung entfernen", () => {
  const edited = applySetEdits(workout, { b: { weightKg: 80, reps: 7 } }, [
    "c",
  ]);
  assert.deepEqual(edited.exercises[0].sets[1], {
    id: "b",
    weightKg: 80,
    reps: 7,
    rpe: null,
    isWarmup: false,
  });
  assert.equal(edited.exercises.length, 1);
  assert.equal(edited.note, "gut");
  // Ungültige Korrekturen werden ignoriert, das Original bleibt unverändert
  const invalid = applySetEdits(workout, { a: { weightKg: 80, reps: 0 } }, []);
  assert.equal(invalid.exercises[0].sets[0].reps, 8);
  assert.equal(workout.exercises[0].sets[1].weightKg, 800);
});
