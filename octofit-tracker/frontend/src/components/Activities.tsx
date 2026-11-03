import { getJson } from '../api/client.js';
import { CapabilityList } from './CapabilityList.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

async function loadActivities() {
  const response = await getJson<{ activities: Activity[] }>('/api/activities');
  return response.activities;
}

export default function Activities() {
  return (
    <CapabilityList<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      loadItems={loadActivities}
      emptyText="No activities yet."
      renderItem={(activity, index) => (
        <li className="list-group-item" key={activity._id ?? index}>
          {activity.type}: {activity.minutes} minutes, {activity.points} points
        </li>
      )}
    />
  );
}
