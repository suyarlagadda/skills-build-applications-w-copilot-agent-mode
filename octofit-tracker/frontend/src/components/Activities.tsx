import { CapabilityList } from './CapabilityList.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
export default function Activities() {
  return (
    <CapabilityList<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      path="/api/activities"
      responseKey="activities"
      emptyText="No activities yet."
      renderItem={(activity, index) => (
        <li className="list-group-item" key={activity._id ?? index}>
          {activity.type}: {activity.minutes} minutes, {activity.points} points
        </li>
      )}
    />
  );
}
