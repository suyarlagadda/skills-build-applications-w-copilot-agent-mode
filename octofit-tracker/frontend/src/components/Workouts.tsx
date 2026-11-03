import { getJson } from '../api/client.js';
import { CapabilityList } from './CapabilityList.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  reason: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
};

const userEmail = 'mona@example.com';

async function loadSuggestions() {
  const response = await getJson<{ suggestions: WorkoutSuggestion[] }>(
    `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`,
  );
  return response.suggestions;
}

export default function Workouts() {
  return (
    <CapabilityList<WorkoutSuggestion>
      title="Workout suggestions"
      description={`Recommend workouts from activity patterns for ${userEmail}.`}
      loadItems={loadSuggestions}
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
