import { CapabilityList } from './CapabilityList.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  reason: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
};

export default function Workouts() {
  const userEmail = 'mona@example.com';
  return (
    <CapabilityList<WorkoutSuggestion>
      title="Workout suggestions"
      description={`Recommend workouts from activity patterns for ${userEmail}.`}
      path={`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`}
      responseKey="suggestions"
      emptyText="No workout suggestions yet."
      renderItem={(workout, index) => (
        <li className="list-group-item" key={workout._id ?? index}>
          <h3 className="h5">{workout.title}</h3>
          <p>{workout.reason}</p>
          {workout.focus && <p>Focus: {workout.focus}</p>}
          {workout.minutes !== undefined && <p>Duration: {workout.minutes} minutes</p>}
          {workout.difficulty && <p>Difficulty: {workout.difficulty}</p>}
        </li>
      )}
    />
  );
}
